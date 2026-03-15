import { toSvelteKitHandler } from 'better-auth/svelte-kit';

import { auth } from '$lib/server/auth';

const handler = toSvelteKitHandler(auth);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
