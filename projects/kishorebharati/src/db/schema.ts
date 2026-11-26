/**
 * The whole data model, in one file.
 *
 * Rules that hold for every table:
 *  - Money is whole rupees in an `integer` column. Never a float.
 *  - Dates without a time are `date` columns read as 'YYYY-MM-DD' strings.
 *  - A month is the text 'YYYY-MM'.
 *  - `meta` is a jsonb escape hatch for extras that do not deserve a column.
 *
 * A client-specific module adds its tables at the marked place below, then
 * `npm run db:generate` writes the migration (see docs/CONVENTIONS.md).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const meta = () => jsonb('meta').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`);

/* ───────────────────────────── value lists ───────────────────────────── */

/**
 * admin: head teacher or secretary, everything. staff: the office (admissions,
 * fees, library, records). teacher: own sections only (register, marks, diary).
 * parent: the parents' corner, read-only, own children only.
 */
export const ROLES = ['admin', 'staff', 'teacher', 'parent'] as const;
export type Role = (typeof ROLES)[number];

export const ENQUIRY_STATUSES = ['new', 'contacted', 'closed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** A reminder waits until someone sends it on WhatsApp or sets it aside. */
export const OUTBOX_STATUSES = ['waiting', 'sent', 'dismissed'] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

/* ───────────────────────────── people ───────────────────────────── */

export const users = pgTable(
  'users',
  {
    id: id(),
    name: text('name').notNull(),
    username: text('username').notNull(), // stored lower-case
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<Role>().notNull(),
    active: boolean('active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    failedLogins: integer('failed_logins').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('users_username_uq').on(t.username)],
);

/* ───────────────────────────── enquiries ───────────────────────────── */

/** What a visitor sends from the contact form of the website. */
export const enquiries = pgTable(
  'enquiries',
  {
    id: id(),
    name: text('name').notNull(),
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    subject: text('subject').notNull().default(''),
    message: text('message').notNull(),
    source: text('source').notNull().default('website'),
    status: text('status').$type<EnquiryStatus>().notNull().default('new'),
    meta: meta(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    /** Set when moved to the Trash; such a row is left out of every list and count. */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('enquiries_status_idx').on(t.status, t.createdAt)],
);

/** Follow-up notes on an enquiry, newest first on screen. */
export const enquiryNotes = pgTable(
  'enquiry_notes',
  {
    id: id(),
    enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
    note: text('note').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdByName: text('created_by_name').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('enquiry_notes_enquiry_idx').on(t.enquiryId, t.createdAt)],
);

/* ───────────────────────────── communication ───────────────────────────── */

/** Notices and events shown on the website. */
export const announcements = pgTable(
  'announcements',
  {
    id: id(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    image: text('image').notNull().default(''),
    /** A PDF or image attached to the notice (admission list, exam routine). */
    attachment: text('attachment').notNull().default(''),
    /** 'public' = website (and parents); 'parents' = parents' corner only; 'staff' = staff room. */
    audience: text('audience').notNull().default('public'),
    pinned: boolean('pinned').notNull().default(false),
    /** For events: the day it happens. */
    eventDate: date('event_date'),
    publishOn: date('publish_on').notNull(),
    expiresOn: date('expires_on'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('announcements_publish_idx').on(t.publishOn)],
);

/**
 * WhatsApp reminders waiting to be sent: a reply to a new enquiry, a fee
 * falling due, a birthday. The daily job (and opening the Reminders screen)
 * fills it; a person sends each one from their own WhatsApp.
 *
 * `dedupeKey` names the thing and the occasion ('enquiry_reply:<id>',
 * 'birthday:<id>:2026'), so the same reminder is never queued twice however
 * often the job runs.
 */
export const messageOutbox = pgTable(
  'message_outbox',
  {
    id: id(),
    kind: text('kind').notNull(),
    dedupeKey: text('dedupe_key').notNull(),
    toName: text('to_name').notNull().default(''),
    phone: text('phone').notNull(),
    body: text('body').notNull(),
    status: text('status').$type<OutboxStatus>().notNull().default('waiting'),
    /** What the reminder is about, so it can be set aside once that is dealt with. */
    entity: text('entity').notNull().default(''),
    entityId: text('entity_id').notNull().default(''),
    /** The screen where the thing itself is seen. */
    href: text('href').notNull().default(''),
    dueOn: date('due_on').notNull(),
    doneAt: timestamp('done_at', { withTimezone: true }),
    doneBy: uuid('done_by').references(() => users.id, { onDelete: 'set null' }),
    doneByName: text('done_by_name').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('message_outbox_dedupe_uq').on(t.dedupeKey), index('message_outbox_status_idx').on(t.status, t.dueOn)],
);

/* ───────────────────────────── website content ───────────────────────────── */

/**
 * One row per editable section of the website (see src/cms). `data` is what
 * visitors see; `draft` is what the editor has saved but not published.
 */
export const siteContent = pgTable('site_content', {
  key: text('key').primaryKey(), // 'home.hero'
  data: jsonb('data').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  draft: jsonb('draft').$type<Record<string, unknown> | null>(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: updatedAt(),
});

/** Every publish keeps the previous version, so a change can be undone. */
export const contentRevisions = pgTable(
  'content_revisions',
  {
    id: id(),
    key: text('key').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    /** 'panel' or 'voice' */
    via: text('via').notNull().default('panel'),
    summary: text('summary').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdByName: text('created_by_name').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('content_revisions_key_idx').on(t.key, t.createdAt)],
);

export const media = pgTable(
  'media',
  {
    id: id(),
    url: text('url').notNull(),
    filename: text('filename').notNull().default(''),
    alt: text('alt').notNull().default(''),
    width: integer('width').notNull().default(0),
    height: integer('height').notNull().default(0),
    bytes: integer('bytes').notNull().default(0),
    folder: text('folder').notNull().default('general'),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('media_folder_idx').on(t.folder)],
);

export const galleryItems = pgTable(
  'gallery_items',
  {
    id: id(),
    url: text('url').notNull(),
    caption: text('caption').notNull().default(''),
    album: text('album').notNull().default('General'),
    width: integer('width').notNull().default(0),
    height: integer('height').notNull().default(0),
    sort: integer('sort').notNull().default(0),
    visible: boolean('visible').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index('gallery_album_idx').on(t.album)],
);

/* ───────────────────────────── system ───────────────────────────── */

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    userName: text('user_name').notNull().default(''),
    action: text('action').notNull(), // 'enquiry.status'
    entity: text('entity').notNull().default(''),
    entityId: text('entity_id').notNull().default(''),
    summary: text('summary').notNull().default(''),
    meta: meta(),
    createdAt: createdAt(),
  },
  (t) => [index('audit_log_created_idx').on(t.createdAt)],
);

/* ───────────────────────────── business modules ───────────────────────────── */

/*
 * The school: Dum Dum Kishore Bharati High School, a boys' school, Class 5 to
 * Class 12 (Madhyamik under WBBSE, Higher Secondary under WBCHSE, Science and
 * Arts in 11 and 12). A class is its number, 5 to 12; the office can add
 * lower classes from Classes and subjects if the school ever needs them.
 */

export const SHIFTS = ['morning', 'day'] as const;
export type Shift = (typeof SHIFTS)[number];

/** '' for every class up to 10; a stream only in 11 and 12. */
export const STREAMS = ['', 'science', 'arts'] as const;
export type Stream = (typeof STREAMS)[number];

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const CATEGORIES = ['GEN', 'SC', 'ST', 'OBC-A', 'OBC-B'] as const;
export type Category = (typeof CATEGORIES)[number];

export const STUDENT_STATUSES = ['active', 'left', 'passed_out'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

/** What happened to a student at the end of a year. '' while the year runs. */
export const YEAR_RESULTS = ['', 'promoted', 'detained', 'passed', 'left'] as const;
export type YearResult = (typeof YEAR_RESULTS)[number];

export const STAFF_KINDS = ['teaching', 'non_teaching'] as const;
export type StaffKind = (typeof STAFF_KINDS)[number];

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'leave'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const STAFF_ATTENDANCE_STATUSES = ['present', 'absent', 'leave', 'half_day', 'duty'] as const;
export type StaffAttendanceStatus = (typeof STAFF_ATTENDANCE_STATUSES)[number];

export const CALENDAR_KINDS = ['holiday', 'exam', 'event', 'meeting'] as const;
export type CalendarKind = (typeof CALENDAR_KINDS)[number];

/** Who a notice is for: the website, the parents' corner, or the staff room. */
export const ANNOUNCEMENT_AUDIENCES = ['public', 'parents', 'staff'] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

/** draft: being set up; open: teachers enter marks; published: parents see results. */
export const EXAM_STATUSES = ['draft', 'open', 'published'] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];

export const FEE_KINDS = ['monthly', 'annual', 'one_time'] as const;
export type FeeKind = (typeof FEE_KINDS)[number];

export const INVOICE_STATUSES = ['unpaid', 'partial', 'paid', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'upi', 'bank', 'cheque'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BOOK_STATUSES = ['available', 'issued', 'lost', 'withdrawn'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const CERTIFICATE_KINDS = ['tc', 'character', 'bonafide'] as const;
export type CertificateKind = (typeof CERTIFICATE_KINDS)[number];

/** Government schemes a student receives through the school (Sabooj Sathi, Taruner Swapna, scholarships). */
export const BENEFIT_STATUSES = ['applied', 'sanctioned', 'received', 'rejected'] as const;
export type BenefitStatus = (typeof BENEFIT_STATUSES)[number];

const deletedAt = () => timestamp('deleted_at', { withTimezone: true });

/** Running numbers (admission, bill, receipt, accession, certificate). Taken inside a transaction. */
export const counters = pgTable('counters', {
  key: text('key').primaryKey(), // 'admission:2026', 'receipt:2026-27'
  value: integer('value').notNull().default(0),
});

/** 2026, 2027 ... In West Bengal the school year runs January to December. */
export const academicYears = pgTable(
  'academic_years',
  {
    id: id(),
    name: text('name').notNull(), // '2026'
    startsOn: date('starts_on').notNull(),
    endsOn: date('ends_on').notNull(),
    isCurrent: boolean('is_current').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('academic_years_name_uq').on(t.name)],
);

/** Teachers and the office, library and support staff. */
export const staff = pgTable(
  'staff',
  {
    id: id(),
    /** Their login, when they have one (teachers do). */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    nameBn: text('name_bn').notNull().default(''),
    kind: text('kind').$type<StaffKind>().notNull().default('teaching'),
    /** Head teacher, Assistant teacher, Clerk, Librarian, Group D ... */
    designation: text('designation').notNull().default(''),
    /** What they teach, in words: 'Bengali, History'. */
    subjects: text('subjects').notNull().default(''),
    qualification: text('qualification').notNull().default(''),
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    joinedOn: date('joined_on'),
    photo: text('photo').notNull().default(''),
    /** Listed on the website's teachers page. */
    showOnWebsite: boolean('show_on_website').notNull().default(true),
    sort: integer('sort').notNull().default(0),
    active: boolean('active').notNull().default(true),
    meta: meta(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index('staff_sort_idx').on(t.sort), uniqueIndex('staff_user_uq').on(t.userId)],
);

export const subjects = pgTable(
  'subjects',
  {
    id: id(),
    name: text('name').notNull(), // 'Mathematics'
    nameBn: text('name_bn').notNull().default(''),
    code: text('code').notNull().default(''),
    /** Taught from this class to that class. */
    fromGrade: integer('from_grade').notNull().default(1),
    toGrade: integer('to_grade').notNull().default(12),
    /** '' = every stream; 'science' or 'arts' only in 11 and 12. */
    stream: text('stream').$type<Stream>().notNull().default(''),
    /** An elective a student may or may not take. */
    optional: boolean('optional').notNull().default(false),
    sort: integer('sort').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index('subjects_sort_idx').on(t.sort)],
);

/** A class in a year: Class 7, section A, day shift. */
export const sections = pgTable(
  'sections',
  {
    id: id(),
    yearId: uuid('year_id').notNull().references(() => academicYears.id, { onDelete: 'cascade' }),
    grade: integer('grade').notNull(), // 5 to 12
    name: text('name').notNull().default('A'),
    shift: text('shift').$type<Shift>().notNull().default('day'),
    stream: text('stream').$type<Stream>().notNull().default(''),
    classTeacherId: uuid('class_teacher_id').references(() => staff.id, { onDelete: 'set null' }),
    room: text('room').notNull().default(''),
    capacity: integer('capacity').notNull().default(60),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('sections_year_grade_uq').on(t.yearId, t.grade, t.shift, t.stream, t.name)],
);

/** Who teaches which subject in which section. */
export const teachingAssignments = pgTable(
  'teaching_assignments',
  {
    id: id(),
    sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('teaching_section_subject_uq').on(t.sectionId, t.subjectId), index('teaching_staff_idx').on(t.staffId)],
);

export const students = pgTable(
  'students',
  {
    id: id(),
    admissionNo: text('admission_no').notNull(),
    name: text('name').notNull(),
    nameBn: text('name_bn').notNull().default(''),
    gender: text('gender').$type<Gender>().notNull().default('male'),
    dob: date('dob'),
    photo: text('photo').notNull().default(''),
    fatherName: text('father_name').notNull().default(''),
    motherName: text('mother_name').notNull().default(''),
    guardianName: text('guardian_name').notNull().default(''),
    guardianRelation: text('guardian_relation').notNull().default(''),
    /** The number reminders and the parent login use. */
    phone: text('phone').notNull().default(''),
    altPhone: text('alt_phone').notNull().default(''),
    email: text('email').notNull().default(''),
    address: text('address').notNull().default(''),
    category: text('category').$type<Category>().notNull().default('GEN'),
    religion: text('religion').notNull().default(''),
    bloodGroup: text('blood_group').notNull().default(''),
    /** Student ID on the state's Banglar Shiksha portal. */
    portalId: text('portal_id').notNull().default(''),
    admittedOn: date('admitted_on'),
    admittedGrade: integer('admitted_grade'),
    status: text('status').$type<StudentStatus>().notNull().default('active'),
    leftOn: date('left_on'),
    leftReason: text('left_reason').notNull().default(''),
    /** The parent login that sees this student (one login can see brothers too). */
    parentUserId: uuid('parent_user_id').references(() => users.id, { onDelete: 'set null' }),
    meta: meta(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [uniqueIndex('students_admission_uq').on(t.admissionNo), index('students_status_idx').on(t.status), index('students_parent_idx').on(t.parentUserId)],
);

/** A student's place in one year: section and roll number. One row per student per year. */
export const enrolments = pgTable(
  'enrolments',
  {
    id: id(),
    yearId: uuid('year_id').notNull().references(() => academicYears.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
    rollNo: integer('roll_no').notNull(),
    result: text('result').$type<YearResult>().notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('enrolments_year_student_uq').on(t.yearId, t.studentId),
    uniqueIndex('enrolments_section_roll_uq').on(t.sectionId, t.rollNo),
  ],
);

/** Daily register, one row per student per day. */
export const attendance = pgTable(
  'attendance',
  {
    id: id(),
    day: date('day').notNull(),
    sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    status: text('status').$type<AttendanceStatus>().notNull(),
    note: text('note').notNull().default(''),
    markedBy: uuid('marked_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('attendance_student_day_uq').on(t.studentId, t.day), index('attendance_section_day_idx').on(t.sectionId, t.day)],
);

export const staffAttendance = pgTable(
  'staff_attendance',
  {
    id: id(),
    day: date('day').notNull(),
    staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
    status: text('status').$type<StaffAttendanceStatus>().notNull(),
    note: text('note').notNull().default(''),
    markedBy: uuid('marked_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('staff_attendance_staff_day_uq').on(t.staffId, t.day), index('staff_attendance_day_idx').on(t.day)],
);

/** Holidays, exam weeks, events and meetings: the school calendar, and the Events screen. */
export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: id(),
    title: text('title').notNull(),
    kind: text('kind').$type<CalendarKind>().notNull().default('event'),
    startsOn: date('starts_on').notNull(),
    endsOn: date('ends_on'),
    venue: text('venue').notNull().default(''),
    details: text('details').notNull().default(''),
    image: text('image').notNull().default(''),
    /** Gallery album that holds this event's photos. */
    galleryAlbum: text('gallery_album').notNull().default(''),
    showOnWebsite: boolean('show_on_website').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index('calendar_starts_idx').on(t.startsOn)],
);

/** One cell of the timetable: section, day (1 Monday to 6 Saturday), period. */
export const timetableSlots = pgTable(
  'timetable_slots',
  {
    id: id(),
    sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
    day: integer('day').notNull(),
    period: integer('period').notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    room: text('room').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('timetable_section_slot_uq').on(t.sectionId, t.day, t.period), index('timetable_staff_slot_idx').on(t.staffId, t.day, t.period)],
);

/** The class diary: homework and classwork a teacher posts for a section. */
export const homework = pgTable(
  'homework',
  {
    id: id(),
    sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    givenOn: date('given_on').notNull(),
    dueOn: date('due_on'),
    title: text('title').notNull(),
    details: text('details').notNull().default(''),
    attachment: text('attachment').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index('homework_section_day_idx').on(t.sectionId, t.givenOn)],
);

/** First, second and third summative, a unit test, the test exam ... */
export const exams = pgTable(
  'exams',
  {
    id: id(),
    yearId: uuid('year_id').notNull().references(() => academicYears.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    fromGrade: integer('from_grade').notNull().default(1),
    toGrade: integer('to_grade').notNull().default(12),
    startsOn: date('starts_on'),
    endsOn: date('ends_on'),
    status: text('status').$type<ExamStatus>().notNull().default('draft'),
    sort: integer('sort').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index('exams_year_idx').on(t.yearId, t.sort)],
);

/** One subject's paper in one class for an exam, with its full and pass marks. */
export const examPapers = pgTable(
  'exam_papers',
  {
    id: id(),
    examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
    grade: integer('grade').notNull(),
    subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
    fullMarks: integer('full_marks').notNull().default(100),
    passMarks: integer('pass_marks').notNull().default(25),
    examDate: date('exam_date'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('exam_papers_uq').on(t.examId, t.grade, t.subjectId)],
);

export const marks = pgTable(
  'marks',
  {
    id: id(),
    paperId: uuid('paper_id').notNull().references(() => examPapers.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    /** Whole marks; null with absent = true when the student missed the paper. */
    marks: integer('marks'),
    absent: boolean('absent').notNull().default(false),
    enteredBy: uuid('entered_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('marks_paper_student_uq').on(t.paperId, t.studentId), index('marks_student_idx').on(t.studentId)],
);

/** What the school charges, for which classes. */
export const feeHeads = pgTable('fee_heads', {
  id: id(),
  name: text('name').notNull(), // Session fee, Development fee, Computer fee
  kind: text('kind').$type<FeeKind>().notNull().default('annual'),
  fromGrade: integer('from_grade').notNull().default(0),
  toGrade: integer('to_grade').notNull().default(12),
  amount: integer('amount').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt(),
});

export const invoices = pgTable(
  'invoices',
  {
    id: id(),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    yearId: uuid('year_id').references(() => academicYears.id, { onDelete: 'set null' }),
    invoiceNo: text('invoice_no').notNull(),
    /** 'YYYY-MM' for a monthly bill, 'YYYY' for the annual bill, null for a one-off bill. */
    period: text('period'),
    title: text('title').notNull().default(''),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date').notNull(),
    subtotal: integer('subtotal').notNull().default(0),
    discount: integer('discount').notNull().default(0),
    total: integer('total').notNull().default(0),
    paid: integer('paid').notNull().default(0),
    status: text('status').$type<InvoiceStatus>().notNull().default('unpaid'),
    notes: text('notes').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('invoices_no_uq').on(t.invoiceNo),
    // One bill per student per period: makes the bill run safe to repeat.
    uniqueIndex('invoices_student_period_uq').on(t.studentId, t.period),
    index('invoices_status_idx').on(t.status),
  ],
);

export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: id(),
    invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    feeHeadId: uuid('fee_head_id').references(() => feeHeads.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    amount: integer('amount').notNull(),
  },
  (t) => [index('invoice_items_invoice_idx').on(t.invoiceId)],
);

export const payments = pgTable(
  'payments',
  {
    id: id(),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    receiptNo: text('receipt_no').notNull(),
    amount: integer('amount').notNull(),
    method: text('method').$type<PaymentMethod>().notNull().default('cash'),
    reference: text('reference').notNull().default(''),
    paidOn: date('paid_on').notNull(),
    note: text('note').notNull().default(''),
    receivedBy: uuid('received_by').references(() => users.id, { onDelete: 'set null' }),
    /** A wrong entry is voided, never deleted; voided rows are left out of every total. */
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidReason: text('void_reason').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('payments_receipt_uq').on(t.receiptNo), index('payments_paid_idx').on(t.paidOn), index('payments_invoice_idx').on(t.invoiceId)],
);

export const expenses = pgTable(
  'expenses',
  {
    id: id(),
    category: text('category').notNull(), // Electricity, Repairs, Stationery, Events ...
    description: text('description').notNull().default(''),
    amount: integer('amount').notNull(),
    spentOn: date('spent_on').notNull(),
    paidTo: text('paid_to').notNull().default(''),
    method: text('method').$type<PaymentMethod>().notNull().default('cash'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index('expenses_spent_idx').on(t.spentOn)],
);

/** One physical copy of a book, by accession number. */
export const books = pgTable(
  'books',
  {
    id: id(),
    accessionNo: text('accession_no').notNull(),
    title: text('title').notNull(),
    author: text('author').notNull().default(''),
    publisher: text('publisher').notNull().default(''),
    subject: text('subject').notNull().default(''),
    language: text('language').notNull().default('Bengali'),
    isbn: text('isbn').notNull().default(''),
    shelf: text('shelf').notNull().default(''),
    price: integer('price').notNull().default(0),
    status: text('status').$type<BookStatus>().notNull().default('available'),
    addedOn: date('added_on'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [uniqueIndex('books_accession_uq').on(t.accessionNo), index('books_title_idx').on(t.title)],
);

/** A book lent to a student or a member of staff. */
export const bookIssues = pgTable(
  'book_issues',
  {
    id: id(),
    bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }),
    issuedOn: date('issued_on').notNull(),
    dueOn: date('due_on').notNull(),
    returnedOn: date('returned_on'),
    /** Late fine in rupees, settled when the book comes back. */
    fine: integer('fine').notNull().default(0),
    finePaid: boolean('fine_paid').notNull().default(false),
    note: text('note').notNull().default(''),
    issuedBy: uuid('issued_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('book_issues_book_idx').on(t.bookId), index('book_issues_student_idx').on(t.studentId), index('book_issues_open_idx').on(t.returnedOn, t.dueOn)],
);

/** Transfer, character and bonafide certificates, with their serial numbers. Voided, never deleted. */
export const certificates = pgTable(
  'certificates',
  {
    id: id(),
    kind: text('kind').$type<CertificateKind>().notNull(),
    serialNo: text('serial_no').notNull(),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    issuedOn: date('issued_on').notNull(),
    /** What was printed (class, conduct, reason, dates), kept as issued. */
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    issuedBy: uuid('issued_by').references(() => users.id, { onDelete: 'set null' }),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidReason: text('void_reason').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('certificates_serial_uq').on(t.kind, t.serialNo), index('certificates_student_idx').on(t.studentId)],
);

/** A government scheme a student gets through the school: Sabooj Sathi bicycle, Taruner Swapna, a scholarship. */
export const studentBenefits = pgTable(
  'student_benefits',
  {
    id: id(),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    scheme: text('scheme').notNull(),
    year: text('year').notNull(),
    status: text('status').$type<BenefitStatus>().notNull().default('applied'),
    amount: integer('amount').notNull().default(0),
    receivedOn: date('received_on'),
    note: text('note').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('student_benefits_uq').on(t.studentId, t.scheme, t.year)],
);

/* ─────────── office registers (src/server/office, src/server/leave) ─────────── */

/*
 * The registers a West Bengal government school office keeps by hand: the
 * mid-day meal register, staff leave, the visitor book and gate passes,
 * students' achievement, discipline and health records, the stock register,
 * meeting minutes and who has read a staff circular.
 */

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const STUDENT_RECORD_KINDS = ['achievement', 'discipline', 'health'] as const;
export type StudentRecordKind = (typeof STUDENT_RECORD_KINDS)[number];

export const ASSET_SOURCES = ['school_fund', 'government_grant', 'donation'] as const;
export type AssetSource = (typeof ASSET_SOURCES)[number];

export const ASSET_CONDITIONS = ['good', 'needs_repair', 'unusable'] as const;
export type AssetCondition = (typeof ASSET_CONDITIONS)[number];

/** received and returned add to the stock; issued and written off take away; damaged marks some as damaged. */
export const ASSET_MOVEMENT_KINDS = ['received', 'issued', 'returned', 'damaged', 'written_off'] as const;
export type AssetMovementKind = (typeof ASSET_MOVEMENT_KINDS)[number];

/** smc: managing committee / school management committee; ptm: parent-teacher meeting. */
export const MEETING_KINDS = ['smc', 'staff', 'ptm'] as const;
export type MeetingKind = (typeof MEETING_KINDS)[number];

/** One mid-day meal register line per school day. */
export const mdmDays = pgTable(
  'mdm_days',
  {
    id: id(),
    day: date('day').notNull(),
    menu: text('menu').notNull().default(''),
    /** Cook-cum-helpers who came that day. */
    cooksPresent: integer('cooks_present').notNull().default(0),
    note: text('note').notNull().default(''),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('mdm_days_day_uq').on(t.day)],
);

/** Per class on one day: boys present and boys who ate. */
export const mdmClassCounts = pgTable(
  'mdm_class_counts',
  {
    id: id(),
    dayId: uuid('day_id').notNull().references(() => mdmDays.id, { onDelete: 'cascade' }),
    grade: integer('grade').notNull(),
    present: integer('present').notNull().default(0),
    ate: integer('ate').notNull().default(0),
  },
  (t) => [uniqueIndex('mdm_class_counts_uq').on(t.dayId, t.grade)],
);

/** Rice and other stock received and used on one day. Quantities in thousandths of the unit (1 kg = 1000), so no floats. */
export const mdmStock = pgTable(
  'mdm_stock',
  {
    id: id(),
    dayId: uuid('day_id').notNull().references(() => mdmDays.id, { onDelete: 'cascade' }),
    item: text('item').notNull(),
    received: integer('received').notNull().default(0),
    used: integer('used').notNull().default(0),
  },
  (t) => [uniqueIndex('mdm_stock_uq').on(t.dayId, t.item)],
);

/** A leave application of a member of staff. The leave types and yearly quotas live in settings ('office'). */
export const staffLeaves = pgTable(
  'staff_leaves',
  {
    id: id(),
    staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
    leaveType: text('leave_type').notNull(),
    fromDate: date('from_date').notNull(),
    toDate: date('to_date').notNull(),
    /** Days counted against the quota: Sundays and calendar holidays inside the range are left out. */
    days: integer('days').notNull(),
    reason: text('reason').notNull().default(''),
    status: text('status').$type<LeaveStatus>().notNull().default('pending'),
    appliedBy: uuid('applied_by').references(() => users.id, { onDelete: 'set null' }),
    appliedByName: text('applied_by_name').notNull().default(''),
    decidedBy: uuid('decided_by').references(() => users.id, { onDelete: 'set null' }),
    decidedByName: text('decided_by_name').notNull().default(''),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decisionNote: text('decision_note').notNull().default(''),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('staff_leaves_staff_idx').on(t.staffId, t.fromDate), index('staff_leaves_status_idx').on(t.status)],
);

/** The visitor book at the gate. Times are 'HH:MM' India time on `day`. */
export const visitors = pgTable(
  'visitors',
  {
    id: id(),
    day: date('day').notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull().default(''),
    whomToMeet: text('whom_to_meet').notNull().default(''),
    purpose: text('purpose').notNull().default(''),
    inTime: text('in_time').notNull(),
    outTime: text('out_time').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('visitors_day_idx').on(t.day)],
);

/** A boy let out before the bell, with who took him and who allowed it. Printed as a slip. */
export const gatePasses = pgTable(
  'gate_passes',
  {
    id: id(),
    serialNo: text('serial_no').notNull(),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    time: text('time').notNull(),
    guardianName: text('guardian_name').notNull(),
    guardianRelation: text('guardian_relation').notNull().default(''),
    guardianPhone: text('guardian_phone').notNull().default(''),
    reason: text('reason').notNull().default(''),
    approvedBy: text('approved_by').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('gate_passes_serial_uq').on(t.serialNo), index('gate_passes_day_idx').on(t.day), index('gate_passes_student_idx').on(t.studentId)],
);

/**
 * A student's achievement, discipline note or health check-up. `data` holds
 * the fields of the kind (see src/server/office/records.ts).
 */
export const studentRecords = pgTable(
  'student_records',
  {
    id: id(),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<StudentRecordKind>().notNull(),
    day: date('day').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdByName: text('created_by_name').notNull().default(''),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('student_records_student_idx').on(t.studentId, t.day), index('student_records_kind_idx').on(t.kind, t.day)],
);

/** One line of the stock register: furniture, lab equipment, computers, sports goods, books outside the library. */
export const assets = pgTable(
  'assets',
  {
    id: id(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    /** On the books now; kept in step with the movements. */
    quantity: integer('quantity').notNull().default(0),
    /** Of that quantity, how many are damaged. */
    damaged: integer('damaged').notNull().default(0),
    unit: text('unit').notNull().default('pcs'),
    location: text('location').notNull().default(''),
    condition: text('condition').$type<AssetCondition>().notNull().default('good'),
    purchasedOn: date('purchased_on'),
    source: text('source').$type<AssetSource>().notNull().default('school_fund'),
    /** Whole rupees, for the whole line. */
    value: integer('value').notNull().default(0),
    note: text('note').notNull().default(''),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('assets_category_idx').on(t.category, t.name)],
);

export const assetMovements = pgTable(
  'asset_movements',
  {
    id: id(),
    assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    kind: text('kind').$type<AssetMovementKind>().notNull(),
    quantity: integer('quantity').notNull(),
    /** Received from / issued to. */
    party: text('party').notNull().default(''),
    note: text('note').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdByName: text('created_by_name').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('asset_movements_asset_idx').on(t.assetId, t.day)],
);

/** Managing committee, staff and parent-teacher meetings with their minutes. */
export const meetings = pgTable(
  'meetings',
  {
    id: id(),
    kind: text('kind').$type<MeetingKind>().notNull(),
    day: date('day').notNull(),
    time: text('time').notNull().default(''),
    title: text('title').notNull().default(''),
    /** A parent-teacher meeting may be for one class only. */
    grade: integer('grade'),
    venue: text('venue').notNull().default(''),
    attendees: text('attendees').notNull().default(''),
    agenda: text('agenda').notNull().default(''),
    minutes: text('minutes').notNull().default(''),
    attachment: text('attachment').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('meetings_day_idx').on(t.day)],
);

/** Who has read a staff circular (an announcement with audience 'staff'). */
export const circularReads = pgTable(
  'circular_reads',
  {
    id: id(),
    announcementId: uuid('announcement_id').notNull().references(() => announcements.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('circular_reads_uq').on(t.announcementId, t.userId)],
);

/* ───────────────────────────── row types ───────────────────────────── */

export type User = typeof users.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type EnquiryNote = typeof enquiryNotes.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type MediaItem = typeof media.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
export type OutboxMessage = typeof messageOutbox.$inferSelect;
export type AcademicYear = typeof academicYears.$inferSelect;
export type StaffMember = typeof staff.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type TeachingAssignment = typeof teachingAssignments.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Enrolment = typeof enrolments.$inferSelect;
export type AttendanceRow = typeof attendance.$inferSelect;
export type StaffAttendanceRow = typeof staffAttendance.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type TimetableSlot = typeof timetableSlots.$inferSelect;
export type Homework = typeof homework.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type ExamPaper = typeof examPapers.$inferSelect;
export type Mark = typeof marks.$inferSelect;
export type FeeHead = typeof feeHeads.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Book = typeof books.$inferSelect;
export type BookIssue = typeof bookIssues.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type StudentBenefit = typeof studentBenefits.$inferSelect;
export type MdmDay = typeof mdmDays.$inferSelect;
export type MdmClassCount = typeof mdmClassCounts.$inferSelect;
export type MdmStockRow = typeof mdmStock.$inferSelect;
export type StaffLeave = typeof staffLeaves.$inferSelect;
export type Visitor = typeof visitors.$inferSelect;
export type GatePass = typeof gatePasses.$inferSelect;
export type StudentRecord = typeof studentRecords.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type AssetMovement = typeof assetMovements.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type CircularRead = typeof circularReads.$inferSelect;
