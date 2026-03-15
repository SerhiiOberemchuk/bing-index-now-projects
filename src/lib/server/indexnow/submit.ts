import { eq } from 'drizzle-orm';

import type { DbClient } from '$lib/server/db';
import { buildKeyLocation, normalizeDomain } from '$lib/server/domain';
import { indexNowSubmissions, projects } from '$lib/server/db/schema';

export type SubmitIndexNowResult = {
	submissionId: string;
	ok: boolean;
	statusCode: number | null;
	responseBody: string;
};

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

	const host = normalizeDomain(project.domain);
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
			body: JSON.stringify(payload)
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

	return {
		submissionId: submission.id,
		ok,
		statusCode: responseStatusCode,
		responseBody
	};
}
