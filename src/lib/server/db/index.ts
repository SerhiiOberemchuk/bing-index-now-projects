import { env } from '$env/dynamic/private';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
	if (dbInstance) {
		return dbInstance;
	}

	const databaseUrl = env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL is not set.');
	}

	const sql = neon(databaseUrl);
	dbInstance = drizzle(sql, { schema });

	return dbInstance;
}
