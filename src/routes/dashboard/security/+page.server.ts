import { fail } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { writeAuditLog } from '$lib/server/audit';
import { getRequestIp } from '$lib/server/request-ip';

const revokeSchema = z.object({
	token: z.string().min(1)
});

function normalizeError(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
		return error.message;
	}
	return fallback;
}

export const load: PageServerLoad = async ({ request, locals }) => {
	const sessionsResponse = await auth.api.listSessions({
		headers: request.headers
	});

	const sessions = Array.isArray(sessionsResponse)
		? sessionsResponse.map((session) => ({
			id: String((session as Record<string, unknown>).id ?? ''),
			token: String((session as Record<string, unknown>).token ?? ''),
			ipAddress: ((session as Record<string, unknown>).ipAddress as string | null | undefined) ?? null,
			userAgent: ((session as Record<string, unknown>).userAgent as string | null | undefined) ?? null,
			expiresAt: ((session as Record<string, unknown>).expiresAt as string | Date | null | undefined) ?? null,
			createdAt: ((session as Record<string, unknown>).createdAt as string | Date | null | undefined) ?? null
		}))
		: [];

	return {
		sessions,
		currentSessionId: locals.session?.id ?? null
	};
};

export const actions: Actions = {
	revokeSession: async ({ request, locals, getClientAddress }) => {
		const formData = await request.formData();
		const parsed = revokeSchema.safeParse({
			token: String(formData.get('token') ?? '')
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid session token.' });
		}

		try {
			await auth.api.revokeSession({
				body: { token: parsed.data.token },
				headers: request.headers
			});

			await writeAuditLog({
				actorUserId: locals.user?.id,
				actorEmail: locals.user?.email,
				action: 'auth.session.revoke',
				targetType: 'session',
				targetId: parsed.data.token,
				ipAddress: getRequestIp(request, getClientAddress),
				userAgent: request.headers.get('user-agent')
			});

			return { success: 'Session revoked successfully.' };
		} catch (error) {
			return fail(400, {
				error: normalizeError(error, 'Failed to revoke session.')
			});
		}
	},
	revokeOtherSessions: async ({ request, locals, getClientAddress }) => {
		try {
			await auth.api.revokeOtherSessions({
				headers: request.headers
			});

			await writeAuditLog({
				actorUserId: locals.user?.id,
				actorEmail: locals.user?.email,
				action: 'auth.session.revoke_others',
				targetType: 'session',
				ipAddress: getRequestIp(request, getClientAddress),
				userAgent: request.headers.get('user-agent')
			});

			return { success: 'All other sessions were revoked.' };
		} catch (error) {
			return fail(400, {
				error: normalizeError(error, 'Failed to revoke other sessions.')
			});
		}
	}
};
