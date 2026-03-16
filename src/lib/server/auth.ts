import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { sendPasswordResetEmail, sendVerificationEmail } from '$lib/server/email/verification';

export const OWNER_EMAIL = 'serhiioberemchuk@gmail.com';

export const auth = betterAuth({
	appName: 'IndexNow Control Center',
	basePath: '/api/auth',
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(getDb(), {
		provider: 'pg',
		schema,
		camelCase: false
	}),
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: true,
				defaultValue: 'viewer',
				input: false
			},
			approved: {
				type: 'boolean',
				required: true,
				defaultValue: false,
				input: false
			}
		}
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
		requireEmailVerification: true,
		minPasswordLength: 8,
		resetPasswordTokenExpiresIn: 3600,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			await sendPasswordResetEmail(user.email, url);
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendVerificationEmail(user.email, url);
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)],
	databaseHooks: {
		user: {
			create: {
				before: async (newUser) => {
					const isOwner = newUser.email.toLowerCase() === OWNER_EMAIL;
					return {
						data: {
							role: isOwner ? 'owner' : 'viewer',
							approved: isOwner
						}
					};
				}
			}
		}
	}
});
