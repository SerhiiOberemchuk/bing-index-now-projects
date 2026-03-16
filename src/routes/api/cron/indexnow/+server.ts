import { and, asc, eq, gt, inArray, isNotNull, isNull, lte, ne, or } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';
import { writeAuditLog } from '$lib/server/audit';
import { getDb } from '$lib/server/db';
import { discoveredUrls, projects, sitemaps } from '$lib/server/db/schema';
import { submitIndexNowUrls } from '$lib/server/indexnow/submit';
import { computeNextRunAt, type ProjectSchedule } from '$lib/server/schedule';
import { discoverSitemapCandidates, fetchSitemapUrls } from '$lib/server/sitemap/fetch';

const INDEXNOW_BATCH_SIZE = 10_000;
const MAX_URLS_PER_PROJECT = 10_000;
const MAX_SITEMAPS = 30;
const MAX_SITEMAP_URLS = 20_000;

type ProjectCronResult = {
	projectId: string;
	domain: string;
	schedule: string;
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

function chunk<T>(items: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
}

function getBearerToken(request: Request): string | null {
	const authHeader = request.headers.get('authorization');
	if (!authHeader) return null;
	const [type, token] = authHeader.split(' ');
	if (!type || !token || type.toLowerCase() !== 'bearer') return null;
	return token.trim();
}

function isCronAuthorized(request: Request): boolean {
	const CRON_SECRET = env.CRON_SECRET;
	if (!CRON_SECRET) return false;
	const token = getBearerToken(request);
	return token === CRON_SECRET;
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

async function processProjectSitemaps(projectId: string, domain: string, result: ProjectCronResult) {
	const db = getDb();
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
}

async function processProjectIndexing(projectId: string, result: ProjectCronResult) {
	const db = getDb();

	const selectedRows = await db
		.select({
			id: discoveredUrls.id,
			url: discoveredUrls.url
		})
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
	if (selectedRows.length === 0) return;

	const urlRowsByUrl = new Map(selectedRows.map((row) => [row.url, row.id]));
	const urls = selectedRows.map((row) => row.url);
	const batches = chunk(urls, INDEXNOW_BATCH_SIZE);
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
			result.errors.push(
				`IndexNow batch failed with HTTP ${submission.statusCode ?? 'N/A'}: ${submission.responseBody.slice(0, 500)}`
			);
		}
	}
}

export async function GET({ request }) {
	const CRON_SECRET = env.CRON_SECRET;
	if (!CRON_SECRET) {
		return json({ error: 'CRON_SECRET is not configured.' }, { status: 500 });
	}

	if (!isCronAuthorized(request)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = getDb();
	const now = new Date();
	const scheduledProjects = await db
		.select({
			id: projects.id,
			domain: projects.domain,
			schedule: projects.schedule,
			nextRunAt: projects.nextRunAt
		})
		.from(projects)
		.where(
			and(
				eq(projects.status, 'active'),
				ne(projects.schedule, 'disabled'),
				or(isNull(projects.nextRunAt), lte(projects.nextRunAt, now))
			)
		)
		.orderBy(asc(projects.createdAt));

	const startedAt = new Date();
	const perProject: ProjectCronResult[] = [];

	for (const project of scheduledProjects) {
		const result: ProjectCronResult = {
			projectId: project.id,
			domain: project.domain,
			schedule: project.schedule,
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

		try {
			await processProjectSitemaps(project.id, project.domain, result);
		} catch (error) {
			result.errors.push(error instanceof Error ? error.message : 'Unhandled sitemap error');
		}

		try {
			await processProjectIndexing(project.id, result);
		} catch (error) {
			result.errors.push(error instanceof Error ? error.message : 'Unhandled indexing error');
		}

		await db
			.update(projects)
			.set({
				lastAutomationRunAt: now,
				nextRunAt: computeNextRunAt(project.schedule as ProjectSchedule, now),
				updatedAt: new Date()
			})
			.where(eq(projects.id, project.id));

		perProject.push(result);
	}

	const finishedAt = new Date();
	const summary = {
		startedAt: startedAt.toISOString(),
		finishedAt: finishedAt.toISOString(),
		durationMs: finishedAt.getTime() - startedAt.getTime(),
		scheduledProjectsDue: scheduledProjects.length,
		totalSubmissionBatches: perProject.reduce((acc, row) => acc + row.submissionBatches, 0),
		totalSubmissionSucceeded: perProject.reduce((acc, row) => acc + row.submissionSucceeded, 0),
		totalSubmissionFailed: perProject.reduce((acc, row) => acc + row.submissionFailed, 0)
	};

	await writeAuditLog({
		action: 'cron.indexnow.run',
		targetType: 'system',
		metadata: {
			summary,
			perProject
		}
	});

	return json({
		ok: true,
		summary,
		perProject
	});
}
