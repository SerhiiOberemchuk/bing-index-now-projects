CREATE TYPE "public"."alert_incident_status" AS ENUM('active', 'acknowledged', 'resolved');--> statement-breakpoint
CREATE TABLE "alert_incident_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" varchar(255) NOT NULL,
	"status" "alert_incident_status" DEFAULT 'active' NOT NULL,
	"note" text,
	"updated_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_incident_state" ADD CONSTRAINT "alert_incident_state_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_incident_state_fingerprint_uq" ON "alert_incident_state" USING btree ("fingerprint");