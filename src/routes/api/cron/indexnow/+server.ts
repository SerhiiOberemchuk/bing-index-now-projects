import { and, asc, eq, isNull, lte, ne, or } from 'drizzle-orm';

import { CRON_SECRET } from '$app/env/private';
import { getDb } from '#lib/server/db/index.js';
import { projects } from '#lib/server/db/schema.js';
import { syncProject } from '#lib/server/indexnow/sync.js';

// Vercel Cron fires every 6 hours, a few seconds late. Without slack, a project due at 12:00:30
// is skipped by the 12:00:05 run and waits until 18:00, so "daily" would drift to every 30 hours.
const SCHEDULE_SLACK_MS = 30 * 60 * 1000;

function getBearerToken(request: Request): string | null {
	const authHeader = request.headers.get('authorization');
	if (!authHeader) return null;
	const [type, token] = authHeader.split(' ');
	if (!type || !token || type.toLowerCase() !== 'bearer') return null;
	return token.trim();
}

export async function GET({ request }) {
	if (!CRON_SECRET) {
		return Response.json({ error: 'CRON_SECRET is not configured.' }, { status: 500 });
	}

	if (getBearerToken(request) !== CRON_SECRET) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = getDb();
	const dueBefore = new Date(Date.now() + SCHEDULE_SLACK_MS);
	const dueProjects = await db
		.select()
		.from(projects)
		.where(
			and(
				eq(projects.status, 'active'),
				ne(projects.schedule, 'disabled'),
				or(isNull(projects.nextRunAt), lte(projects.nextRunAt, dueBefore))
			)
		)
		.orderBy(asc(projects.createdAt));

	const results = [];
	for (const project of dueProjects) {
		try {
			const result = await syncProject(db, project, { source: 'cron' });
			results.push({ domain: project.domain, ...result });
		} catch (error) {
			results.push({ domain: project.domain, error: error instanceof Error ? error.message : 'Sync failed' });
		}
	}

	return Response.json({ ok: true, projectsSynced: results.length, results });
}
