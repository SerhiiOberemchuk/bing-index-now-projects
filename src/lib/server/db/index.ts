import { env } from '$env/dynamic/private';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

export type DbClient = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: DbClient | null = null;

export function getDb(): DbClient {
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
