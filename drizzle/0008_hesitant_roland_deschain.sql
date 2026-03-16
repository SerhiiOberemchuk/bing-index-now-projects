CREATE TYPE "public"."project_schedule" AS ENUM('disabled', 'every_6h', 'daily', 'weekly');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "schedule" "project_schedule" DEFAULT 'disabled' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "next_run_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "last_automation_run_at" timestamp with time zone;