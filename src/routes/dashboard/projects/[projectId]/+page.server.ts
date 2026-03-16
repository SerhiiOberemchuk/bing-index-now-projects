import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { submitIndexNowUrls } from '$lib/server/indexnow/submit';
import { discoveredUrls, indexNowSubmissions, projects, sitemaps } from '$lib/server/db/schema';
import { getProjectHealthSnapshot } from '$lib/server/monitoring/project-health';
import { canManageProjects, MANAGE_PERMISSION_ERROR } from '$lib/server/authz';
import { computeNextRunAt, isProjectSchedule, PROJECT_SCHEDULES } from '$lib/server/schedule';
import { discoverSitemapCandidates, fetchSitemapUrls } from '$lib/server/sitemap/fetch';
import { writeAuditLog } from '$lib/server/audit';
import { getRequestIp } from '$lib/server/request-ip';

const INDEXNOW_BATCH_SIZE = 10_000;
const MAX_URLS_PER_PROJECT = 10_000;
const MAX_SITEMAPS = 30;
const MAX_SITEMAP_URLS = 20_000;

export const load: PageServerLoad = async ({ params }) => {
	const db = getDb();

	const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
	if (!project) {
		throw error(404, 'Project not found');
	}

	const submissions = await db
		.select()
		.from(indexNowSubmissions)
		.where(eq(indexNowSubmissions.projectId, project.id))
		.orderBy(desc(indexNowSubmissions.createdAt))
		.limit(20);

	const health = await getProjectHealthSnapshot(db, {
		id: project.id,
		status: project.status
	});

	return {
		project,
		scheduleOptions: PROJECT_SCHEDULES,
		submissions,
		health,
		metrics: {
			totalSubmissions: health.totalSubmissions,
			failedSubmissions: health.failedSubmissions,
			submissionsLast24h: health.submissionsLast24h,
			averageStatusCode: health.averageStatusCode
		}
	};
};
const submitFormSchema = z.object({
	urlsText: z.string().trim().min(1)
});

function extractUrls(urlsText: string): string[] {
	return Array.from(
		new Set(
			urlsText
				.split(/[\n,\s]+/g)
				.map((url) => url.trim())
				.filter(Boolean)
		)
	);
}

function chunk<T>(items: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
}

async function upsertSitemapStatus(
	projectId: string,
	url: string,
	status: 'success' | 'failed',
	lastError: string | null
) {
	const db = getDb();
	await db
		.insert(sitemaps)
		.values({
			projectId,
			url,
			status,
			lastFetchedAt: new Date(),
			lastError,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: [sitemaps.projectId, sitemaps.url],
			set: {
				status,
				lastFetchedAt: new Date(),
				lastError,
				updatedAt: new Date()
			}
		});
}

type ManualAutomationResult = {
	sitemapsTried: number;
	sitemapsSucceeded: number;
	sitemapsFailed: number;
	discoveredUrlsProcessed: number;
	selectedUrlsForIndexing: number;
	submissionBatches: number;
	submissionSucceeded: number;
	submissionFailed: number;
	errors: string[];
};

async function runManualAutomation(projectId: string, domain: string): Promise<ManualAutomationResult> {
	const db = getDb();
	const result: ManualAutomationResult = {
		sitemapsTried: 0,
		sitemapsSucceeded: 0,
		sitemapsFailed: 0,
		discoveredUrlsProcessed: 0,
		selectedUrlsForIndexing: 0,
		submissionBatches: 0,
		submissionSucceeded: 0,
		submissionFailed: 0,
		errors: []
	};

	const candidates = await discoverSitemapCandidates(domain);
	result.sitemapsTried = candidates.length;

	for (const candidate of candidates) {
		try {
			const parsed = await fetchSitemapUrls({
				projectDomain: domain,
				sitemapUrl: candidate,
				maxSitemaps: MAX_SITEMAPS,
				maxUrls: MAX_SITEMAP_URLS
			});

			for (const visitedUrl of parsed.visitedSitemaps) {
				await upsertSitemapStatus(projectId, visitedUrl, 'success', null);
			}

			const sitemapRows = await db
				.select({ id: sitemaps.id, url: sitemaps.url })
				.from(sitemaps)
				.where(and(eq(sitemaps.projectId, projectId), eq(sitemaps.status, 'success')));
			const sitemapIdByUrl = new Map(sitemapRows.map((row) => [row.url, row.id]));

			for (const entry of parsed.urls) {
				await db
					.insert(discoveredUrls)
					.values({
						projectId,
						sitemapId: sitemapIdByUrl.get(entry.sourceSitemap) ?? null,
						url: entry.url,
						lastMod: entry.lastMod,
						selected: true,
						updatedAt: new Date()
					})
					.onConflictDoUpdate({
						target: [discoveredUrls.projectId, discoveredUrls.url],
						set: {
							sitemapId: sitemapIdByUrl.get(entry.sourceSitemap) ?? null,
							lastMod: entry.lastMod,
							updatedAt: new Date()
						}
					});
			}

			result.sitemapsSucceeded += 1;
			result.discoveredUrlsProcessed += parsed.urls.length;
		} catch (error) {
			result.sitemapsFailed += 1;
			const message = error instanceof Error ? error.message : 'Sitemap processing failed';
			result.errors.push(`Sitemap ${candidate}: ${message}`);
			await upsertSitemapStatus(projectId, candidate, 'failed', message);
		}
	}

	const selectedRows = await db
		.select({ id: discoveredUrls.id, url: discoveredUrls.url })
		.from(discoveredUrls)
		.where(
			and(
				eq(discoveredUrls.projectId, projectId),
				eq(discoveredUrls.selected, true),
				or(
					isNull(discoveredUrls.lastSubmittedAt),
					and(isNotNull(discoveredUrls.lastMod), gt(discoveredUrls.lastMod, discoveredUrls.lastSubmittedAt))
				)
			)
		)
		.orderBy(asc(discoveredUrls.updatedAt))
		.limit(MAX_URLS_PER_PROJECT);

	result.selectedUrlsForIndexing = selectedRows.length;
	if (selectedRows.length === 0) return result;

	const urlRowsByUrl = new Map(selectedRows.map((row) => [row.url, row.id]));
	const batches = chunk(
		selectedRows.map((row) => row.url),
		INDEXNOW_BATCH_SIZE
	);
	result.submissionBatches = batches.length;

	for (const batch of batches) {
		const submission = await submitIndexNowUrls(db, projectId, batch);
		if (submission.ok) {
			result.submissionSucceeded += 1;
			const now = new Date();
			const rowIds = batch
				.map((url) => urlRowsByUrl.get(url))
				.filter((id): id is string => typeof id === 'string');

			for (const ids of chunk(rowIds, 500)) {
				await db
					.update(discoveredUrls)
					.set({ lastSubmittedAt: now, updatedAt: now })
					.where(and(eq(discoveredUrls.projectId, projectId), inArray(discoveredUrls.id, ids)));
			}
		} else {
			result.submissionFailed += 1;
			result.errors.push(`IndexNow HTTP ${submission.statusCode ?? 'N/A'}: ${submission.responseBody.slice(0, 500)}`);
		}
	}

	return result;
}

export const actions: Actions = {
	submitUrls: async ({ request, params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const formData = await request.formData();
		const payload = {
			urlsText: String(formData.get('urlsText') ?? '')
		};

		const parsed = submitFormSchema.safeParse(payload);
		if (!parsed.success) {
			return fail(400, {
				error: 'Add at least one URL.',
				values: payload
			});
		}

		const urls = extractUrls(parsed.data.urlsText);
		if (urls.length === 0) {
			return fail(400, {
				error: 'No valid URLs found.',
				values: payload
			});
		}

		if (urls.length > 10000) {
			return fail(400, {
				error: 'Maximum 10,000 URLs per batch.',
				values: payload
			});
		}

		for (const url of urls) {
			try {
				new URL(url);
			} catch {
				return fail(400, {
					error: `Invalid URL: ${url}`,
					values: payload
				});
			}
		}

		const db = getDb();
		let result;
		try {
			result = await submitIndexNowUrls(db, params.projectId, urls);
		} catch (e) {
			return fail(400, {
				error: e instanceof Error ? e.message : 'Submission failed',
				values: payload
			});
		}

		return {
			success: result.ok
				? `Submitted ${urls.length} URLs successfully.`
				: `Bing rejected the request (HTTP ${result.statusCode ?? 'N/A'}).`,
			lastSubmission: {
				submissionId: result.submissionId,
				statusCode: result.statusCode,
				responseBody: result.responseBody
			}
		};
	},
	toggleStatus: async ({ params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const db = getDb();
		const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
		if (!project) {
			return fail(404, { error: 'Project not found' });
		}

		const nextStatus = project.status === 'active' ? 'paused' : 'active';
		await db
			.update(projects)
			.set({ status: nextStatus, updatedAt: new Date() })
			.where(eq(projects.id, project.id));

		return {
			success: `Project status changed to ${nextStatus}.`
		};
	},
	updateSchedule: async ({ request, params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const formData = await request.formData();
		const rawSchedule = String(formData.get('schedule') ?? 'disabled');
		if (!isProjectSchedule(rawSchedule)) {
			return fail(400, { error: 'Invalid schedule value.' });
		}

		const db = getDb();
		const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
		if (!project) {
			return fail(404, { error: 'Project not found' });
		}

		await db
			.update(projects)
			.set({
				schedule: rawSchedule,
				nextRunAt: computeNextRunAt(rawSchedule),
				updatedAt: new Date()
			})
			.where(eq(projects.id, project.id));

		return {
			success:
				rawSchedule === 'disabled'
					? 'Automation schedule disabled.'
					: 'Automation schedule updated successfully.'
		};
	},
	runAutomationNow: async ({ params, locals, request, getClientAddress }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const db = getDb();
		const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
		if (!project) {
			return fail(404, { error: 'Project not found' });
		}
		if (project.status !== 'active') {
			return fail(400, { error: 'Project is paused. Resume it before running automation.' });
		}

		const result = await runManualAutomation(project.id, project.domain);
		const now = new Date();

		await db
			.update(projects)
			.set({
				lastAutomationRunAt: now,
				nextRunAt: computeNextRunAt(project.schedule, now),
				updatedAt: now
			})
			.where(eq(projects.id, project.id));

		await writeAuditLog({
			actorUserId: locals.user?.id,
			actorEmail: locals.user?.email,
			action: 'automation.run_manual',
			targetType: 'project',
			targetId: project.id,
			ipAddress: getRequestIp(request, getClientAddress),
			userAgent: request.headers.get('user-agent'),
			metadata: {
				projectDomain: project.domain,
				schedule: project.schedule,
				result
			}
		});

		return {
			success: `Automation finished. Sitemaps: ${result.sitemapsSucceeded}/${result.sitemapsTried}, URLs processed: ${result.discoveredUrlsProcessed}, indexing batches: ${result.submissionBatches}, successful: ${result.submissionSucceeded}, failed: ${result.submissionFailed}.`,
			automationResult: result
		};
	}
};














