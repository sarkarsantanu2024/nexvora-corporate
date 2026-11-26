CREATE TABLE "academic_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"section_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"marked_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"student_id" uuid,
	"staff_id" uuid,
	"issued_on" date NOT NULL,
	"due_on" date NOT NULL,
	"returned_on" date,
	"fine" integer DEFAULT 0 NOT NULL,
	"fine_paid" boolean DEFAULT false NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"issued_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accession_no" text NOT NULL,
	"title" text NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"publisher" text DEFAULT '' NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'Bengali' NOT NULL,
	"isbn" text DEFAULT '' NOT NULL,
	"shelf" text DEFAULT '' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"added_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'event' NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"venue" text DEFAULT '' NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"gallery_album" text DEFAULT '' NOT NULL,
	"show_on_website" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"serial_no" text NOT NULL,
	"student_id" uuid NOT NULL,
	"issued_on" date NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"issued_by" uuid,
	"voided_at" timestamp with time zone,
	"void_reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrolments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"roll_no" integer NOT NULL,
	"result" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"grade" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"full_marks" integer DEFAULT 100 NOT NULL,
	"pass_marks" integer DEFAULT 25 NOT NULL,
	"exam_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year_id" uuid NOT NULL,
	"name" text NOT NULL,
	"from_grade" integer DEFAULT 1 NOT NULL,
	"to_grade" integer DEFAULT 12 NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"amount" integer NOT NULL,
	"spent_on" date NOT NULL,
	"paid_to" text DEFAULT '' NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fee_heads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'annual' NOT NULL,
	"from_grade" integer DEFAULT 0 NOT NULL,
	"to_grade" integer DEFAULT 12 NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homework" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"subject_id" uuid,
	"staff_id" uuid,
	"given_on" date NOT NULL,
	"due_on" date,
	"title" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"attachment" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
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
	"student_id" uuid NOT NULL,
	"year_id" uuid,
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
CREATE TABLE "marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"marks" integer,
	"absent" boolean DEFAULT false NOT NULL,
	"entered_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year_id" uuid NOT NULL,
	"grade" integer NOT NULL,
	"name" text DEFAULT 'A' NOT NULL,
	"shift" text DEFAULT 'day' NOT NULL,
	"stream" text DEFAULT '' NOT NULL,
	"class_teacher_id" uuid,
	"room" text DEFAULT '' NOT NULL,
	"capacity" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"name_bn" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'teaching' NOT NULL,
	"designation" text DEFAULT '' NOT NULL,
	"subjects" text DEFAULT '' NOT NULL,
	"qualification" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"joined_on" date,
	"photo" text DEFAULT '' NOT NULL,
	"show_on_website" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "staff_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"staff_id" uuid NOT NULL,
	"status" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"marked_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"scheme" text NOT NULL,
	"year" text NOT NULL,
	"status" text DEFAULT 'applied' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"received_on" date,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admission_no" text NOT NULL,
	"name" text NOT NULL,
	"name_bn" text DEFAULT '' NOT NULL,
	"gender" text DEFAULT 'male' NOT NULL,
	"dob" date,
	"photo" text DEFAULT '' NOT NULL,
	"father_name" text DEFAULT '' NOT NULL,
	"mother_name" text DEFAULT '' NOT NULL,
	"guardian_name" text DEFAULT '' NOT NULL,
	"guardian_relation" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"alt_phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'GEN' NOT NULL,
	"religion" text DEFAULT '' NOT NULL,
	"blood_group" text DEFAULT '' NOT NULL,
	"portal_id" text DEFAULT '' NOT NULL,
	"admitted_on" date,
	"admitted_grade" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"left_on" date,
	"left_reason" text DEFAULT '' NOT NULL,
	"parent_user_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_bn" text DEFAULT '' NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"from_grade" integer DEFAULT 1 NOT NULL,
	"to_grade" integer DEFAULT 12 NOT NULL,
	"stream" text DEFAULT '' NOT NULL,
	"optional" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teaching_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"day" integer NOT NULL,
	"period" integer NOT NULL,
	"subject_id" uuid,
	"staff_id" uuid,
	"room" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "attachment" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "audience" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_year_id_academic_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_year_id_academic_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_fee_head_id_fee_heads_id_fk" FOREIGN KEY ("fee_head_id") REFERENCES "public"."fee_heads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_year_id_academic_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marks" ADD CONSTRAINT "marks_paper_id_exam_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marks" ADD CONSTRAINT "marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marks" ADD CONSTRAINT "marks_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_year_id_academic_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_class_teacher_id_staff_id_fk" FOREIGN KEY ("class_teacher_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_benefits" ADD CONSTRAINT "student_benefits_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_name_uq" ON "academic_years" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_student_day_uq" ON "attendance" USING btree ("student_id","day");--> statement-breakpoint
CREATE INDEX "attendance_section_day_idx" ON "attendance" USING btree ("section_id","day");--> statement-breakpoint
CREATE INDEX "book_issues_book_idx" ON "book_issues" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_issues_student_idx" ON "book_issues" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "book_issues_open_idx" ON "book_issues" USING btree ("returned_on","due_on");--> statement-breakpoint
CREATE UNIQUE INDEX "books_accession_uq" ON "books" USING btree ("accession_no");--> statement-breakpoint
CREATE INDEX "books_title_idx" ON "books" USING btree ("title");--> statement-breakpoint
CREATE INDEX "calendar_starts_idx" ON "calendar_events" USING btree ("starts_on");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_serial_uq" ON "certificates" USING btree ("kind","serial_no");--> statement-breakpoint
CREATE INDEX "certificates_student_idx" ON "certificates" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrolments_year_student_uq" ON "enrolments" USING btree ("year_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrolments_section_roll_uq" ON "enrolments" USING btree ("section_id","roll_no");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_papers_uq" ON "exam_papers" USING btree ("exam_id","grade","subject_id");--> statement-breakpoint
CREATE INDEX "exams_year_idx" ON "exams" USING btree ("year_id","sort");--> statement-breakpoint
CREATE INDEX "expenses_spent_idx" ON "expenses" USING btree ("spent_on");--> statement-breakpoint
CREATE INDEX "homework_section_day_idx" ON "homework" USING btree ("section_id","given_on");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_no_uq" ON "invoices" USING btree ("invoice_no");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_student_period_uq" ON "invoices" USING btree ("student_id","period");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "marks_paper_student_uq" ON "marks" USING btree ("paper_id","student_id");--> statement-breakpoint
CREATE INDEX "marks_student_idx" ON "marks" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_receipt_uq" ON "payments" USING btree ("receipt_no");--> statement-breakpoint
CREATE INDEX "payments_paid_idx" ON "payments" USING btree ("paid_on");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sections_year_grade_uq" ON "sections" USING btree ("year_id","grade","shift","stream","name");--> statement-breakpoint
CREATE INDEX "staff_sort_idx" ON "staff" USING btree ("sort");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_user_uq" ON "staff" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_attendance_staff_day_uq" ON "staff_attendance" USING btree ("staff_id","day");--> statement-breakpoint
CREATE INDEX "staff_attendance_day_idx" ON "staff_attendance" USING btree ("day");--> statement-breakpoint
CREATE UNIQUE INDEX "student_benefits_uq" ON "student_benefits" USING btree ("student_id","scheme","year");--> statement-breakpoint
CREATE UNIQUE INDEX "students_admission_uq" ON "students" USING btree ("admission_no");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");--> statement-breakpoint
CREATE INDEX "students_parent_idx" ON "students" USING btree ("parent_user_id");--> statement-breakpoint
CREATE INDEX "subjects_sort_idx" ON "subjects" USING btree ("sort");--> statement-breakpoint
CREATE UNIQUE INDEX "teaching_section_subject_uq" ON "teaching_assignments" USING btree ("section_id","subject_id");--> statement-breakpoint
CREATE INDEX "teaching_staff_idx" ON "teaching_assignments" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "timetable_section_slot_uq" ON "timetable_slots" USING btree ("section_id","day","period");--> statement-breakpoint
CREATE INDEX "timetable_staff_slot_idx" ON "timetable_slots" USING btree ("staff_id","day","period");