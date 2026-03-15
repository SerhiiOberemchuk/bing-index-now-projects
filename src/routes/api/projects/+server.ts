import { desc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { z } from 'zod';

import { getDb } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';

const createProjectSchema = z.object({
	name: z.string().trim().min(2).max(120),
	domain: z.string().trim().toLowerCase().min(3).max(255),
	indexNowKey: z.string().trim().min(8).max(128)
});

export async function GET() {
	const db = getDb();
	const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));

	return json({ projects: rows }, { status: 200 });
}

export async function POST({ request }) {
	const payload = await request.json();
	const parsed = createProjectSchema.safeParse(payload);

	if (!parsed.success) {
		return json(
			{
				error: 'Validation failed',
				issues: parsed.error.issues
			},
			{ status: 400 }
		);
	}

	const db = getDb();
	const [project] = await db.insert(projects).values(parsed.data).returning();

	return json({ project }, { status: 201 });
}
