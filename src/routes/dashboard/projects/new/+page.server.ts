import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { normalizeDomain } from '$lib/server/domain';
import { verifyIndexNowKey } from '$lib/server/indexnow/verify-key';
import { projects } from '$lib/server/db/schema';
import { canManageProjects, MANAGE_PERMISSION_ERROR } from '$lib/server/authz';
import { computeNextRunAt, isProjectSchedule, PROJECT_SCHEDULES } from '$lib/server/schedule';

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
		const rawSchedule = String(formData.get('schedule') ?? 'disabled');
		const payload = {
			name: String(formData.get('name') ?? ''),
			domain: String(formData.get('domain') ?? ''),
			indexNowKey: String(formData.get('indexNowKey') ?? ''),
			schedule: isProjectSchedule(rawSchedule) ? rawSchedule : 'disabled'
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
		try {
			await db.insert(projects).values({
				name: parsed.data.name,
				domain: normalizedDomain,
				indexNowKey: parsed.data.indexNowKey.trim(),
				schedule: parsed.data.schedule,
				nextRunAt: computeNextRunAt(parsed.data.schedule),
				lastAutomationRunAt: null
			});
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Could not create project.',
				values: payload
			});
		}

		throw redirect(303, '/dashboard/projects');
	}
};
