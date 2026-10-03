import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { getDb } from '#lib/server/db/index.js';
import { auditLog, discoveredUrls, indexNowSubmissions, projects, sitemaps } from '#lib/server/db/schema.js';
import { buildKeyLocation, normalizeDomain } from '#lib/server/domain.js';
import { canManageProjects, MANAGE_PERMISSION_ERROR } from '#lib/server/authz.js';
import { findForeignUrls, INDEXNOW_MAX_URLS, submitIndexNowUrls } from '#lib/server/indexnow/submit.js';
import { getProjectStats } from '#lib/server/indexnow/stats.js';
import { syncProject } from '#lib/server/indexnow/sync.js';
import { writeAuditLog } from '#lib/server/audit.js';
import { getRequestIp } from '#lib/server/request-ip.js';
import { describeBingResponse } from '#lib/indexnow-response.js';
import { computeNextRunAt, isProjectSchedule, PROJECT_SCHEDULES } from '#lib/schedule.js';
import { summarizeSync, type SyncResult } from '#lib/sync-summary.js';

const PAGE_LIST_LIMIT = 500;
const SUBMISSION_URL_PREVIEW = 200;

export const load: PageServerLoad = async ({ params }) => {
	const db = getDb();

	const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
	if (!project) {
		throw error(404, 'Project not found');
	}

	const stats = (await getProjectStats(db, [project.id])).get(project.id)!;

	const [lastSyncRow] = await db
		.select({ createdAt: auditLog.createdAt, actorEmail: auditLog.actorEmail, metadata: auditLog.metadata })
		.from(auditLog)
		.where(and(eq(auditLog.action, 'indexnow.sync'), eq(auditLog.targetId, project.id)))
		.orderBy(desc(auditLog.createdAt))
		.limit(1);
	const lastSyncResult = (lastSyncRow?.metadata as { result?: SyncResult } | null)?.result ?? null;

	const submissions = await db
		.select({
			id: indexNowSubmissions.id,
			createdAt: indexNowSubmissions.createdAt,
			status: indexNowSubmissions.status,
			statusCode: indexNowSubmissions.responseStatusCode,
			responseBody: sql<string>`left(${indexNowSubmissions.responseBody}, 500)`,
			urlCount: indexNowSubmissions.urlCount,
			urls: sql<string[]>`coalesce((
				select jsonb_agg(u) from (
					select jsonb_array_elements_text(${indexNowSubmissions.payload} -> 'urlList') as u
					limit ${SUBMISSION_URL_PREVIEW}
				) preview
			), '[]'::jsonb)`
		})
		.from(indexNowSubmissions)
		.where(eq(indexNowSubmissions.projectId, project.id))
		.orderBy(desc(indexNowSubmissions.createdAt))
		.limit(20);

	const sitemapRows = await db
		.select({ url: sitemaps.url, status: sitemaps.status, lastError: sitemaps.lastError })
		.from(sitemaps)
		.where(eq(sitemaps.projectId, project.id))
		.orderBy(asc(sitemaps.url));

	const isWaiting = sql<boolean>`(${discoveredUrls.lastSubmittedAt} is null or (${discoveredUrls.lastMod} is not null and ${discoveredUrls.lastMod} > ${discoveredUrls.lastSubmittedAt}))`;
	const pages = await db
		.select({
			url: discoveredUrls.url,
			lastMod: discoveredUrls.lastMod,
			lastSubmittedAt: discoveredUrls.lastSubmittedAt,
			waiting: isWaiting
		})
		.from(discoveredUrls)
		.where(eq(discoveredUrls.projectId, project.id))
		.orderBy(desc(isWaiting), desc(discoveredUrls.lastSubmittedAt), asc(discoveredUrls.url))
		.limit(PAGE_LIST_LIMIT);

	return {
		project: {
			...project,
			domain: normalizeDomain(project.domain),
			keyLocation: buildKeyLocation(project.domain, project.indexNowKey)
		},
		scheduleOptions: PROJECT_SCHEDULES,
		stats,
		lastSync: lastSyncRow && lastSyncResult
			? {
					at: lastSyncRow.createdAt,
					by: lastSyncRow.actorEmail,
					result: lastSyncResult,
					summary: summarizeSync(lastSyncResult)
				}
			: null,
		submissions,
		sitemaps: sitemapRows,
		pages,
		pageListLimit: PAGE_LIST_LIMIT
	};
};

async function loadProject(projectId: string) {
	const [project] = await getDb().select().from(projects).where(eq(projects.id, projectId)).limit(1);
	return project ?? null;
}

const submitFormSchema = z.object({
	urlsText: z.string().trim().min(1)
});

export const actions: Actions = {
	sync: async ({ params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const project = await loadProject(params.projectId);
		if (!project) return fail(404, { error: 'Project not found' });
		if (project.status !== 'active') {
			return fail(400, { error: 'Project is paused. Resume it first.' });
		}

		const result = await syncProject(getDb(), project, {
			source: 'manual',
			actor: locals.user ? { id: locals.user.id, email: locals.user.email } : null
		});
		const summary = summarizeSync(result);

		if (summary.tone === 'error') {
			return fail(400, { error: summary.headline });
		}
		return { success: summary.headline };
	},
	submitUrls: async ({ request, params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const formData = await request.formData();
		const payload = { urlsText: String(formData.get('urlsText') ?? '') };
		const parsed = submitFormSchema.safeParse(payload);
		if (!parsed.success) {
			return fail(400, { error: 'Add at least one URL.', values: payload });
		}

		const urls = Array.from(new Set(parsed.data.urlsText.split(/[\s,]+/g).filter(Boolean)));
		if (urls.length > INDEXNOW_MAX_URLS) {
			return fail(400, { error: `Maximum ${INDEXNOW_MAX_URLS} URLs per request.`, values: payload });
		}

		const project = await loadProject(params.projectId);
		if (!project) return fail(404, { error: 'Project not found' });

		const foreign = findForeignUrls(urls, normalizeDomain(project.domain));
		if (foreign.length > 0) {
			return fail(400, {
				error: `Every URL must start with https://${normalizeDomain(project.domain)}/. Wrong: ${foreign.slice(0, 3).join(', ')}`,
				values: payload
			});
		}

		let result;
		try {
			result = await submitIndexNowUrls(getDb(), project.id, urls);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Submission failed', values: payload });
		}

		const bing = describeBingResponse(result.statusCode);
		if (!result.ok) {
			return fail(400, { error: `Bing rejected ${urls.length} URLs: ${bing.text}.`, values: payload });
		}
		return { success: `Sent ${urls.length} URLs. ${bing.text}.` };
	},
	toggleStatus: async ({ params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const project = await loadProject(params.projectId);
		if (!project) return fail(404, { error: 'Project not found' });

		const nextStatus = project.status === 'active' ? 'paused' : 'active';
		await getDb()
			.update(projects)
			.set({ status: nextStatus, updatedAt: new Date() })
			.where(eq(projects.id, project.id));

		return { success: nextStatus === 'active' ? 'Site resumed.' : 'Site paused.' };
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

		const project = await loadProject(params.projectId);
		if (!project) return fail(404, { error: 'Project not found' });

		await getDb()
			.update(projects)
			.set({
				schedule: rawSchedule,
				// Never checked: leave nextRunAt empty so the next cron run picks the site up.
				nextRunAt: project.lastAutomationRunAt ? computeNextRunAt(rawSchedule, project.lastAutomationRunAt) : null,
				updatedAt: new Date()
			})
			.where(eq(projects.id, project.id));

		return {
			success: rawSchedule === 'disabled' ? 'Auto-check turned off.' : 'Auto-check schedule saved.'
		};
	},
	deleteProject: async ({ params, locals, request, getClientAddress }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const project = await loadProject(params.projectId);
		if (!project) return fail(404, { error: 'Project not found' });

		await getDb().delete(projects).where(eq(projects.id, project.id));
		await writeAuditLog({
			actorUserId: locals.user?.id,
			actorEmail: locals.user?.email,
			action: 'project.delete',
			targetType: 'project',
			targetId: project.id,
			ipAddress: getRequestIp(request, getClientAddress),
			userAgent: request.headers.get('user-agent'),
			metadata: { name: project.name, domain: project.domain }
		});

		throw redirect(303, '/dashboard/projects');
	}
};
