import { and, eq, isNull, or } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { auth, OWNER_EMAIL } from '$lib/server/auth';
import { checkThrottle, clearThrottle, createThrottleKey, formatRetryAfter, recordThrottleFailure } from '$lib/server/auth-throttle';
import { writeAuditLog } from '$lib/server/audit';
import { getDb } from '$lib/server/db';
import { authInvites, user as userTable } from '$lib/server/db/schema';
import { getRequestIp } from '$lib/server/request-ip';

export const load: PageServerLoad = async ({ url }) => ({
	ownerEmail: OWNER_EMAIL,
	inviteToken: url.searchParams.get('invite') ?? ''
});

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');
		const inviteToken = String(formData.get('inviteToken') ?? '').trim();

		const ip = getRequestIp(event.request, event.getClientAddress);
		const throttleKey = createThrottleKey(ip, email || undefined);
		const throttleStatus = await checkThrottle('sign_up', throttleKey);
		if (throttleStatus.blocked) {
			return fail(429, {
				error: `Too many sign-up attempts. Try again in ${formatRetryAfter(throttleStatus.retryAfterSec)}.`,
				name,
				email,
				inviteToken
			});
		}

		if (!name || !email || !password || !confirmPassword) {
			await recordThrottleFailure('sign_up', throttleKey);
			return fail(400, {
				error: 'All fields are required.',
				name,
				email,
				inviteToken
			});
		}

		if (password.length < 8) {
			await recordThrottleFailure('sign_up', throttleKey);
			return fail(400, {
				error: 'Password must be at least 8 characters long.',
				name,
				email,
				inviteToken
			});
		}

		if (password !== confirmPassword) {
			await recordThrottleFailure('sign_up', throttleKey);
			return fail(400, {
				error: 'Passwords do not match.',
				name,
				email,
				inviteToken
			});
		}

		const isOwnerEmail = email === OWNER_EMAIL;
		const db = getDb();

		let selectedInviteId: string | null = null;
		if (!isOwnerEmail) {
			if (!inviteToken) {
				await recordThrottleFailure('sign_up', throttleKey);
				return fail(400, {
					error: 'Invite token is required for registration.',
					name,
					email,
					inviteToken
				});
			}

			const [invite] = await db
				.select()
				.from(authInvites)
				.where(
					and(
						eq(authInvites.token, inviteToken),
						eq(authInvites.email, email),
						isNull(authInvites.revokedAt),
						isNull(authInvites.usedAt)
					)
				)
				.limit(1);

			if (!invite) {
				await recordThrottleFailure('sign_up', throttleKey);
				return fail(400, {
					error: 'Invalid invite token or email mismatch.',
					name,
					email,
					inviteToken
				});
			}

			if (invite.expiresAt < new Date()) {
				await recordThrottleFailure('sign_up', throttleKey);
				return fail(400, {
					error: 'Invite token has expired.',
					name,
					email,
					inviteToken
				});
			}

			selectedInviteId = invite.id;
		}

		const [existingUser] = await db
			.select({ id: userTable.id, emailVerified: userTable.emailVerified })
			.from(userTable)
			.where(eq(userTable.email, email))
			.limit(1);

		if (existingUser) {
			if (!existingUser.emailVerified) {
				try {
					await auth.api.sendVerificationEmail({
						body: {
							email,
							callbackURL: '/'
						},
						headers: event.request.headers
					});
				} catch (error) {
					console.error('[Auth] Failed to resend verification email from sign-up flow.', error);
				}

				await recordThrottleFailure('sign_up', throttleKey);
				return fail(409, {
					error:
						'This email is already registered but not verified. We sent a new verification email. Check inbox and spam.',
					name,
					email,
					inviteToken
				});
			}

			await recordThrottleFailure('sign_up', throttleKey);
			return fail(409, {
				error: 'This email is already registered. Please sign in.',
				name,
				email,
				inviteToken
			});
		}

		try {
			await auth.api.signUpEmail({
				body: {
					name,
					email,
					password
				},
				headers: event.request.headers
			});

			if (selectedInviteId) {
				await db
					.update(authInvites)
					.set({ usedAt: new Date(), usedByEmail: email, updatedAt: new Date() })
					.where(eq(authInvites.id, selectedInviteId));

				await writeAuditLog({
					actorUserId: null,
					actorEmail: email,
					action: 'auth.invite.consume',
					targetType: 'invite',
					targetId: selectedInviteId,
					ipAddress: ip,
					userAgent: event.request.headers.get('user-agent')
				});
			}

			await clearThrottle('sign_up', throttleKey);
		} catch {
			const throttleFailure = await recordThrottleFailure('sign_up', throttleKey);
			if (throttleFailure.locked) {
				return fail(429, {
					error: `Too many sign-up attempts. Try again in ${formatRetryAfter(throttleFailure.retryAfterSec)}.`,
					name,
					email,
					inviteToken
				});
			}

			return fail(400, {
				error: 'Registration failed. Please try again.',
				name,
				email,
				inviteToken
			});
		}

		throw redirect(303, '/sign-in?verify=1');
	}
};
