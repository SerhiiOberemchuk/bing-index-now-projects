import type { PageServerLoad } from './$types';

import { getDb } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	try {
		const db = getDb();
		const allProjects = await db.select({ id: projects.id }).from(projects);

		return {
			projectCount: allProjects.length,
			dbReady: true
		};
	} catch {
		return {
			projectCount: 0,
			dbReady: false
		};
	}
};
