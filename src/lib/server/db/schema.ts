import { relations } from 'drizzle-orm';
import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const projectStatusEnum = pgEnum('project_status', ['active', 'paused']);
export const submissionStatusEnum = pgEnum('submission_status', ['success', 'failed']);

export const projects = pgTable('projects', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 120 }).notNull(),
	domain: varchar('domain', { length: 255 }).notNull().unique(),
	indexNowKey: varchar('index_now_key', { length: 128 }).notNull(),
	status: projectStatusEnum('status').notNull().default('active'),
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

export const projectRelations = relations(projects, ({ many }) => ({
	submissions: many(indexNowSubmissions)
}));

export const submissionRelations = relations(indexNowSubmissions, ({ one }) => ({
	project: one(projects, {
		fields: [indexNowSubmissions.projectId],
		references: [projects.id]
	})
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type IndexNowSubmission = typeof indexNowSubmissions.$inferSelect;

