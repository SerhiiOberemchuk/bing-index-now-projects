import { and, desc, eq, ne } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { OWNER_EMAIL } from '$lib/server/auth';
import { getUserRole } from '$lib/server/authz';
import { writeAuditLog } from '$lib/server/audit';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { getRequestIp } from '$lib/server/request-ip';

const updateRoleSchema = z.object({
	userId: z.string().min(1),
	role: z.enum(['manager', 'viewer'])
});

const updateApprovalSchema = z.object({
	userId: z.string().min(1),
	approved: z.enum(['true', 'false'])
});

export const load: PageServerLoad = async ({ locals }) => {
	const currentRole = getUserRole(locals.user);
	const isOwner = currentRole === 'owner';

	if (!isOwner) {
		return {
			isOwner,
			users: [],
			stats: {
				pendingVerified: 0,
				pendingUnverified: 0,
				approved: 0
			}
		};
	}

	const db = getDb();
	const users = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			role: user.role,
			approved: user.approved,
			createdAt: user.createdAt
		})
		.from(user)
		.orderBy(desc(user.createdAt));

	const pendingVerified = users.filter((row) => !row.approved && row.emailVerified).length;
	const pendingUnverified = users.filter((row) => !row.approved && !row.emailVerified).length;
	const approved = users.filter((row) => row.approved).length;

	return {
		isOwner,
		users,
		stats: {
			pendingVerified,
			pendingUnverified,
			approved
		}
	};
};

export const actions: Actions = {
	approveAllVerified: async ({ locals, request, getClientAddress }) => {
		if (getUserRole(locals.user) !== 'owner') {
			return fail(403, { error: 'Only owner can approve users.' });
		}

		const db = getDb();
		const updated = await db
			.update(user)
			.set({ approved: true, updatedAt: new Date() })
			.where(and(eq(user.approved, false), eq(user.emailVerified, true), ne(user.email, OWNER_EMAIL)))
			.returning({ id: user.id });

		await writeAuditLog({
			actorUserId: locals.user?.id,
			actorEmail: locals.user?.email,
			action: 'auth.approval.approve_all_verified',
			targetType: 'user',
			ipAddress: getRequestIp(request, getClientAddress),
			userAgent: request.headers.get('user-agent'),
			metadata: {
				updatedCount: updated.length
			}
		});

		return {
			success: `Approved ${updated.length} verified user(s).`
		};
	},
	updateRole: async ({ request, locals, getClientAddress }) => {
		if (getUserRole(locals.user) !== 'owner') {
			return fail(403, { error: 'Only owner can change user roles.' });
		}

		const formData = await request.formData();
		const parsed = updateRoleSchema.safeParse({
			userId: String(formData.get('userId') ?? ''),
			role: String(formData.get('role') ?? '')
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid role update payload.' });
		}

		const db = getDb();
		const [targetUser] = await db.select().from(user).where(eq(user.id, parsed.data.userId)).limit(1);
		if (!targetUser) {
			return fail(404, { error: 'User not found.' });
		}

		if (targetUser.email.toLowerCase() === OWNER_EMAIL || targetUser.role === 'owner') {
			return fail(400, { error: 'Owner role cannot be modified.' });
		}

		await db.update(user).set({ role: parsed.data.role, updatedAt: new Date() }).where(eq(user.id, targetUser.id));

		await writeAuditLog({
			actorUserId: locals.user?.id,
			actorEmail: locals.user?.email,
			action: 'auth.role.update',
			targetType: 'user',
			targetId: targetUser.id,
			ipAddress: getRequestIp(request, getClientAddress),
			userAgent: request.headers.get('user-agent'),
			metadata: {
				targetEmail: targetUser.email,
				newRole: parsed.data.role
			}
		});

		return {
			success: `Role for ${targetUser.email} updated to ${parsed.data.role}.`
		};
	},
	updateApproval: async ({ request, locals, getClientAddress }) => {
		if (getUserRole(locals.user) !== 'owner') {
			return fail(403, { error: 'Only owner can change approval state.' });
		}

		const formData = await request.formData();
		const parsed = updateApprovalSchema.safeParse({
			userId: String(formData.get('userId') ?? ''),
			approved: String(formData.get('approved') ?? '')
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid approval payload.' });
		}

		const db = getDb();
		const [targetUser] = await db.select().from(user).where(eq(user.id, parsed.data.userId)).limit(1);
		if (!targetUser) {
			return fail(404, { error: 'User not found.' });
		}

		if (targetUser.email.toLowerCase() === OWNER_EMAIL || targetUser.role === 'owner') {
			return fail(400, { error: 'Owner approval state cannot be modified.' });
		}

		const approvedValue = parsed.data.approved === 'true';
		await db.update(user).set({ approved: approvedValue, updatedAt: new Date() }).where(eq(user.id, targetUser.id));

		await writeAuditLog({
			actorUserId: locals.user?.id,
			actorEmail: locals.user?.email,
			action: approvedValue ? 'auth.approval.approve' : 'auth.approval.revoke',
			targetType: 'user',
			targetId: targetUser.id,
			ipAddress: getRequestIp(request, getClientAddress),
			userAgent: request.headers.get('user-agent'),
			metadata: {
				targetEmail: targetUser.email,
				approved: approvedValue
			}
		});

		return {
			success: approvedValue
				? `User ${targetUser.email} approved successfully.`
				: `User ${targetUser.email} moved back to pending.`
		};
	}
};
