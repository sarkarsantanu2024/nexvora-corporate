CREATE TABLE "academic_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_by" uuid,
	"created_by_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid,
	"child_name" text NOT NULL,
	"dob" date,
	"programme_id" uuid,
	"parent_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"stage" text DEFAULT 'new' NOT NULL,
	"next_follow_up" date,
	"visit_on" date,
	"lost_reason" text DEFAULT '' NOT NULL,
	"converted_student_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audience" text NOT NULL,
	"centre_id" uuid,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"event_date" date,
	"publish_on" date NOT NULL,
	"expires_on" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"batch_id" uuid,
	"day" date NOT NULL,
	"status" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"marked_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_name" text DEFAULT '' NOT NULL,
	"centre_id" uuid,
	"action" text NOT NULL,
	"entity" text DEFAULT '' NOT NULL,
	"entity_id" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"programme_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 12 NOT NULL,
	"timing" text DEFAULT '' NOT NULL,
	"teacher_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "centres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"is_company_owned" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"show_on_website" boolean DEFAULT true NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"pincode" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"map_url" text DEFAULT '' NOT NULL,
	"photo" text DEFAULT '' NOT NULL,
	"owner_name" text DEFAULT '' NOT NULL,
	"owner_phone" text DEFAULT '' NOT NULL,
	"owner_email" text DEFAULT '' NOT NULL,
	"opened_on" date,
	"agreement_start" date,
	"agreement_end" date,
	"franchise_fee" integer DEFAULT 0 NOT NULL,
	"franchise_fee_paid" integer DEFAULT 0 NOT NULL,
	"royalty_type" text DEFAULT 'percent' NOT NULL,
	"royalty_value" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"message" text NOT NULL,
	"centre_id" uuid,
	"handled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"data" jsonb NOT NULL,
	"via" text DEFAULT 'panel' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_by_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"amount" integer NOT NULL,
	"spent_on" date NOT NULL,
	"paid_to" text DEFAULT '' NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"staff_id" uuid,
	"salary_period" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fee_heads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid,
	"name" text NOT NULL,
	"kind" text DEFAULT 'monthly' NOT NULL,
	"programme_id" uuid,
	"amount" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "franchise_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"occupation" text DEFAULT '' NOT NULL,
	"investment_range" text DEFAULT '' NOT NULL,
	"has_space" boolean,
	"space_sqft" integer,
	"message" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"stage" text DEFAULT 'new' NOT NULL,
	"assigned_to" uuid,
	"next_follow_up" date,
	"lost_reason" text DEFAULT '' NOT NULL,
	"converted_centre_id" uuid,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"album" text DEFAULT 'General' NOT NULL,
	"centre_id" uuid,
	"width" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"fee_head_id" uuid,
	"description" text NOT NULL,
	"amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"invoice_no" text NOT NULL,
	"period" text,
	"title" text DEFAULT '' NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"paid" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"filename" text DEFAULT '' NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"width" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"folder" text DEFAULT 'general' NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"receipt_no" text NOT NULL,
	"amount" integer NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"paid_on" date NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"received_by" uuid,
	"voided_at" timestamp with time zone,
	"void_reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"age_label" text DEFAULT '' NOT NULL,
	"age_from_months" integer DEFAULT 0 NOT NULL,
	"age_to_months" integer DEFAULT 0 NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"color" text DEFAULT 'indigo' NOT NULL,
	"seats_per_class" integer DEFAULT 12 NOT NULL,
	"timing" text DEFAULT '' NOT NULL,
	"suggested_monthly_fee" integer DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "royalty_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"period" text NOT NULL,
	"basis_amount" integer DEFAULT 0 NOT NULL,
	"royalty_type" text NOT NULL,
	"royalty_value" integer NOT NULL,
	"amount" integer NOT NULL,
	"paid" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"due_date" date NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "royalty_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"royalty_invoice_id" uuid NOT NULL,
	"centre_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"method" text DEFAULT 'bank' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"paid_on" date NOT NULL,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"draft" jsonb,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role_title" text DEFAULT 'Teacher' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"qualification" text DEFAULT '' NOT NULL,
	"joined_on" date,
	"left_on" date,
	"monthly_salary" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"user_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "staff_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"day" date NOT NULL,
	"status" text NOT NULL,
	"marked_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"admission_no" text NOT NULL,
	"name" text NOT NULL,
	"dob" date,
	"gender" text DEFAULT '' NOT NULL,
	"photo" text DEFAULT '' NOT NULL,
	"programme_id" uuid,
	"batch_id" uuid,
	"academic_year_id" uuid,
	"admission_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"left_on" date,
	"left_reason" text DEFAULT '' NOT NULL,
	"father_name" text DEFAULT '' NOT NULL,
	"mother_name" text DEFAULT '' NOT NULL,
	"guardian_phone" text DEFAULT '' NOT NULL,
	"alt_phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"blood_group" text DEFAULT '' NOT NULL,
	"medical_notes" text DEFAULT '' NOT NULL,
	"pickup_person" text DEFAULT '' NOT NULL,
	"tshirt_size" text DEFAULT '' NOT NULL,
	"monthly_fee" integer,
	"parent_user_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"centre_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_notes" ADD CONSTRAINT "activity_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_enquiries" ADD CONSTRAINT "admission_enquiries_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_enquiries" ADD CONSTRAINT "admission_enquiries_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_enquiries" ADD CONSTRAINT "admission_enquiries_converted_student_id_students_id_fk" FOREIGN KEY ("converted_student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_teacher_id_staff_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_heads" ADD CONSTRAINT "fee_heads_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_heads" ADD CONSTRAINT "fee_heads_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "franchise_leads" ADD CONSTRAINT "franchise_leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "franchise_leads" ADD CONSTRAINT "franchise_leads_converted_centre_id_centres_id_fk" FOREIGN KEY ("converted_centre_id") REFERENCES "public"."centres"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_fee_head_id_fee_heads_id_fk" FOREIGN KEY ("fee_head_id") REFERENCES "public"."fee_heads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "royalty_invoices" ADD CONSTRAINT "royalty_invoices_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "royalty_payments" ADD CONSTRAINT "royalty_payments_royalty_invoice_id_royalty_invoices_id_fk" FOREIGN KEY ("royalty_invoice_id") REFERENCES "public"."royalty_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "royalty_payments" ADD CONSTRAINT "royalty_payments_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "royalty_payments" ADD CONSTRAINT "royalty_payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_content" ADD CONSTRAINT "site_content_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_name_uq" ON "academic_years" USING btree ("name");--> statement-breakpoint
CREATE INDEX "activity_notes_entity_idx" ON "activity_notes" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "admission_enquiries_centre_idx" ON "admission_enquiries" USING btree ("centre_id","stage");--> statement-breakpoint
CREATE INDEX "announcements_audience_idx" ON "announcements" USING btree ("audience","centre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_student_day_uq" ON "attendance" USING btree ("student_id","day");--> statement-breakpoint
CREATE INDEX "attendance_centre_day_idx" ON "attendance" USING btree ("centre_id","day");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_centre_idx" ON "audit_log" USING btree ("centre_id");--> statement-breakpoint
CREATE INDEX "batches_centre_idx" ON "batches" USING btree ("centre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "centres_code_uq" ON "centres" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "centres_slug_uq" ON "centres" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_revisions_key_idx" ON "content_revisions" USING btree ("key","created_at");--> statement-breakpoint
CREATE INDEX "expenses_centre_spent_idx" ON "expenses" USING btree ("centre_id","spent_on");--> statement-breakpoint
CREATE INDEX "fee_heads_centre_idx" ON "fee_heads" USING btree ("centre_id");--> statement-breakpoint
CREATE INDEX "franchise_leads_stage_idx" ON "franchise_leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "gallery_album_idx" ON "gallery_items" USING btree ("album");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_no_uq" ON "invoices" USING btree ("centre_id","invoice_no");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_student_period_uq" ON "invoices" USING btree ("student_id","period");--> statement-breakpoint
CREATE INDEX "invoices_centre_status_idx" ON "invoices" USING btree ("centre_id","status");--> statement-breakpoint
CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_receipt_uq" ON "payments" USING btree ("centre_id","receipt_no");--> statement-breakpoint
CREATE INDEX "payments_centre_paid_idx" ON "payments" USING btree ("centre_id","paid_on");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programmes_slug_uq" ON "programmes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "royalty_invoices_centre_period_uq" ON "royalty_invoices" USING btree ("centre_id","period");--> statement-breakpoint
CREATE INDEX "royalty_payments_invoice_idx" ON "royalty_payments" USING btree ("royalty_invoice_id");--> statement-breakpoint
CREATE INDEX "staff_centre_idx" ON "staff" USING btree ("centre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_attendance_day_uq" ON "staff_attendance" USING btree ("staff_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "students_admission_uq" ON "students" USING btree ("centre_id","admission_no");--> statement-breakpoint
CREATE INDEX "students_centre_idx" ON "students" USING btree ("centre_id","status");--> statement-breakpoint
CREATE INDEX "students_batch_idx" ON "students" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "students_parent_idx" ON "students" USING btree ("parent_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_uq" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_centre_idx" ON "users" USING btree ("centre_id");