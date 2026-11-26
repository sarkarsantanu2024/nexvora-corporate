CREATE TABLE "asset_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"day" date NOT NULL,
	"kind" text NOT NULL,
	"quantity" integer NOT NULL,
	"party" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_by_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"damaged" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"condition" text DEFAULT 'good' NOT NULL,
	"purchased_on" date,
	"source" text DEFAULT 'school_fund' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circular_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_no" text NOT NULL,
	"student_id" uuid NOT NULL,
	"day" date NOT NULL,
	"time" text NOT NULL,
	"guardian_name" text NOT NULL,
	"guardian_relation" text DEFAULT '' NOT NULL,
	"guardian_phone" text DEFAULT '' NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"approved_by" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mdm_class_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"grade" integer NOT NULL,
	"present" integer DEFAULT 0 NOT NULL,
	"ate" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mdm_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"menu" text DEFAULT '' NOT NULL,
	"cooks_present" integer DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mdm_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"item" text NOT NULL,
	"received" integer DEFAULT 0 NOT NULL,
	"used" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"day" date NOT NULL,
	"time" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"grade" integer,
	"venue" text DEFAULT '' NOT NULL,
	"attendees" text DEFAULT '' NOT NULL,
	"agenda" text DEFAULT '' NOT NULL,
	"minutes" text DEFAULT '' NOT NULL,
	"attachment" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"leave_type" text NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"days" integer NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"applied_by" uuid,
	"applied_by_name" text DEFAULT '' NOT NULL,
	"decided_by" uuid,
	"decided_by_name" text DEFAULT '' NOT NULL,
	"decided_at" timestamp with time zone,
	"decision_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"day" date NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_by_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"whom_to_meet" text DEFAULT '' NOT NULL,
	"purpose" text DEFAULT '' NOT NULL,
	"in_time" text NOT NULL,
	"out_time" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circular_reads" ADD CONSTRAINT "circular_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circular_reads" ADD CONSTRAINT "circular_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mdm_class_counts" ADD CONSTRAINT "mdm_class_counts_day_id_mdm_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."mdm_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mdm_days" ADD CONSTRAINT "mdm_days_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mdm_stock" ADD CONSTRAINT "mdm_stock_day_id_mdm_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."mdm_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_applied_by_users_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_records" ADD CONSTRAINT "student_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_records" ADD CONSTRAINT "student_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_movements_asset_idx" ON "asset_movements" USING btree ("asset_id","day");--> statement-breakpoint
CREATE INDEX "assets_category_idx" ON "assets" USING btree ("category","name");--> statement-breakpoint
CREATE UNIQUE INDEX "circular_reads_uq" ON "circular_reads" USING btree ("announcement_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gate_passes_serial_uq" ON "gate_passes" USING btree ("serial_no");--> statement-breakpoint
CREATE INDEX "gate_passes_day_idx" ON "gate_passes" USING btree ("day");--> statement-breakpoint
CREATE INDEX "gate_passes_student_idx" ON "gate_passes" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mdm_class_counts_uq" ON "mdm_class_counts" USING btree ("day_id","grade");--> statement-breakpoint
CREATE UNIQUE INDEX "mdm_days_day_uq" ON "mdm_days" USING btree ("day");--> statement-breakpoint
CREATE UNIQUE INDEX "mdm_stock_uq" ON "mdm_stock" USING btree ("day_id","item");--> statement-breakpoint
CREATE INDEX "meetings_day_idx" ON "meetings" USING btree ("day");--> statement-breakpoint
CREATE INDEX "staff_leaves_staff_idx" ON "staff_leaves" USING btree ("staff_id","from_date");--> statement-breakpoint
CREATE INDEX "staff_leaves_status_idx" ON "staff_leaves" USING btree ("status");--> statement-breakpoint
CREATE INDEX "student_records_student_idx" ON "student_records" USING btree ("student_id","day");--> statement-breakpoint
CREATE INDEX "student_records_kind_idx" ON "student_records" USING btree ("kind","day");--> statement-breakpoint
CREATE INDEX "visitors_day_idx" ON "visitors" USING btree ("day");