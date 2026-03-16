CREATE TYPE "public"."project_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TABLE "index_now_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"url_count" integer NOT NULL,
	"response_status_code" integer,
	"response_body" text,
	"status" "submission_status" NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"index_now_key" varchar(128) NOT NULL,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
ALTER TABLE "index_now_submissions" ADD CONSTRAINT "index_now_submissions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;