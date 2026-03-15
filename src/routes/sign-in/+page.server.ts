import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { checkThrottle, clearThrottle, createThrottleKey, formatRetryAfter, recordThrottleFailure } from '$lib/server/auth-throttle';
import { getRequestIp } from '$lib/server/request-ip';

export const load: PageServerLoad = async ({ url }) => ({
	title: 'Sign in',
	showVerificationNotice: url.searchParams.get('verify') === '1',
	showResetNotice: url.searchParams.get('reset') === '1'
});

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required.',
				email
			});
		}

		const ip = getRequestIp(event.request, event.getClientAddress);
		const throttleKey = createThrottleKey(ip, email);
		const throttleStatus = await checkThrottle('sign_in', throttleKey);
		if (throttleStatus.blocked) {
			return fail(429, {
				error: `Too many sign-in attempts. Try again in ${formatRetryAfter(throttleStatus.retryAfterSec)}.`,
				email
			});
		}

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password
				},
				headers: event.request.headers
			});
			await clearThrottle('sign_in', throttleKey);
		} catch {
			const throttleFailure = await recordThrottleFailure('sign_in', throttleKey);
			if (throttleFailure.locked) {
				return fail(429, {
					error: `Too many sign-in attempts. Try again in ${formatRetryAfter(throttleFailure.retryAfterSec)}.`,
					email
				});
			}

			return fail(400, {
				error: 'Sign in failed. Check credentials and verify your email first.',
				email
			});
		}

		throw redirect(303, '/dashboard');
	}
};
