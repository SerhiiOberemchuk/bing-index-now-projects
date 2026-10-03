import { and, asc, eq, gt, isNotNull, isNull, lt, notInArray, or, sql } from 'drizzle-orm';

import type { DbClient } from '$lib/server/db';
import { auditLog, discoveredUrls, projects, sitemaps, type Project } from '$lib/server/db/schema';
import { INDEXNOW_MAX_URLS, submitIndexNowUrls } from '$lib/server/indexnow/submit';
import { crawlSitemaps } from '$lib/server/sitemap/fetch';
import { computeNextRunAt } from '$lib/schedule';
import type { SyncResult } from '$lib/sync-summary';

const MAX_SITEMAPS = 30;
const MAX_SITEMAP_URLS = 20_000;
const MAX_URL_LENGTH = 2048;
const WRITE_CHUNK = 500;
// A <lastmod> this close to the fetch time was generated on request (e.g. `lastModified: new Date()`),
// not by a real edit. Trusting it would resend every page on every sync.
const FRESH_LASTMOD_MS = 10 * 60 * 1000;

function chunk<T>(items: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
	return result;
}

/**
 * Reads the project's sitemaps, stores the URL list, and sends Bing every URL that is new
 * or whose <lastmod> is newer than the last successful submission.
 */
export async function syncProject(
	db: DbClient,
	project: Project,
	options: { source: 'manual' | 'cron'; actor?: { id: string; email: string } | null }
): Promise<SyncResult> {
	const startedAt = new Date();
	const result: SyncResult = {
		source: options.source,
		startedAt: startedAt.toISOString(),
		finishedAt: startedAt.toISOString(),
		sitemapsOk: 0,
		sitemapErrors: [],
		urlsInSitemap: 0,
		skippedHosts: {},
		truncated: false,
		ignoredLastMod: 0,
		removedUrls: 0,
		newUrls: 0,
		changedUrls: 0,
		sentUrls: 0,
		bing: null,
		error: null
	};

	try {
		if (project.status !== 'active') {
			throw new Error('Project is paused. Resume it to send pages to Bing.');
		}

		const crawl = await crawlSitemaps({
			projectDomain: project.domain,
			maxSitemaps: MAX_SITEMAPS,
			maxUrls: MAX_SITEMAP_URLS
		});
		result.sitemapsOk = crawl.sitemaps.filter((row) => row.ok).length;
		result.sitemapErrors = crawl.sitemaps.filter((row) => !row.ok).map((row) => `${row.url}: ${row.error}`);
		result.skippedHosts = crawl.skippedHosts;
		result.truncated = crawl.truncated;

		// Sitemap status: keep only the sitemaps seen in this run.
		const sitemapIdByUrl = new Map<string, string>();
		if (crawl.sitemaps.length > 0) {
			const rows = await db
				.insert(sitemaps)
				.values(
					crawl.sitemaps.map((row) => ({
						projectId: project.id,
						url: row.url,
						status: row.ok ? ('success' as const) : ('failed' as const),
						lastFetchedAt: startedAt,
						lastError: row.error,
						updatedAt: startedAt
					}))
				)
				.onConflictDoUpdate({
					target: [sitemaps.projectId, sitemaps.url],
					set: {
						status: sql`excluded.status`,
						lastFetchedAt: sql`excluded.last_fetched_at`,
						lastError: sql`excluded.last_error`,
						updatedAt: sql`excluded.updated_at`
					}
				})
				.returning({ id: sitemaps.id, url: sitemaps.url });
			for (const row of rows) sitemapIdByUrl.set(row.url, row.id);

			await db.delete(sitemaps).where(
				and(
					eq(sitemaps.projectId, project.id),
					notInArray(
						sitemaps.url,
						crawl.sitemaps.map((row) => row.url)
					)
				)
			);
		}

		const freshCutoff = startedAt.getTime() - FRESH_LASTMOD_MS;
		const entries = crawl.urls.filter((entry) => entry.url.length <= MAX_URL_LENGTH);
		result.urlsInSitemap = entries.length;

		for (const part of chunk(entries, WRITE_CHUNK)) {
			await db
				.insert(discoveredUrls)
				.values(
					part.map((entry) => {
						let lastMod = entry.lastMod;
						if (lastMod && lastMod.getTime() > freshCutoff) {
							result.ignoredLastMod += 1;
							lastMod = null;
						}
						return {
							projectId: project.id,
							sitemapId: sitemapIdByUrl.get(entry.sourceSitemap) ?? null,
							url: entry.url,
							lastMod,
							updatedAt: startedAt
						};
					})
				)
				.onConflictDoUpdate({
					target: [discoveredUrls.projectId, discoveredUrls.url],
					set: {
						sitemapId: sql`excluded.sitemap_id`,
						lastMod: sql`excluded.last_mod`,
						updatedAt: sql`excluded.updated_at`
					}
				});
		}

		// Forget pages that left the sitemap, but only when we are sure we saw the whole sitemap.
		if (entries.length > 0 && result.sitemapErrors.length === 0 && !crawl.truncated) {
			const removed = await db
				.delete(discoveredUrls)
				.where(and(eq(discoveredUrls.projectId, project.id), lt(discoveredUrls.updatedAt, startedAt)))
				.returning({ id: discoveredUrls.id });
			result.removedUrls = removed.length;
		}

		const pending = await db
			.select({ url: discoveredUrls.url, lastSubmittedAt: discoveredUrls.lastSubmittedAt })
			.from(discoveredUrls)
			.where(
				and(
					eq(discoveredUrls.projectId, project.id),
					or(
						isNull(discoveredUrls.lastSubmittedAt),
						and(isNotNull(discoveredUrls.lastMod), gt(discoveredUrls.lastMod, discoveredUrls.lastSubmittedAt))
					)
				)
			)
			.orderBy(asc(discoveredUrls.createdAt))
			.limit(INDEXNOW_MAX_URLS);

		result.newUrls = pending.filter((row) => row.lastSubmittedAt === null).length;
		result.changedUrls = pending.length - result.newUrls;

		if (pending.length > 0) {
			const submission = await submitIndexNowUrls(
				db,
				project.id,
				pending.map((row) => row.url)
			);
			result.bing = {
				ok: submission.ok,
				statusCode: submission.statusCode,
				responseBody: submission.responseBody.slice(0, 500)
			};
			if (submission.ok) result.sentUrls = pending.length;
		}
	} catch (error) {
		result.error = error instanceof Error ? error.message : 'Sync failed';
	}

	const finishedAt = new Date();
	result.finishedAt = finishedAt.toISOString();

	await db
		.update(projects)
		.set({
			lastAutomationRunAt: finishedAt,
			nextRunAt: computeNextRunAt(project.schedule, finishedAt),
			updatedAt: finishedAt
		})
		.where(eq(projects.id, project.id));

	// The project page reads the latest of these rows to show "Last check".
	await db.insert(auditLog).values({
		actorUserId: options.actor?.id ?? null,
		actorEmail: options.actor?.email ?? null,
		action: 'indexnow.sync',
		targetType: 'project',
		targetId: project.id,
		metadata: { domain: project.domain, result }
	});

	return result;
}
