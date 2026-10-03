import { and, eq, inArray } from 'drizzle-orm';

import type { DbClient } from '#lib/server/db/index.js';
import { buildKeyLocation, normalizeDomain } from '#lib/server/domain.js';
import { discoveredUrls, indexNowSubmissions, projects } from '#lib/server/db/schema.js';

/** IndexNow accepts at most 10,000 URLs per request. */
export const INDEXNOW_MAX_URLS = 10_000;

export type SubmitIndexNowResult = {
	submissionId: string;
	ok: boolean;
	statusCode: number | null;
	responseBody: string;
};

function chunk<T>(items: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
	return result;
}

/** IndexNow rejects the whole request (HTTP 422) if any URL is on another host, so check up front. */
export function findForeignUrls(urls: string[], host: string): string[] {
	return urls.filter((url) => {
		try {
			return normalizeDomain(new URL(url).host) !== host;
		} catch {
			return true;
		}
	});
}

export async function submitIndexNowUrls(
	db: DbClient,
	projectId: string,
	urls: string[]
): Promise<SubmitIndexNowResult> {
	const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
	if (!project) {
		throw new Error('Project not found');
	}

	if (project.status !== 'active') {
		throw new Error('Project is paused. Resume it before submission.');
	}

	if (urls.length === 0 || urls.length > INDEXNOW_MAX_URLS) {
		throw new Error(`Send between 1 and ${INDEXNOW_MAX_URLS} URLs per request.`);
	}

	const host = normalizeDomain(project.domain);
	const foreign = findForeignUrls(urls, host);
	if (foreign.length > 0) {
		throw new Error(`All URLs must be on ${host}. Not on this domain: ${foreign.slice(0, 3).join(', ')}`);
	}

	const payload = {
		host,
		key: project.indexNowKey,
		keyLocation: buildKeyLocation(host, project.indexNowKey),
		urlList: urls
	};

	let responseStatusCode: number | null = null;
	let responseBody = '';
	let ok = false;

	try {
		const response = await fetch('https://www.bing.com/indexnow', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			},
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(30_000)
		});

		responseStatusCode = response.status;
		responseBody = await response.text();
		ok = response.ok;
	} catch (error) {
		responseBody = error instanceof Error ? error.message : 'Unexpected network error';
	}

	const [submission] = await db
		.insert(indexNowSubmissions)
		.values({
			projectId,
			urlCount: urls.length,
			status: ok ? 'success' : 'failed',
			responseStatusCode,
			responseBody,
			payload
		})
		.returning({ id: indexNowSubmissions.id });

	// Only URLs Bing actually accepted count as sent; failed ones stay pending and are retried next sync.
	if (ok) {
		const now = new Date();
		for (const part of chunk(urls, 500)) {
			await db
				.update(discoveredUrls)
				.set({ lastSubmittedAt: now })
				.where(and(eq(discoveredUrls.projectId, projectId), inArray(discoveredUrls.url, part)));
		}
	}

	return {
		submissionId: submission.id,
		ok,
		statusCode: responseStatusCode,
		responseBody
	};
}
