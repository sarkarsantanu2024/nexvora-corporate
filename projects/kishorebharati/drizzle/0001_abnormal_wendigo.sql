CREATE TABLE "message_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"to_name" text DEFAULT '' NOT NULL,
	"phone" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"entity" text DEFAULT '' NOT NULL,
	"entity_id" text DEFAULT '' NOT NULL,
	"href" text DEFAULT '' NOT NULL,
	"due_on" date NOT NULL,
	"done_at" timestamp with time zone,
	"done_by" uuid,
	"done_by_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_outbox" ADD CONSTRAINT "message_outbox_done_by_users_id_fk" FOREIGN KEY ("done_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "message_outbox_dedupe_uq" ON "message_outbox" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "message_outbox_status_idx" ON "message_outbox" USING btree ("status","due_on");