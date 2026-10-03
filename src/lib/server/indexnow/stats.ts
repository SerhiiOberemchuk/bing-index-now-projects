import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';

import type { DbClient } from '$lib/server/db';
import { discoveredUrls, indexNowSubmissions, sitemaps } from '$lib/server/db/schema';
import type { ProjectStats } from '$lib/project-status';

export async function getProjectStats(db: DbClient, projectIds: string[]): Promise<Map<string, ProjectStats>> {
	const stats = new Map<string, ProjectStats>(
		projectIds.map((id) => [
			id,
			{ inSitemap: 0, sent: 0, waiting: 0, sitemapErrors: 0, lastSubmission: null }
		])
	);
	if (projectIds.length === 0) return stats;

	const urlCounts = await db
		.select({
			projectId: discoveredUrls.projectId,
			total: count(discoveredUrls.id),
			sent: sql<number>`count(*) filter (where ${discoveredUrls.lastSubmittedAt} is not null)`,
			waiting: sql<number>`count(*) filter (
				where ${discoveredUrls.lastSubmittedAt} is null
				or (${discoveredUrls.lastMod} is not null and ${discoveredUrls.lastMod} > ${discoveredUrls.lastSubmittedAt})
			)`
		})
		.from(discoveredUrls)
		.where(inArray(discoveredUrls.projectId, projectIds))
		.groupBy(discoveredUrls.projectId);

	const sitemapErrors = await db
		.select({ projectId: sitemaps.projectId, total: count(sitemaps.id) })
		.from(sitemaps)
		.where(and(inArray(sitemaps.projectId, projectIds), eq(sitemaps.status, 'failed')))
		.groupBy(sitemaps.projectId);

	const lastSubmissions = await db
		.selectDistinctOn([indexNowSubmissions.projectId], {
			projectId: indexNowSubmissions.projectId,
			createdAt: indexNowSubmissions.createdAt,
			status: indexNowSubmissions.status,
			statusCode: indexNowSubmissions.responseStatusCode,
			urlCount: indexNowSubmissions.urlCount
		})
		.from(indexNowSubmissions)
		.where(inArray(indexNowSubmissions.projectId, projectIds))
		.orderBy(indexNowSubmissions.projectId, desc(indexNowSubmissions.createdAt));

	for (const row of urlCounts) {
		const item = stats.get(row.projectId)!;
		item.inSitemap = Number(row.total);
		item.sent = Number(row.sent);
		item.waiting = Number(row.waiting);
	}
	for (const row of sitemapErrors) {
		stats.get(row.projectId)!.sitemapErrors = Number(row.total);
	}
	for (const row of lastSubmissions) {
		stats.get(row.projectId)!.lastSubmission = {
			createdAt: row.createdAt,
			ok: row.status === 'success',
			statusCode: row.statusCode,
			urlCount: row.urlCount
		};
	}

	return stats;
}
