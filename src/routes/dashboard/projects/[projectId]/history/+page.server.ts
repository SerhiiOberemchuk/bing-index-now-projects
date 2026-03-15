import { and, desc, eq, inArray } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { auditLog, indexNowSubmissions, projects, sitemaps } from '$lib/server/db/schema';

type HistoryItem = {
	id: string;
	kind: 'submission' | 'automation' | 'sitemap_failed';
	createdAt: Date;
	title: string;
	description: string;
	details: unknown;
};

function toRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object') return {};
	return value as Record<string, unknown>;
}

function toString(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === 'string');
}

export const load: PageServerLoad = async ({ params }) => {
	const db = getDb();

	const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
	if (!project) throw error(404, 'Project not found');

	const submissions = await db
		.select({
			id: indexNowSubmissions.id,
			createdAt: indexNowSubmissions.createdAt,
			status: indexNowSubmissions.status,
			responseStatusCode: indexNowSubmissions.responseStatusCode,
			responseBody: indexNowSubmissions.responseBody,
			urlCount: indexNowSubmissions.urlCount,
			payload: indexNowSubmissions.payload
		})
		.from(indexNowSubmissions)
		.where(eq(indexNowSubmissions.projectId, project.id))
		.orderBy(desc(indexNowSubmissions.createdAt))
		.limit(150);

	const automationEvents = await db
		.select()
		.from(auditLog)
		.where(inArray(auditLog.action, ['automation.run_manual', 'cron.indexnow.run']))
		.orderBy(desc(auditLog.createdAt))
		.limit(300);

	const failedSitemaps = await db
		.select({
			id: sitemaps.id,
			updatedAt: sitemaps.updatedAt,
			url: sitemaps.url,
			lastError: sitemaps.lastError
		})
		.from(sitemaps)
		.where(and(eq(sitemaps.projectId, project.id), eq(sitemaps.status, 'failed')))
		.orderBy(desc(sitemaps.updatedAt))
		.limit(80);

	const items: HistoryItem[] = [];

	for (const row of submissions) {
		items.push({
			id: `submission:${row.id}`,
			kind: 'submission',
			createdAt: row.createdAt,
			title: row.status === 'success' ? 'IndexNow submission succeeded' : 'IndexNow submission failed',
			description: `${row.urlCount} URL(s), HTTP ${row.responseStatusCode ?? 'N/A'}`,
			details: {
				responseBody: row.responseBody,
				payload: row.payload
			}
		});
	}

	for (const row of automationEvents) {
		if (row.action === 'automation.run_manual') {
			if (row.targetId !== project.id) continue;
			const metadata = toRecord(row.metadata);
			const result = toRecord(metadata.result);
			const errors = toStringArray(result.errors);
			items.push({
				id: `automation:${row.id}:manual`,
				kind: 'automation',
				createdAt: row.createdAt,
				title: 'Manual automation run',
				description: `Sitemaps ${Number(result.sitemapsSucceeded ?? 0)}/${Number(result.sitemapsTried ?? 0)}, batches ${Number(result.submissionSucceeded ?? 0)}/${Number(result.submissionBatches ?? 0)}, errors ${errors.length}`,
				details: row.metadata
			});
			continue;
		}

		if (row.action === 'cron.indexnow.run') {
			const metadata = toRecord(row.metadata);
			const perProject = Array.isArray(metadata.perProject)
				? (metadata.perProject as Array<Record<string, unknown>>)
				: [];

			for (const item of perProject) {
				if (toString(item.projectId) !== project.id) continue;
				const errors = toStringArray(item.errors);
				items.push({
					id: `automation:${row.id}:cron:${project.id}`,
					kind: 'automation',
					createdAt: row.createdAt,
					title: 'Scheduled automation run',
					description: `Sitemaps ${Number(item.sitemapsSucceeded ?? 0)}/${Number(item.sitemapsTried ?? 0)}, batches ${Number(item.submissionSucceeded ?? 0)}/${Number(item.submissionBatches ?? 0)}, errors ${errors.length}`,
					details: item
				});
			}
		}
	}

	for (const row of failedSitemaps) {
		items.push({
			id: `sitemap:${row.id}`,
			kind: 'sitemap_failed',
			createdAt: row.updatedAt,
			title: 'Sitemap fetch failed',
			description: row.url,
			details: {
				error: row.lastError
			}
		});
	}

	items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

	return {
		project,
		history: items.slice(0, 300)
	};
};
