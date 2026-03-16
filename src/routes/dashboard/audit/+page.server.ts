import { desc } from 'drizzle-orm';

import type { PageServerLoad } from './$types';
import { getUserRole } from '$lib/server/authz';
import { getDb } from '$lib/server/db';
import { auditLog } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
	const isOwner = getUserRole(locals.user) === 'owner';

	if (!isOwner) {
		return {
			isOwner,
			events: []
		};
	}

	const db = getDb();
	const events = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(300);

	return {
		isOwner,
		events
	};
};
