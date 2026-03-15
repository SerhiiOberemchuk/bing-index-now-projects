import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { z } from 'zod';

import { getDb } from '$lib/server/db';
import { indexNowSubmissions, projects } from '$lib/server/db/schema';

const submitSchema = z.object({
	projectId: z.string().uuid(),
	urls: z.array(z.string().url()).min(1).max(10000)
});

export async function POST({ request }) {
	const body = await request.json();
	const parsed = submitSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{
				error: 'Validation failed',
				issues: parsed.error.issues
			},
			{ status: 400 }
		);
	}

	const db = getDb();
	const { projectId, urls } = parsed.data;

	const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
	if (!project) {
		return json({ error: 'Project not found' }, { status: 404 });
	}

	const payload = {
		host: project.domain,
		key: project.indexNowKey,
		keyLocation: `https://${project.domain}/${project.indexNowKey}.txt`,
		urlList: urls
	};

	const response = await fetch('https://www.bing.com/indexnow', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=utf-8'
		},
		body: JSON.stringify(payload)
	});

	const responseBody = await response.text();
	const [submission] = await db
		.insert(indexNowSubmissions)
		.values({
			projectId,
			urlCount: urls.length,
			status: response.ok ? 'success' : 'failed',
			responseStatusCode: response.status,
			responseBody,
			payload
		})
		.returning();

	return json(
		{
			submission,
			bingResponse: {
				status: response.status,
				ok: response.ok,
				body: responseBody
			}
		},
		{ status: response.ok ? 200 : 502 }
	);
}
