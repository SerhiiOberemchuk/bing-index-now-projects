import { and, count, eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { canManageProjects, getUserRole } from '$lib/server/authz';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

export const load: LayoutServerLoad = async ({ locals }) => {
	const role = getUserRole(locals.user);
	let pendingApprovals = 0;

	if (role === 'owner') {
		const db = getDb();
		const [row] = await db
			.select({ total: count(user.id) })
			.from(user)
			.where(and(eq(user.approved, false), eq(user.emailVerified, true)));
		pendingApprovals = Number(row?.total ?? 0);
	}

	return {
		user: locals.user,
		canManage: canManageProjects(locals.user),
		pendingApprovals
	};
};
