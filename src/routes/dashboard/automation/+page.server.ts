import { desc, eq, or } from 'drizzle-orm';

import type { PageServerLoad } from './$types';
import { canManageProjects } from '$lib/server/authz';
import { getDb } from '$lib/server/db';
import { auditLog, projects } from '$lib/server/db/schema';

type AutomationRun = {
	id: string;
	auditId: string;
	createdAt: Date;
	source: 'cron' | 'manual';
	actorEmail: string;
	projectId: string | null;
	projectName: string | null;
	projectDomain: string | null;
	schedule: string | null;
	sitemapsTried: number;
	sitemapsSucceeded: number;
	sitemapsFailed: number;
	discoveredUrlsProcessed: number;
	selectedUrlsForIndexing: number;
	submissionBatches: number;
	submissionSucceeded: number;
	submissionFailed: number;
	errorCount: number;
	errors: string[];
	raw: unknown;
};

const AUTOMATION_ACTIONS = ['cron.indexnow.run', 'automation.run_manual'] as const;

function toRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object') return {};
	return value as Record<string, unknown>;
}

function toStringOrNull(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

function toNumber(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === 'string');
}

function flattenAutomationRuns(events: Array<typeof auditLog.$inferSelect>): AutomationRun[] {
	const runs: AutomationRun[] = [];

	for (const row of events) {
		if (!AUTOMATION_ACTIONS.includes(row.action as (typeof AUTOMATION_ACTIONS)[number])) continue;

		if (row.action === 'automation.run_manual') {
			const metadata = toRecord(row.metadata);
			const result = toRecord(metadata.result);

			runs.push({
				id: `${row.id}:manual`,
				auditId: row.id,
				createdAt: row.createdAt,
				source: 'manual',
				actorEmail: row.actorEmail ?? 'Unknown',
				projectId: row.targetId ?? toStringOrNull(metadata.projectId),
				projectName: null,
				projectDomain: toStringOrNull(metadata.projectDomain),
				schedule: toStringOrNull(metadata.schedule),
				sitemapsTried: toNumber(result.sitemapsTried),
				sitemapsSucceeded: toNumber(result.sitemapsSucceeded),
				sitemapsFailed: toNumber(result.sitemapsFailed),
				discoveredUrlsProcessed: toNumber(result.discoveredUrlsProcessed),
				selectedUrlsForIndexing: toNumber(result.selectedUrlsForIndexing),
				submissionBatches: toNumber(result.submissionBatches),
				submissionSucceeded: toNumber(result.submissionSucceeded),
				submissionFailed: toNumber(result.submissionFailed),
				errorCount: toStringArray(result.errors).length,
				errors: toStringArray(result.errors),
				raw: row.metadata
			});
			continue;
		}

		if (row.action === 'cron.indexnow.run') {
			const metadata = toRecord(row.metadata);
			const perProject = Array.isArray(metadata.perProject)
				? (metadata.perProject as Array<Record<string, unknown>>)
				: [];

			if (perProject.length === 0) {
				runs.push({
					id: `${row.id}:cron:summary`,
					auditId: row.id,
					createdAt: row.createdAt,
					source: 'cron',
					actorEmail: row.actorEmail ?? 'system',
					projectId: null,
					projectName: null,
					projectDomain: null,
					schedule: null,
					sitemapsTried: 0,
					sitemapsSucceeded: 0,
					sitemapsFailed: 0,
					discoveredUrlsProcessed: 0,
					selectedUrlsForIndexing: 0,
					submissionBatches: 0,
					submissionSucceeded: 0,
					submissionFailed: 0,
					errorCount: 0,
					errors: [],
					raw: row.metadata
				});
				continue;
			}

			for (const item of perProject) {
				const errors = toStringArray(item.errors);
				runs.push({
					id: `${row.id}:cron:${toStringOrNull(item.projectId) ?? 'unknown'}`,
					auditId: row.id,
					createdAt: row.createdAt,
					source: 'cron',
					actorEmail: row.actorEmail ?? 'system',
					projectId: toStringOrNull(item.projectId),
					projectName: null,
					projectDomain: toStringOrNull(item.domain),
					schedule: toStringOrNull(item.schedule),
					sitemapsTried: toNumber(item.sitemapsTried),
					sitemapsSucceeded: toNumber(item.sitemapsSucceeded),
					sitemapsFailed: toNumber(item.sitemapsFailed),
					discoveredUrlsProcessed: toNumber(item.discoveredUrlsProcessed),
					selectedUrlsForIndexing: toNumber(item.selectedUrlsForIndexing),
					submissionBatches: toNumber(item.submissionBatches),
					submissionSucceeded: toNumber(item.submissionSucceeded),
					submissionFailed: toNumber(item.submissionFailed),
					errorCount: errors.length,
					errors,
					raw: item
				});
			}
		}
	}

	return runs;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const canView = canManageProjects(locals.user);
	if (!canView) {
		return {
			canView,
			typeFilter: 'all',
			projectIdFilter: '',
			projects: [],
			runs: []
		};
	}

	const typeFilter = (() => {
		const value = (url.searchParams.get('type') ?? 'all').toLowerCase();
		if (value === 'manual' || value === 'cron' || value === 'all') return value;
		return 'all';
	})();
	const projectIdFilter = (url.searchParams.get('projectId') ?? '').trim();

	const db = getDb();
	const projectRows = await db
		.select({ id: projects.id, name: projects.name, domain: projects.domain })
		.from(projects)
		.orderBy(desc(projects.createdAt));

	const whereAction =
		typeFilter === 'manual'
			? eq(auditLog.action, 'automation.run_manual')
			: typeFilter === 'cron'
				? eq(auditLog.action, 'cron.indexnow.run')
				: or(eq(auditLog.action, 'automation.run_manual'), eq(auditLog.action, 'cron.indexnow.run'));

	const events = await db.select().from(auditLog).where(whereAction).orderBy(desc(auditLog.createdAt)).limit(250);
	let runs = flattenAutomationRuns(events);

	if (projectIdFilter.length > 0) {
		runs = runs.filter((run) => run.projectId === projectIdFilter);
	}

	const projectNameById = new Map(projectRows.map((row) => [row.id, row.name]));
	runs = runs.map((run) => ({
		...run,
		projectName: run.projectId ? (projectNameById.get(run.projectId) ?? null) : null
	}));

	return {
		canView,
		typeFilter,
		projectIdFilter,
		projects: projectRows,
		runs
	};
};
