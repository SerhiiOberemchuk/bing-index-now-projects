import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { getDb } from '#lib/server/db/index.js';
import { normalizeDomain } from '#lib/server/domain.js';
import { verifyIndexNowKey } from '#lib/server/indexnow/verify-key.js';
import { projects } from '#lib/server/db/schema.js';
import { canManageProjects, MANAGE_PERMISSION_ERROR } from '#lib/server/authz.js';
import { DEFAULT_PROJECT_SCHEDULE, isProjectSchedule, PROJECT_SCHEDULES } from '#lib/schedule.js';

const createProjectSchema = z.object({
	name: z.string().trim().min(2).max(120),
	domain: z.string().trim().min(3).max(255),
	indexNowKey: z.string().trim().min(8).max(128),
	schedule: z.enum(PROJECT_SCHEDULES)
});

export const load: PageServerLoad = async ({ locals }) => {
	if (!canManageProjects(locals.user)) {
		throw error(403, MANAGE_PERMISSION_ERROR);
	}

	return {
		scheduleOptions: PROJECT_SCHEDULES
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const formData = await request.formData();
		const rawSchedule = String(formData.get('schedule') ?? DEFAULT_PROJECT_SCHEDULE);
		const payload = {
			name: String(formData.get('name') ?? ''),
			domain: String(formData.get('domain') ?? ''),
			indexNowKey: String(formData.get('indexNowKey') ?? ''),
			schedule: isProjectSchedule(rawSchedule) ? rawSchedule : DEFAULT_PROJECT_SCHEDULE
		};

		const parsed = createProjectSchema.safeParse(payload);
		if (!parsed.success) {
			return fail(400, {
				error: 'Validation failed. Check required fields.',
				values: payload
			});
		}

		const normalizedDomain = normalizeDomain(parsed.data.domain);
		if (!normalizedDomain) {
			return fail(400, {
				error: 'Invalid domain value.',
				values: payload
			});
		}

		const verification = await verifyIndexNowKey(normalizedDomain, parsed.data.indexNowKey);
		if (!verification.ok) {
			return fail(400, {
				error: verification.error,
				values: payload
			});
		}

		const db = getDb();
		let projectId: string;
		try {
			const [created] = await db
				.insert(projects)
				.values({
					name: parsed.data.name,
					domain: normalizedDomain,
					indexNowKey: parsed.data.indexNowKey.trim(),
					schedule: parsed.data.schedule,
					// Empty nextRunAt: the next cron run checks the new site right away.
					nextRunAt: null,
					lastAutomationRunAt: null
				})
				.returning({ id: projects.id });
			projectId = created.id;
		} catch (error) {
			const duplicate = error instanceof Error && /unique|duplicate/i.test(error.message);
			return fail(400, {
				error: duplicate
					? `${normalizedDomain} is already added.`
					: error instanceof Error
						? error.message
						: 'Could not create project.',
				values: payload
			});
		}

		throw redirect(303, `/dashboard/projects/${projectId}`);
	}
};
