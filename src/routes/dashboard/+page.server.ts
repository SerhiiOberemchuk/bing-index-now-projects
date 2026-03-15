import { count, desc, eq, gte, sql } from 'drizzle-orm';

import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { indexNowSubmissions, projects } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const db = getDb();

	const [totals] = await db
		.select({
			total: count(projects.id),
			active: sql<number>`count(*) filter (where ${projects.status} = 'active')`,
			paused: sql<number>`count(*) filter (where ${projects.status} = 'paused')`
		})
		.from(projects);

	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);

	const [today] = await db
		.select({
			total: count(indexNowSubmissions.id),
			success: sql<number>`count(*) filter (where ${indexNowSubmissions.status} = 'success')`
		})
		.from(indexNowSubmissions)
		.where(gte(indexNowSubmissions.createdAt, startOfDay));

	const recentSubmissions = await db
		.select({
			id: indexNowSubmissions.id,
			createdAt: indexNowSubmissions.createdAt,
			urlCount: indexNowSubmissions.urlCount,
			status: indexNowSubmissions.status,
			projectDomain: projects.domain
		})
		.from(indexNowSubmissions)
		.innerJoin(projects, eq(indexNowSubmissions.projectId, projects.id))
		.orderBy(desc(indexNowSubmissions.createdAt))
		.limit(6);

	const successRate =
		today.total > 0 ? Math.round((Number(today.success) / Number(today.total)) * 1000) / 10 : 0;

	return {
		stats: {
			totalProjects: Number(totals.total),
			activeProjects: Number(totals.active),
			pausedProjects: Number(totals.paused),
			todaySubmissions: Number(today.total),
			todaySuccessRate: successRate
		},
		recentSubmissions
	};
};
