import { relations } from 'drizzle-orm';
import {
	boolean,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	uniqueIndex,
	varchar
} from 'drizzle-orm/pg-core';

export const projectStatusEnum = pgEnum('project_status', ['active', 'paused']);
export const projectScheduleEnum = pgEnum('project_schedule', ['disabled', 'every_6h', 'daily', 'weekly']);
export const submissionStatusEnum = pgEnum('submission_status', ['success', 'failed']);
export const sitemapStatusEnum = pgEnum('sitemap_status', ['idle', 'success', 'failed']);
export const alertIncidentStatusEnum = pgEnum('alert_incident_status', ['active', 'acknowledged', 'resolved']);

export const projects = pgTable('projects', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 120 }).notNull(),
	domain: varchar('domain', { length: 255 }).notNull().unique(),
	indexNowKey: varchar('index_now_key', { length: 128 }).notNull(),
	status: projectStatusEnum('status').notNull().default('active'),
	schedule: projectScheduleEnum('schedule').notNull().default('disabled'),
	nextRunAt: timestamp('next_run_at', { withTimezone: true }),
	lastAutomationRunAt: timestamp('last_automation_run_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const indexNowSubmissions = pgTable('index_now_submissions', {
	id: uuid('id').defaultRandom().primaryKey(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	urlCount: integer('url_count').notNull(),
	responseStatusCode: integer('response_status_code'),
	responseBody: text('response_body'),
	status: submissionStatusEnum('status').notNull(),
	payload: jsonb('payload').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const sitemaps = pgTable(
	'sitemaps',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		url: varchar('url', { length: 2048 }).notNull(),
		status: sitemapStatusEnum('status').notNull().default('idle'),
		lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
		lastError: text('last_error'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('sitemaps_project_url_uq').on(table.projectId, table.url)]
);

export const discoveredUrls = pgTable(
	'discovered_urls',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		sitemapId: uuid('sitemap_id').references(() => sitemaps.id, { onDelete: 'set null' }),
		url: varchar('url', { length: 2048 }).notNull(),
		lastMod: timestamp('last_mod', { withTimezone: true }),
		selected: boolean('selected').notNull().default(true),
		lastSubmittedAt: timestamp('last_submitted_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('discovered_urls_project_url_uq').on(table.projectId, table.url)]
);

export const projectRelations = relations(projects, ({ many }) => ({
	submissions: many(indexNowSubmissions),
	sitemaps: many(sitemaps),
	discoveredUrls: many(discoveredUrls)
}));

export const submissionRelations = relations(indexNowSubmissions, ({ one }) => ({
	project: one(projects, {
		fields: [indexNowSubmissions.projectId],
		references: [projects.id]
	})
}));

export const sitemapRelations = relations(sitemaps, ({ one, many }) => ({
	project: one(projects, {
		fields: [sitemaps.projectId],
		references: [projects.id]
	}),
	discoveredUrls: many(discoveredUrls)
}));

export const discoveredUrlRelations = relations(discoveredUrls, ({ one }) => ({
	project: one(projects, {
		fields: [discoveredUrls.projectId],
		references: [projects.id]
	}),
	sitemap: one(sitemaps, {
		fields: [discoveredUrls.sitemapId],
		references: [sitemaps.id]
	})
}));

export const auditLog = pgTable('audit_log', {
	id: uuid('id').defaultRandom().primaryKey(),
	actorUserId: text('actor_user_id').references(() => user.id, { onDelete: 'set null' }),
	actorEmail: varchar('actor_email', { length: 255 }),
	action: varchar('action', { length: 64 }).notNull(),
	targetType: varchar('target_type', { length: 64 }),
	targetId: text('target_id'),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});


export const alertIncidentState = pgTable(
	'alert_incident_state',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		fingerprint: varchar('fingerprint', { length: 255 }).notNull(),
		status: alertIncidentStatusEnum('status').notNull().default('active'),
		note: text('note'),
		updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('alert_incident_state_fingerprint_uq').on(table.fingerprint)]
);
export const authThrottle = pgTable(
	'auth_throttle',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		action: varchar('action', { length: 32 }).notNull(),
		throttleKey: varchar('throttle_key', { length: 255 }).notNull(),
		attemptCount: integer('attempt_count').notNull().default(0),
		windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull().defaultNow(),
		lockedUntil: timestamp('locked_until', { withTimezone: true }),
		lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('auth_throttle_action_key_uq').on(table.action, table.throttleKey)]
);

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	role: varchar('role', { length: 32 }).notNull().default('viewer'),
	approved: boolean('approved').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const authInvites = pgTable(
	'auth_invites',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		email: varchar('email', { length: 255 }).notNull(),
		token: varchar('token', { length: 128 }).notNull(),
		role: varchar('role', { length: 32 }).notNull().default('viewer'),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		usedAt: timestamp('used_at', { withTimezone: true }),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),
		usedByEmail: varchar('used_by_email', { length: 255 }),
		createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('auth_invites_token_uq').on(table.token)]
);

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [uniqueIndex('account_provider_account_uq').on(table.accountId, table.providerId)]
);

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type IndexNowSubmission = typeof indexNowSubmissions.$inferSelect;
export type Sitemap = typeof sitemaps.$inferSelect;
export type DiscoveredUrl = typeof discoveredUrls.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type AuthInvite = typeof authInvites.$inferSelect;



