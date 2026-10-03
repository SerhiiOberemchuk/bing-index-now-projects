import { desc } from 'drizzle-orm';
import { z } from 'zod';

import { getDb } from '#lib/server/db/index.js';
import { normalizeDomain } from '#lib/server/domain.js';
import { verifyIndexNowKey } from '#lib/server/indexnow/verify-key.js';
import { projects } from '#lib/server/db/schema.js';
import { canManageProjects, MANAGE_PERMISSION_ERROR } from '#lib/server/authz.js';
import { DEFAULT_PROJECT_SCHEDULE } from '#lib/schedule.js';

const createProjectSchema = z.object({
	name: z.string().trim().min(2).max(120),
	domain: z.string().trim().min(3).max(255),
	indexNowKey: z.string().trim().min(8).max(128)
});

export async function GET() {
	const db = getDb();
	const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));

	return Response.json({ projects: rows }, { status: 200 });
}

export async function POST({ request, locals }) {
	if (!canManageProjects(locals.user)) {
		return Response.json({ error: MANAGE_PERMISSION_ERROR }, { status: 403 });
	}

	const payload = await request.json();
	const parsed = createProjectSchema.safeParse(payload);

	if (!parsed.success) {
		return Response.json(
			{
				error: 'Validation failed',
				issues: parsed.error.issues
			},
			{ status: 400 }
		);
	}

	const normalizedDomain = normalizeDomain(parsed.data.domain);
	if (!normalizedDomain) {
		return Response.json({ error: 'Invalid domain value' }, { status: 400 });
	}

	const verification = await verifyIndexNowKey(normalizedDomain, parsed.data.indexNowKey);
	if (!verification.ok) {
		return Response.json({ error: verification.error }, { status: 400 });
	}

	const db = getDb();
	const [project] = await db
		.insert(projects)
		.values({
			name: parsed.data.name,
			domain: normalizedDomain,
			indexNowKey: parsed.data.indexNowKey.trim(),
			schedule: DEFAULT_PROJECT_SCHEDULE
		})
		.returning();

	return Response.json({ project }, { status: 201 });
}
