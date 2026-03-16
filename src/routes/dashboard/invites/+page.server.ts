import crypto from 'node:crypto';

import { and, desc, eq, isNull } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { getUserRole } from '$lib/server/authz';
import { writeAuditLog } from '$lib/server/audit';
import { getDb } from '$lib/server/db';
import { authInvites } from '$lib/server/db/schema';
import { getRequestIp } from '$lib/server/request-ip';

const createInviteSchema = z.object({
	email: z.email(),
	role: z.enum(['manager', 'viewer'])
});

const revokeInviteSchema = z.object({
	inviteId: z.uuid()
});

function generateInviteToken(): string {
	return crypto.randomBytes(24).toString('hex');
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const isOwner = getUserRole(locals.user) === 'owner';
	if (!isOwner) {
		return { isOwner, invites: [], signUpBaseUrl: `${url.origin}/sign-up` };
	}

	const db = getDb();
	const invites = await db.select().from(authInvites).orderBy(desc(authInvites.createdAt)).limit(200);
	return {
		isOwner,
		invites,
		signUpBaseUrl: `${url.origin}/sign-up`
	};
};

export const actions: Actions = {
	createInvite: async ({ request, locals, getClientAddress }) => {
		if (getUserRole(locals.user) !== 'owner') {
			return fail(403, { error: 'Only owner can create invites.' });
		}

		const formData = await request.formData();
		const parsed = createInviteSchema.safeParse({
			email: String(formData.get('email') ?? '').trim().toLowerCase(),
			role: String(formData.get('role') ?? '')
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid invite payload.' });
		}

		const db = getDb();
		const now = new Date();
		const existing = await db
			.select({ id: authInvites.id })
			.from(authInvites)
			.where(
				and(
					eq(authInvites.email, parsed.data.email),
					isNull(authInvites.revokedAt),
					isNull(authInvites.usedAt),
					eq(authInvites.role, parsed.data.role)
				)
			)
			.limit(1);
		if (existing.length > 0) {
			return fail(409, { error: 'Active invite for this email and role already exists.' });
		}

		const token = generateInviteToken();
		const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		const [invite] = await db
			.insert(authInvites)
			.values({
				email: parsed.data.email,
				role: parsed.data.role,
				token,
				expiresAt,
				createdByUserId: locals.user?.id ?? null,
				updatedAt: now
			})
			.returning();

		await writeAuditLog({
			actorUserId: locals.user?.id,
			actorEmail: locals.user?.email,
			action: 'auth.invite.create',
			targetType: 'invite',
			targetId: invite.id,
			ipAddress: getRequestIp(request, getClientAddress),
			userAgent: request.headers.get('user-agent'),
			metadata: {
				email: invite.email,
				role: invite.role,
				expiresAt: invite.expiresAt.toISOString()
			}
		});

		return { success: 'Invite created successfully.' };
	},
	revokeInvite: async ({ request, locals, getClientAddress }) => {
		if (getUserRole(locals.user) !== 'owner') {
			return fail(403, { error: 'Only owner can revoke invites.' });
		}

		const formData = await request.formData();
		const parsed = revokeInviteSchema.safeParse({
			inviteId: String(formData.get('inviteId') ?? '')
		});
		if (!parsed.success) {
			return fail(400, { error: 'Invalid invite id.' });
		}

		const db = getDb();
		const now = new Date();
		const [invite] = await db
			.select()
			.from(authInvites)
			.where(eq(authInvites.id, parsed.data.inviteId))
			.limit(1);
		if (!invite) {
			return fail(404, { error: 'Invite not found.' });
		}
		if (invite.usedAt) {
			return fail(400, { error: 'Used invite cannot be revoked.' });
		}
		if (invite.revokedAt) {
			return fail(400, { error: 'Invite already revoked.' });
		}

		await db
			.update(authInvites)
			.set({ revokedAt: now, updatedAt: now })
			.where(eq(authInvites.id, invite.id));

		await writeAuditLog({
			actorUserId: locals.user?.id,
			actorEmail: locals.user?.email,
			action: 'auth.invite.revoke',
			targetType: 'invite',
			targetId: invite.id,
			ipAddress: getRequestIp(request, getClientAddress),
			userAgent: request.headers.get('user-agent'),
			metadata: { email: invite.email }
		});

		return { success: 'Invite revoked.' };
	}
};

