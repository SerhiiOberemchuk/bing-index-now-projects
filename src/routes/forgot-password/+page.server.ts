import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { checkThrottle, createThrottleKey, formatRetryAfter, recordThrottleAttempt } from '$lib/server/auth-throttle';
import { getRequestIp } from '$lib/server/request-ip';

export const load: PageServerLoad = async () => ({
	title: 'Forgot password'
});

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!email) {
			return fail(400, {
				error: 'Email is required.',
				email
			});
		}

		const ip = getRequestIp(event.request, event.getClientAddress);
		const throttleKey = createThrottleKey(ip, email);
		const throttleStatus = await checkThrottle('forgot_password', throttleKey);
		if (throttleStatus.blocked) {
			return fail(429, {
				error: `Too many reset requests. Try again in ${formatRetryAfter(throttleStatus.retryAfterSec)}.`,
				email
			});
		}

		try {
			await auth.api.requestPasswordReset({
				body: {
					email,
					redirectTo: '/reset-password'
				},
				headers: event.request.headers
			});
		} catch {
			// Keep generic response to prevent user enumeration.
		}

		const throttleAttempt = await recordThrottleAttempt('forgot_password', throttleKey);
		if (throttleAttempt.locked) {
			return fail(429, {
				error: `Too many reset requests. Try again in ${formatRetryAfter(throttleAttempt.retryAfterSec)}.`,
				email
			});
		}

		return {
			success: 'If this email exists, a reset link has been sent.',
			email
		};
	}
};
