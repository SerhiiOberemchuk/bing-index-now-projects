import { desc } from 'drizzle-orm';

import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { getProjectHealthSnapshot } from '$lib/server/monitoring/project-health';

export const load: PageServerLoad = async () => {
	const db = getDb();
	const projectRows = await db.select().from(projects).orderBy(desc(projects.createdAt));

	if (projectRows.length === 0) {
		return { projects: [] };
	}

	const normalized = await Promise.all(
		projectRows.map(async (project) => {
			const health = await getProjectHealthSnapshot(db, {
				id: project.id,
				status: project.status
			});

			const successRate =
				health.totalSubmissions > 0
					? Math.round(((health.totalSubmissions - health.failedSubmissions) / health.totalSubmissions) * 1000) /
						10
					: null;

			return {
				...project,
				lastSubmissionAt: health.latestSuccessAt ?? health.latestFailureAt,
				successRate,
				healthStatus: health.status,
				pendingIndexing: health.pendingIndexing,
				lastFailureCode: health.latestFailureCode,
				lastFailureAt: health.latestFailureAt,
				nextRunAt: project.nextRunAt
			};
		})
	);

	return {
		projects: normalized
	};
};
