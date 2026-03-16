import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

import { auth } from '$lib/server/auth';

const PUBLIC_ROUTES = ['/sign-in', '/sign-up'];
const PENDING_APPROVAL_ROUTE = '/pending-approval';
const PUBLIC_API_ROUTES = ['/api/health', '/api/cron/indexnow'];

export const handle: Handle = async ({ event, resolve }) => {
	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = sessionData?.session ?? null;
	event.locals.user = sessionData?.user ?? null;

	const pathname = event.url.pathname;
	const isAuthPage = PUBLIC_ROUTES.includes(pathname);
	const isPendingApprovalPage = pathname === PENDING_APPROVAL_ROUTE;
	const isProtectedPage = pathname.startsWith('/dashboard');
	const isProtectedApi =
		pathname.startsWith('/api') &&
		!pathname.startsWith('/api/auth') &&
		!PUBLIC_API_ROUTES.includes(pathname);
	const isApproved = event.locals.user?.approved === true;

	if (isProtectedApi && !event.locals.session) {
		return new Response(JSON.stringify({ message: 'Unauthorized' }), {
			status: 401,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	if (isProtectedApi && event.locals.session && !isApproved) {
		return new Response(JSON.stringify({ message: 'Account is pending owner approval.' }), {
			status: 403,
			headers: {
				'content-type': 'application/json'
			}
		});
	}

	if (isProtectedPage && !event.locals.session) {
		throw redirect(303, '/sign-in');
	}

	if (isProtectedPage && event.locals.session && !isApproved) {
		throw redirect(303, PENDING_APPROVAL_ROUTE);
	}

	if (isPendingApprovalPage && !event.locals.session) {
		throw redirect(303, '/sign-in');
	}

	if (isPendingApprovalPage && isApproved) {
		throw redirect(303, '/dashboard');
	}

	if (isAuthPage && event.locals.session) {
		throw redirect(303, isApproved ? '/dashboard' : PENDING_APPROVAL_ROUTE);
	}

	return svelteKitHandler({
		auth,
		event,
		resolve,
		building
	});
};
