import { and, count, desc, eq, gte, sql } from 'drizzle-orm';

import type { DbClient } from '$lib/server/db';
import { discoveredUrls, indexNowSubmissions, sitemaps } from '$lib/server/db/schema';

export type ProjectHealthStatus = 'healthy' | 'warning' | 'paused' | 'setup_required' | 'active';

export type ProjectHealthSnapshot = {
	status: ProjectHealthStatus;
	discoveredTotal: number;
	discoveredSelected: number;
	pendingIndexing: number;
	latestSuccessAt: Date | null;
	latestFailureAt: Date | null;
	latestFailureCode: number | null;
	latestFailureBody: string | null;
	latestSitemapFailure: {
		url: string;
		lastError: string | null;
		updatedAt: Date;
	} | null;
	totalSubmissions: number;
	failedSubmissions: number;
	submissionsLast24h: number;
	averageStatusCode: number | null;
};

export function deriveProjectHealthStatus(args: {
	projectStatus: 'active' | 'paused';
	discoveredTotal: number;
	pendingIndexing: number;
	hasSuccessfulSubmission: boolean;
	hasFailures: boolean;
}): ProjectHealthStatus {
	if (args.projectStatus === 'paused') return 'paused';
	if (args.discoveredTotal === 0) return 'setup_required';
	if (args.pendingIndexing === 0 && args.hasSuccessfulSubmission) return 'healthy';
	if (args.hasFailures) return 'warning';
	return 'active';
}

export async function getProjectHealthSnapshot(
	db: DbClient,
	project: { id: string; status: 'active' | 'paused' }
): Promise<ProjectHealthSnapshot> {
	const submissions = await db
		.select({
			id: indexNowSubmissions.id,
			createdAt: indexNowSubmissions.createdAt,
			status: indexNowSubmissions.status,
			responseStatusCode: indexNowSubmissions.responseStatusCode,
			responseBody: indexNowSubmissions.responseBody
		})
		.from(indexNowSubmissions)
		.where(eq(indexNowSubmissions.projectId, project.id))
		.orderBy(desc(indexNowSubmissions.createdAt))
		.limit(20);

	const [aggregate] = await db
		.select({
			total: count(indexNowSubmissions.id),
			failed: sql<number>`count(*) filter (where ${indexNowSubmissions.status} = 'failed')`,
			avgResponseStatusCode: sql<number | null>`avg(${indexNowSubmissions.responseStatusCode})`
		})
		.from(indexNowSubmissions)
		.where(eq(indexNowSubmissions.projectId, project.id));

	const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const [last24h] = await db
		.select({ totalUrls: sql<number | null>`sum(${indexNowSubmissions.urlCount})` })
		.from(indexNowSubmissions)
		.where(and(eq(indexNowSubmissions.projectId, project.id), gte(indexNowSubmissions.createdAt, dayAgo)));

	const [discoveredStats] = await db
		.select({
			total: count(discoveredUrls.id),
			selected: sql<number>`count(*) filter (where ${discoveredUrls.selected} = true)`,
			pendingIndexing: sql<number>`count(*) filter (
				where ${discoveredUrls.selected} = true
				and (
					${discoveredUrls.lastSubmittedAt} is null
					or (${discoveredUrls.lastMod} is not null and ${discoveredUrls.lastMod} > ${discoveredUrls.lastSubmittedAt})
				)
			)`
		})
		.from(discoveredUrls)
		.where(eq(discoveredUrls.projectId, project.id));

	const [latestFailedSitemap] = await db
		.select({
			url: sitemaps.url,
			lastError: sitemaps.lastError,
			updatedAt: sitemaps.updatedAt
		})
		.from(sitemaps)
		.where(and(eq(sitemaps.projectId, project.id), eq(sitemaps.status, 'failed')))
		.orderBy(desc(sitemaps.updatedAt))
		.limit(1);

	const latestSuccessSubmission = submissions.find((row) => row.status === 'success') ?? null;
	const latestFailedSubmission = submissions.find((row) => row.status === 'failed') ?? null;

	const discoveredTotal = Number(discoveredStats?.total ?? 0);
	const pendingIndexing = Number(discoveredStats?.pendingIndexing ?? 0);

	const status = deriveProjectHealthStatus({
		projectStatus: project.status,
		discoveredTotal,
		pendingIndexing,
		hasSuccessfulSubmission: Boolean(latestSuccessSubmission),
		hasFailures: Boolean(latestFailedSubmission || latestFailedSitemap)
	});

	return {
		status,
		discoveredTotal,
		discoveredSelected: Number(discoveredStats?.selected ?? 0),
		pendingIndexing,
		latestSuccessAt: latestSuccessSubmission?.createdAt ?? null,
		latestFailureAt: latestFailedSubmission?.createdAt ?? null,
		latestFailureCode: latestFailedSubmission?.responseStatusCode ?? null,
		latestFailureBody: latestFailedSubmission?.responseBody ?? null,
		latestSitemapFailure: latestFailedSitemap ?? null,
		totalSubmissions: Number(aggregate?.total ?? 0),
		failedSubmissions: Number(aggregate?.failed ?? 0),
		submissionsLast24h: Number(last24h?.totalUrls ?? 0),
		averageStatusCode:
			aggregate?.avgResponseStatusCode !== null && aggregate?.avgResponseStatusCode !== undefined
				? Math.round(Number(aggregate.avgResponseStatusCode))
				: null
	};
}
