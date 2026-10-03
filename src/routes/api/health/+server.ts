import { sql } from 'drizzle-orm';

import { getDb } from '#lib/server/db/index.js';

export async function GET() {
	try {
		const db = getDb();
		await db.execute(sql`select 1`);

		return Response.json(
			{
				status: 'ok',
				database: 'connected',
				timestamp: new Date().toISOString()
			},
			{ status: 200 }
		);
	} catch (error) {
		return Response.json(
			{
				status: 'error',
				database: 'disconnected',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
}
