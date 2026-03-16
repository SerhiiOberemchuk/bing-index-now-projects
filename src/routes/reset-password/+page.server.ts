import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => ({
	token: url.searchParams.get('token') ?? ''
});

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const token = String(formData.get('token') ?? '').trim();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!token) {
			return fail(400, {
				error: 'Reset token is missing or invalid.',
				token
			});
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters long.',
				token
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match.',
				token
			});
		}

		try {
			await auth.api.resetPassword({
				body: {
					token,
					newPassword: password
				},
				headers: event.request.headers
			});
		} catch {
			return fail(400, {
				error: 'Could not reset password. The link may be expired or invalid.',
				token
			});
		}

		throw redirect(303, '/sign-in?reset=1');
	}
};
