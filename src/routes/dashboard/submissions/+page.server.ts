import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { canManageProjects, MANAGE_PERMISSION_ERROR } from '$lib/server/authz';
import { getDb } from '$lib/server/db';
import { indexNowSubmissions, projects } from '$lib/server/db/schema';
import { submitIndexNowUrls } from '$lib/server/indexnow/submit';

const retrySchema = z.object({
	submissionId: z.uuid()
});

const retryBulkSchema = z.object({
	limit: z.coerce.number().int().min(1).max(100)
});

function extractUrlList(payload: unknown): string[] {
	if (!payload || typeof payload !== 'object') return [];
	const urlList = (payload as { urlList?: unknown }).urlList;
	if (!Array.isArray(urlList)) return [];

	const urls = urlList.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
	return Array.from(new Set(urls.map((item) => item.trim())));
}

export const load: PageServerLoad = async ({ locals }) => {
	const db = getDb();
	const rows = await db
		.select({
			id: indexNowSubmissions.id,
			createdAt: indexNowSubmissions.createdAt,
			urlCount: indexNowSubmissions.urlCount,
			status: indexNowSubmissions.status,
			responseStatusCode: indexNowSubmissions.responseStatusCode,
			responseBody: indexNowSubmissions.responseBody,
			payload: indexNowSubmissions.payload,
			projectId: indexNowSubmissions.projectId,
			projectDomain: projects.domain
		})
		.from(indexNowSubmissions)
		.innerJoin(projects, eq(indexNowSubmissions.projectId, projects.id))
		.orderBy(desc(indexNowSubmissions.createdAt))
		.limit(100);

	const failedInList = rows.filter((row) => row.status === 'failed').length;

	return { submissions: rows, canManage: canManageProjects(locals.user), failedInList };
};

export const actions: Actions = {
	retrySubmission: async ({ request, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const formData = await request.formData();
		const parsed = retrySchema.safeParse({
			submissionId: String(formData.get('submissionId') ?? '')
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid submission id.' });
		}

		const db = getDb();
		const [submission] = await db
			.select({
				id: indexNowSubmissions.id,
				projectId: indexNowSubmissions.projectId,
				payload: indexNowSubmissions.payload
			})
			.from(indexNowSubmissions)
			.where(eq(indexNowSubmissions.id, parsed.data.submissionId))
			.limit(1);

		if (!submission) {
			return fail(404, { error: 'Submission not found.' });
		}

		const urls = extractUrlList(submission.payload);
		if (urls.length === 0) {
			return fail(400, { error: 'Could not extract URL list from submission payload.' });
		}

		if (urls.length > 10000) {
			return fail(400, { error: 'Cannot retry payload larger than 10,000 URLs.' });
		}

		try {
			const result = await submitIndexNowUrls(db, submission.projectId, urls);
			return {
				success: result.ok
					? `Retry completed successfully. Submitted ${urls.length} URL(s).`
					: `Retry request sent, but Bing returned HTTP ${result.statusCode ?? 'N/A'}.`,
				retryResult: {
					submissionId: result.submissionId,
					statusCode: result.statusCode,
					responseBody: result.responseBody
				}
			};
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Retry failed.'
			});
		}
	},
	retryFailedRecent: async ({ request, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const formData = await request.formData();
		const parsed = retryBulkSchema.safeParse({
			limit: String(formData.get('limit') ?? '20')
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid limit. Use a value from 1 to 100.' });
		}

		const db = getDb();
		const failedRows = await db
			.select({
				id: indexNowSubmissions.id,
				projectId: indexNowSubmissions.projectId,
				payload: indexNowSubmissions.payload
			})
			.from(indexNowSubmissions)
			.where(eq(indexNowSubmissions.status, 'failed'))
			.orderBy(desc(indexNowSubmissions.createdAt))
			.limit(parsed.data.limit);

		if (failedRows.length === 0) {
			return fail(400, { error: 'No failed submissions found in selected window.' });
		}

		let retried = 0;
		let successful = 0;
		let failed = 0;
		let skipped = 0;
		const details: Array<{
			sourceSubmissionId: string;
			newSubmissionId?: string;
			ok?: boolean;
			statusCode?: number | null;
			error?: string;
		}> = [];

		for (const row of failedRows) {
			const urls = extractUrlList(row.payload);
			if (urls.length === 0 || urls.length > 10000) {
				skipped += 1;
				details.push({
					sourceSubmissionId: row.id,
					error: urls.length === 0 ? 'No urlList in payload.' : 'Payload exceeds 10,000 URLs.'
				});
				continue;
			}

			retried += 1;
			try {
				const result = await submitIndexNowUrls(db, row.projectId, urls);
				if (result.ok) successful += 1;
				else failed += 1;
				details.push({
					sourceSubmissionId: row.id,
					newSubmissionId: result.submissionId,
					ok: result.ok,
					statusCode: result.statusCode
				});
			} catch (error) {
				failed += 1;
				details.push({
					sourceSubmissionId: row.id,
					error: error instanceof Error ? error.message : 'Retry failed.'
				});
			}
		}

		return {
			success: `Bulk retry finished. Retried: ${retried}, successful: ${successful}, failed: ${failed}, skipped: ${skipped}.`,
			bulkResult: {
				requestedWindow: parsed.data.limit,
				failedRowsFound: failedRows.length,
				retried,
				successful,
				failed,
				skipped,
				details
			}
		};
	}
};
