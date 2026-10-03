import { asc } from 'drizzle-orm';

import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { normalizeDomain } from '$lib/server/domain';
import { projects } from '$lib/server/db/schema';
import { getProjectStats } from '$lib/server/indexnow/stats';

export const load: PageServerLoad = async () => {
	const db = getDb();
	const rows = await db.select().from(projects).orderBy(asc(projects.name));
	const stats = await getProjectStats(
		db,
		rows.map((row) => row.id)
	);

	return {
		projects: rows.map((row) => ({
			id: row.id,
			name: row.name,
			domain: normalizeDomain(row.domain),
			status: row.status,
			schedule: row.schedule,
			lastAutomationRunAt: row.lastAutomationRunAt,
			nextRunAt: row.nextRunAt,
			stats: stats.get(row.id)!
		}))
	};
};
