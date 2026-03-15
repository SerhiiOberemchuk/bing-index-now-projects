import { and, desc, eq, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { canManageProjects, MANAGE_PERMISSION_ERROR } from '$lib/server/authz';
import { getDb } from '$lib/server/db';
import { alertIncidentState, auditLog, indexNowSubmissions, projects, sitemaps } from '$lib/server/db/schema';

type AlertStatus = 'active' | 'acknowledged' | 'resolved';

type AutomationAlert = {
	fingerprint: string;
	createdAt: Date;
	type: 'manual' | 'cron';
	projectId: string | null;
	projectName: string | null;
	projectDomain: string | null;
	errors: string[];
	status: AlertStatus;
	note: string | null;
};

type SubmissionAlert = {
	fingerprint: string;
	id: string;
	createdAt: Date;
	projectId: string;
	projectDomain: string;
	responseStatusCode: number | null;
	responseBody: string | null;
	urlCount: number;
	status: AlertStatus;
	note: string | null;
};

type SitemapAlert = {
	fingerprint: string;
	id: string;
	updatedAt: Date;
	projectId: string;
	projectDomain: string;
	sitemapUrl: string;
	lastError: string | null;
	status: AlertStatus;
	note: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object') return {};
	return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function buildFingerprint(kind: string, id: string): string {
	return `${kind}:${id}`;
}

function clampStatus(value: string): AlertStatus {
	return value === 'acknowledged' || value === 'resolved' ? value : 'active';
}

async function applyAlertStatus(input: {
	fingerprint: string;
	status: AlertStatus;
	note: string | null;
	userId: string | null;
}) {
	const db = getDb();
	await db
		.insert(alertIncidentState)
		.values({
			fingerprint: input.fingerprint,
			status: input.status,
			note: input.note,
			updatedByUserId: input.userId,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: [alertIncidentState.fingerprint],
			set: {
				status: input.status,
				note: input.note,
				updatedByUserId: input.userId,
				updatedAt: new Date()
			}
		});
}

function withState<T extends { fingerprint: string }>(
	items: T[],
	stateByFingerprint: Map<string, { status: AlertStatus; note: string | null }>
): Array<T & { status: AlertStatus; note: string | null }> {
	return items.map((item) => {
		const state = stateByFingerprint.get(item.fingerprint);
		return {
			...item,
			status: state?.status ?? 'active',
			note: state?.note ?? null
		};
	});
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const canView = canManageProjects(locals.user);
	if (!canView) {
		return {
			canView,
			statusFilter: 'all',
			stats: { total: 0, active: 0, acknowledged: 0, resolved: 0, automation: 0, submissions: 0, sitemaps: 0 },
			automationAlerts: [],
			failedSubmissions: [],
			failedSitemaps: []
		};
	}

	const statusFilter = (() => {
		const value = (url.searchParams.get('status') ?? 'all').toLowerCase();
		if (value === 'active' || value === 'acknowledged' || value === 'resolved' || value === 'all') return value;
		return 'all';
	})();

	const db = getDb();

	const automationEvents = await db
		.select()
		.from(auditLog)
		.where(inArray(auditLog.action, ['automation.run_manual', 'cron.indexnow.run']))
		.orderBy(desc(auditLog.createdAt))
		.limit(250);

	let automationAlerts: Array<Omit<AutomationAlert, 'status' | 'note'>> = [];

	for (const row of automationEvents) {
		if (row.action === 'automation.run_manual') {
			const metadata = asRecord(row.metadata);
			const result = asRecord(metadata.result);
			const errors = asStringArray(result.errors);
			if (errors.length === 0) continue;
			automationAlerts.push({
				fingerprint: buildFingerprint('automation_manual', row.id),
				createdAt: row.createdAt,
				type: 'manual',
				projectId: row.targetId ?? null,
				projectName: null,
				projectDomain: asString(metadata.projectDomain),
				errors
			});
			continue;
		}

		if (row.action === 'cron.indexnow.run') {
			const metadata = asRecord(row.metadata);
			const perProject = Array.isArray(metadata.perProject)
				? (metadata.perProject as Array<Record<string, unknown>>)
				: [];

			for (const item of perProject) {
				const errors = asStringArray(item.errors);
				if (errors.length === 0) continue;

				const projectId = asString(item.projectId);
				automationAlerts.push({
					fingerprint: buildFingerprint('automation_cron', `${row.id}:${projectId ?? 'unknown'}`),
					createdAt: row.createdAt,
					type: 'cron',
					projectId,
					projectName: null,
					projectDomain: asString(item.domain),
					errors
				});
			}
		}
	}

	const failedSubmissionsRaw = await db
		.select({
			id: indexNowSubmissions.id,
			createdAt: indexNowSubmissions.createdAt,
			projectId: indexNowSubmissions.projectId,
			projectDomain: projects.domain,
			responseStatusCode: indexNowSubmissions.responseStatusCode,
			responseBody: indexNowSubmissions.responseBody,
			urlCount: indexNowSubmissions.urlCount
		})
		.from(indexNowSubmissions)
		.innerJoin(projects, eq(indexNowSubmissions.projectId, projects.id))
		.where(eq(indexNowSubmissions.status, 'failed'))
		.orderBy(desc(indexNowSubmissions.createdAt))
		.limit(80);

	const failedSitemapsRaw = await db
		.select({
			id: sitemaps.id,
			updatedAt: sitemaps.updatedAt,
			projectId: sitemaps.projectId,
			projectDomain: projects.domain,
			sitemapUrl: sitemaps.url,
			lastError: sitemaps.lastError
		})
		.from(sitemaps)
		.innerJoin(projects, eq(sitemaps.projectId, projects.id))
		.where(eq(sitemaps.status, 'failed'))
		.orderBy(desc(sitemaps.updatedAt))
		.limit(80);

	const projectRows = await db
		.select({ id: projects.id, name: projects.name })
		.from(projects)
		.where(
			inArray(
				projects.id,
				Array.from(
					new Set(
						automationAlerts
							.map((item) => item.projectId)
							.filter((id): id is string => typeof id === 'string')
					)
				)
			)
		);
	const projectNameById = new Map(projectRows.map((row) => [row.id, row.name]));
	automationAlerts = automationAlerts.map((alert) => ({
		...alert,
		projectName: alert.projectId ? (projectNameById.get(alert.projectId) ?? null) : null
	}));

	const submissionAlerts = failedSubmissionsRaw.map((row) => ({
		...row,
		fingerprint: buildFingerprint('submission_failed', row.id)
	}));
	const sitemapAlerts = failedSitemapsRaw.map((row) => ({
		...row,
		fingerprint: buildFingerprint('sitemap_failed', row.id)
	}));

	const fingerprints = [
		...automationAlerts.map((item) => item.fingerprint),
		...submissionAlerts.map((item) => item.fingerprint),
		...sitemapAlerts.map((item) => item.fingerprint)
	];

	const stateRows =
		fingerprints.length > 0
			? await db
				.select({
					fingerprint: alertIncidentState.fingerprint,
					status: alertIncidentState.status,
					note: alertIncidentState.note
				})
				.from(alertIncidentState)
				.where(inArray(alertIncidentState.fingerprint, fingerprints))
			: [];

	const stateByFingerprint = new Map(
		stateRows.map((row) => [row.fingerprint, { status: row.status, note: row.note }])
	);

	let automationWithState = withState(automationAlerts, stateByFingerprint);
	let submissionsWithState = withState(submissionAlerts, stateByFingerprint);
	let sitemapsWithState = withState(sitemapAlerts, stateByFingerprint);

	if (statusFilter !== 'all') {
		automationWithState = automationWithState.filter((item) => item.status === statusFilter);
		submissionsWithState = submissionsWithState.filter((item) => item.status === statusFilter);
		sitemapsWithState = sitemapsWithState.filter((item) => item.status === statusFilter);
	}

	const allItems = [...automationWithState, ...submissionsWithState, ...sitemapsWithState];
	const statusCounts = allItems.reduce(
		(acc, item) => {
			acc[item.status] += 1;
			return acc;
		},
		{ active: 0, acknowledged: 0, resolved: 0 }
	);

	return {
		canView,
		statusFilter,
		stats: {
			total: allItems.length,
			active: statusCounts.active,
			acknowledged: statusCounts.acknowledged,
			resolved: statusCounts.resolved,
			automation: automationWithState.length,
			submissions: submissionsWithState.length,
			sitemaps: sitemapsWithState.length
		},
		automationAlerts: automationWithState,
		failedSubmissions: submissionsWithState,
		failedSitemaps: sitemapsWithState
	};
};

export const actions: Actions = {
	setStatus: async ({ request, locals }) => {
		if (!canManageProjects(locals.user)) {
			return fail(403, { error: MANAGE_PERMISSION_ERROR });
		}

		const formData = await request.formData();
		const fingerprint = String(formData.get('fingerprint') ?? '').trim();
		const rawStatus = String(formData.get('status') ?? 'active').trim();
		const noteRaw = String(formData.get('note') ?? '').trim();
		const note = noteRaw.length > 0 ? noteRaw.slice(0, 500) : null;

		if (!fingerprint) {
			return fail(400, { error: 'Missing alert fingerprint.' });
		}

		const status = clampStatus(rawStatus);
		await applyAlertStatus({
			fingerprint,
			status,
			note,
			userId: locals.user?.id ?? null
		});

		return {
			success:
				status === 'acknowledged'
					? 'Alert acknowledged.'
					: status === 'resolved'
						? 'Alert marked as resolved.'
						: 'Alert returned to active state.'
		};
	}
};
