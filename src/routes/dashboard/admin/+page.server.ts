import { and, count, eq, isNull } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getUserRole } from '$lib/server/authz';
import { getDb } from '$lib/server/db';
import { auditLog, authInvites, user } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
	const role = getUserRole(locals.user);
	if (role !== 'owner') {
		throw error(403, 'Only owner can access admin section.');
	}

	const db = getDb();
	const [pendingUsersRow] = await db
		.select({ total: count(user.id) })
		.from(user)
		.where(and(eq(user.approved, false), eq(user.emailVerified, true)));

	const [activeInvitesRow] = await db
		.select({ total: count(authInvites.id) })
		.from(authInvites)
		.where(and(isNull(authInvites.usedAt), isNull(authInvites.revokedAt))); 

	const [auditRow] = await db.select({ total: count(auditLog.id) }).from(auditLog);

	return {
		stats: {
			pendingUsers: Number(pendingUsersRow?.total ?? 0),
			activeInvites: Number(activeInvitesRow?.total ?? 0),
			auditEvents: Number(auditRow?.total ?? 0)
		}
	};
};

