CREATE TYPE "public"."sitemap_status" AS ENUM('idle', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "discovered_urls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sitemap_id" uuid,
	"url" varchar(2048) NOT NULL,
	"last_mod" timestamp with time zone,
	"selected" boolean DEFAULT true NOT NULL,
	"last_submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sitemaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"url" varchar(2048) NOT NULL,
	"status" "sitemap_status" DEFAULT 'idle' NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discovered_urls" ADD CONSTRAINT "discovered_urls_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovered_urls" ADD CONSTRAINT "discovered_urls_sitemap_id_sitemaps_id_fk" FOREIGN KEY ("sitemap_id") REFERENCES "public"."sitemaps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sitemaps" ADD CONSTRAINT "sitemaps_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "discovered_urls_project_url_uq" ON "discovered_urls" USING btree ("project_id","url");--> statement-breakpoint
CREATE UNIQUE INDEX "sitemaps_project_url_uq" ON "sitemaps" USING btree ("project_id","url");