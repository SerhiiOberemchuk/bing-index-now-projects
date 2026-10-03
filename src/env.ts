import { defineEnvVars } from '@sveltejs/kit/env';

// Read at runtime; a missing variable becomes an empty string, which the code treats as "not set".
export const variables = defineEnvVars({
	CRON_SECRET: { schema: (input) => input ?? '' },
	BETTER_AUTH_URL: { schema: (input) => input ?? '' },
	BETTER_AUTH_SECRET: { schema: (input) => input ?? '' },
	MAIL_PROVIDER: { schema: (input) => input ?? '' },
	GMAIL_USER: { schema: (input) => input ?? '' },
	GOOGLE_APP_PASSWORD: { schema: (input) => input ?? '' },
	SMTP_FROM: { schema: (input) => input ?? '' },
	bing_DATABASE_URL: { schema: (input) => input ?? '' }
});
