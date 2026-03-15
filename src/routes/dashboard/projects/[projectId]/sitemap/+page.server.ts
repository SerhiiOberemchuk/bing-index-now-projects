import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { normalizeDomain } from '$lib/server/domain';
import { submitIndexNowUrls } from '$lib/server/indexnow/submit';
import { discoveredUrls, projects, sitemaps } from '$lib/server/db/schema';
import { discoverSitemapCandidates, fetchSitemapUrls } from '$lib/server/sitemap/fetch';
import { canManageProjects, MANAGE_PERMISSION_ERROR } from '$lib/server/authz';

const MAX_BATCH_SIZE = 10000;

function defaultSitemapUrl(domain: string): string {
	return `https://${normalizeDomain(domain)}/sitemap.xml`;
}

function splitLinesOrCsv(value: string): string[] {
	return value
		.split(/[\n,]+/g)
		.map((item) => item.trim())
		.filter(Boolean);
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegex(glob: string): RegExp {
	const safe = escapeRegex(glob).replace(/\\\*/g, '.*');
	return new RegExp(`^${safe}$`, 'i');
}

function matchesPatterns(pathname: string, includes: string[], excludes: string[]): boolean {
	const includeOk = includes.length === 0 || includes.some((pattern) => globToRegex(pattern).test(pathname));
	if (!includeOk) return false;
	return !excludes.some((pattern) => globToRegex(pattern).test(pathname));
}

function chunk<T>(items: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
	return result;
}

async function markSitemap(
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

async function processSitemap(projectId: string, projectDomain: string, sitemapUrl: string) {
	const db = getDb();
	const parsed = await fetchSitemapUrls({ projectDomain, sitemapUrl, maxSitemaps: 30, maxUrls: 20000 });

	for (const visitedUrl of parsed.visitedSitemaps) {
		await markSitemap(projectId, visitedUrl, 'success', null);
	}

	const relatedRows = await db
		.select()
		.from(sitemaps)
		.where(and(eq(sitemaps.projectId, projectId), eq(sitemaps.status, 'success')));
	const sitemapIdByUrl = new Map(relatedRows.map((row) => [row.url, row.id]));

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

	return {
		visitedCount: parsed.visitedSitemaps.length,
		urlCount: parsed.urls.length,
		rootSitemap: parsed.rootSitemap
	};
}

async function runIndexing(projectId: string, urls: string[]) {
	const db = getDb();
	const batches = chunk(urls, MAX_BATCH_SIZE);
	const batchResults: Array<{ size: number; ok: boolean; statusCode: number | null; responseBody: string }> = [];

	let okBatches = 0;
	let failedBatches = 0;
	for (const batch of batches) {
		const result = await submitIndexNowUrls(db, projectId, batch);
		if (result.ok) okBatches += 1;
		else failedBatches += 1;
		batchResults.push({
			size: batch.length,
			ok: result.ok,
			statusCode: result.statusCode,
			responseBody: result.responseBody
		});
	}

	const now = new Date();
	for (const ids of chunk(urls, 500)) {
		await db
			.update(discoveredUrls)
			.set({ lastSubmittedAt: now, updatedAt: now })
			.where(and(eq(discoveredUrls.projectId, projectId), inArray(discoveredUrls.url, ids)));
	}

	return { batches: batches.length, okBatches, failedBatches, totalUrls: urls.length, batchResults };
}

export const load: PageServerLoad = async ({ params }) => {
	const db = getDb();
	const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
	if (!project) throw error(404, 'Project not found');

	const sitemapRows = await db
		.select()
		.from(sitemaps)
		.where(eq(sitemaps.projectId, project.id))
		.orderBy(desc(sitemaps.updatedAt))
		.limit(20);

	const discoveredRows = await db
		.select()
		.from(discoveredUrls)
		.where(eq(discoveredUrls.projectId, project.id))
		.orderBy(desc(discoveredUrls.updatedAt))
		.limit(300);

	const [totals] = await db
		.select({
			total: count(discoveredUrls.id),
			selected: sql<number>`count(*) filter (where ${discoveredUrls.selected} = true)`,
			indexed: sql<number>`count(*) filter (where ${discoveredUrls.lastSubmittedAt} is not null)`
		})
		.from(discoveredUrls)
		.where(eq(discoveredUrls.projectId, project.id));

	return {
		project,
		sitemaps: sitemapRows,
		discoveredUrls: discoveredRows,
		totalDiscovered: Number(totals.total),
		selectedDiscovered: Number(totals.selected),
		indexedDiscovered: Number(totals.indexed),
		defaultSitemapUrl: defaultSitemapUrl(project.domain)
	};
};

export const actions: Actions = {
	autoFetch: async ({ params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const db = getDb();
		const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
		if (!project) return fail(404, { error: 'Project not found' });

		const candidates = await discoverSitemapCandidates(project.domain);
		if (candidates.length === 0) return fail(400, { error: 'Could not discover sitemap candidates.' });

		let totalVisited = 0;
		let totalUrls = 0;
		let successCount = 0;
		let failedCount = 0;

		for (const candidate of candidates) {
			try {
				const result = await processSitemap(project.id, project.domain, candidate);
				totalVisited += result.visitedCount;
				totalUrls += result.urlCount;
				successCount += 1;
			} catch (err) {
				failedCount += 1;
				await markSitemap(project.id, candidate, 'failed', err instanceof Error ? err.message : 'Sitemap fetch failed');
			}
		}

		if (successCount === 0) return fail(400, { error: 'Auto-discovery failed for all sitemap candidates.' });

		return {
			success: `Auto-fetch completed: ${successCount} sitemap roots succeeded, ${failedCount} failed, ${totalVisited} files scanned, ${totalUrls} URLs processed.`
		};
	},
	fetchSitemap: async ({ request, params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const db = getDb();
		const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
		if (!project) return fail(404, { error: 'Project not found' });

		const formData = await request.formData();
		const raw = String(formData.get('sitemapUrl') ?? '').trim();
		const sitemapUrl = raw || defaultSitemapUrl(project.domain);

		try {
			const result = await processSitemap(project.id, project.domain, sitemapUrl);
			return {
				success: `Fetched ${result.visitedCount} sitemap files and processed ${result.urlCount} URLs.`,
				values: { sitemapUrl: result.rootSitemap }
			};
		} catch (err) {
			await markSitemap(project.id, sitemapUrl, 'failed', err instanceof Error ? err.message : 'Sitemap fetch failed');
			return fail(400, {
				error: err instanceof Error ? err.message : 'Sitemap fetch failed',
				values: { sitemapUrl }
			});
		}
	},
	applyPaths: async ({ request, params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const db = getDb();
		const formData = await request.formData();
		const includePatterns = splitLinesOrCsv(String(formData.get('includePaths') ?? ''));
		const excludePatterns = splitLinesOrCsv(String(formData.get('excludePaths') ?? ''));

		const rows = await db
			.select({ id: discoveredUrls.id, url: discoveredUrls.url })
			.from(discoveredUrls)
			.where(eq(discoveredUrls.projectId, params.projectId));

		const selectedIds: string[] = [];
		for (const row of rows) {
			let pathname = '/';
			try {
				pathname = new URL(row.url).pathname || '/';
			} catch {
				pathname = '/';
			}
			if (matchesPatterns(pathname, includePatterns, excludePatterns)) selectedIds.push(row.id);
		}

		await db
			.update(discoveredUrls)
			.set({ selected: false, updatedAt: new Date() })
			.where(eq(discoveredUrls.projectId, params.projectId));

		for (const ids of chunk(selectedIds, 500)) {
			if (ids.length === 0) continue;
			await db
				.update(discoveredUrls)
				.set({ selected: true, updatedAt: new Date() })
				.where(and(eq(discoveredUrls.projectId, params.projectId), inArray(discoveredUrls.id, ids)));
		}

		return {
			success: `Applied path rules. Selected ${selectedIds.length} URL(s).`,
			values: {
				includePaths: includePatterns.join('\n'),
				excludePaths: excludePatterns.join('\n')
			}
		};
	},
	indexSelected: async ({ request, params, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const db = getDb();
		const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);
		if (!project) return fail(404, { error: 'Project not found' });

		const formData = await request.formData();
		const visibleIds = formData.getAll('visibleIds').map(String).filter(Boolean);
		const selectedIds = formData.getAll('selectedIds').map(String).filter(Boolean);

		if (visibleIds.length > 0) {
			for (const ids of chunk(visibleIds, 500)) {
				await db
					.update(discoveredUrls)
					.set({ selected: false, updatedAt: new Date() })
					.where(and(eq(discoveredUrls.projectId, params.projectId), inArray(discoveredUrls.id, ids)));
			}
		}

		if (selectedIds.length > 0) {
			for (const ids of chunk(selectedIds, 500)) {
				await db
					.update(discoveredUrls)
					.set({ selected: true, updatedAt: new Date() })
					.where(and(eq(discoveredUrls.projectId, params.projectId), inArray(discoveredUrls.id, ids)));
			}
		}

		if (selectedIds.length === 0) {
			return fail(400, { error: 'No URLs selected for indexing.' });
		}

		const rows = await db
			.select({ url: discoveredUrls.url })
			.from(discoveredUrls)
			.where(and(eq(discoveredUrls.projectId, project.id), inArray(discoveredUrls.id, selectedIds)));
		const urls = rows.map((row) => row.url);
		if (urls.length === 0) return fail(400, { error: 'Selected URLs were not found.' });

		try {
			const result = await runIndexing(project.id, urls);
			return {
				success: `Indexed ${result.totalUrls} URL(s) in ${result.batches} batch(es). Success: ${result.okBatches}, failed: ${result.failedBatches}.`,
				indexResult: result
			};
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : 'Indexing failed.' });
		}
	}
};
