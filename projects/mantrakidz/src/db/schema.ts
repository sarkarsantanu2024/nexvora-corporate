/**
 * The whole data model, in one file.
 *
 * Rules that hold for every table:
 *  - Money is whole rupees in an `integer` column. Never a float.
 *  - Dates without a time are `date` columns read as 'YYYY-MM-DD' strings.
 *  - A month is the text 'YYYY-MM' (the `period` columns).
 *  - Everything a centre owns carries `centreId`, and deleting a centre
 *    cascades, so sample centres can be removed in one statement.
 *  - `meta` is a jsonb escape hatch for extras that do not deserve a column.
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
const deletedAt = () => timestamp('deleted_at', { withTimezone: true });
const meta = () => jsonb('meta').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`);

/* ───────────────────────────── value lists ───────────────────────────── */

export const ROLES = ['hq_admin', 'hq_staff', 'centre_admin', 'centre_staff', 'parent'] as const;
export type Role = (typeof ROLES)[number];

export const CENTRE_STATUSES = ['onboarding', 'active', 'suspended', 'closed'] as const;
export type CentreStatus = (typeof CENTRE_STATUSES)[number];

export const ROYALTY_TYPES = ['percent', 'fixed'] as const;
export type RoyaltyType = (typeof ROYALTY_TYPES)[number];

export const FRANCHISE_STAGES = ['new', 'contacted', 'meeting', 'site_visit', 'agreement', 'onboarded', 'lost'] as const;
export type FranchiseStage = (typeof FRANCHISE_STAGES)[number];

export const ENQUIRY_STAGES = ['new', 'contacted', 'visit_scheduled', 'visited', 'admitted', 'lost'] as const;
export type EnquiryStage = (typeof ENQUIRY_STAGES)[number];

export const STUDENT_STATUSES = ['active', 'left', 'passed_out'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const ATTENDANCE_STATUSES = ['present', 'absent', 'leave', 'holiday'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const FEE_KINDS = ['monthly', 'one_time', 'annual'] as const;
export type FeeKind = (typeof FEE_KINDS)[number];

export const INVOICE_STATUSES = ['unpaid', 'partial', 'paid', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'upi', 'bank', 'cheque', 'card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ANNOUNCEMENT_AUDIENCES = ['public', 'centres', 'parents'] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

/** A reminder waits until someone sends it on WhatsApp or sets it aside. */
export const OUTBOX_STATUSES = ['waiting', 'sent', 'dismissed'] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

/* ───────────────────────────── people & centres ───────────────────────────── */

export const centres = pgTable(
  'centres',
  {
    id: id(),
    code: text('code').notNull(), // MK-001
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    status: text('status').$type<CentreStatus>().notNull().default('onboarding'),
    isCompanyOwned: boolean('is_company_owned').notNull().default(false),
    /** Sample centre loaded by the seed; removable in one go from HQ settings. */
    isDemo: boolean('is_demo').notNull().default(false),
    showOnWebsite: boolean('show_on_website').notNull().default(true),
    address: text('address').notNull().default(''),
    area: text('area').notNull().default(''),
    city: text('city').notNull().default(''),
    state: text('state').notNull().default(''),
    pincode: text('pincode').notNull().default(''),
    phone: text('phone').notNull().default(''),
    whatsapp: text('whatsapp').notNull().default(''),
    email: text('email').notNull().default(''),
    mapUrl: text('map_url').notNull().default(''),
    photo: text('photo').notNull().default(''),
    ownerName: text('owner_name').notNull().default(''),
    ownerPhone: text('owner_phone').notNull().default(''),
    ownerEmail: text('owner_email').notNull().default(''),
    openedOn: date('opened_on'),
    agreementStart: date('agreement_start'),
    agreementEnd: date('agreement_end'),
    franchiseFee: integer('franchise_fee').notNull().default(0),
    franchiseFeePaid: integer('franchise_fee_paid').notNull().default(0),
    royaltyType: text('royalty_type').$type<RoyaltyType>().notNull().default('percent'),
    /** Percent of the month's fee collection, or a fixed rupee amount. */
    royaltyValue: integer('royalty_value').notNull().default(0),
    notes: text('notes').notNull().default(''),
    meta: meta(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => [uniqueIndex('centres_code_uq').on(t.code), uniqueIndex('centres_slug_uq').on(t.slug)],
);

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
    /** Null for HQ roles. */
    centreId: uuid('centre_id').references(() => centres.id, { onDelete: 'cascade' }),
    active: boolean('active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    failedLogins: integer('failed_logins').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('users_username_uq').on(t.username), index('users_centre_idx').on(t.centreId)],
);

export const staff = pgTable(
  'staff',
  {
    id: id(),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    roleTitle: text('role_title').notNull().default('Teacher'),
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    qualification: text('qualification').notNull().default(''),
    joinedOn: date('joined_on'),
    leftOn: date('left_on'),
    monthlySalary: integer('monthly_salary').notNull().default(0),
    active: boolean('active').notNull().default(true),
    /** Set when this staff member also has a login. */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    meta: meta(),
    createdAt: createdAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index('staff_centre_idx').on(t.centreId)],
);

/* ───────────────────────────── academics ───────────────────────────── */

/** The translatable words of a programme, per extra language. */
export type ProgrammeWords = {
  name?: string;
  ageLabel?: string;
  tagline?: string;
  description?: string;
  highlights?: string[];
  timing?: string;
};
export type ProgrammeI18n = { bn?: ProgrammeWords; hi?: ProgrammeWords };

/** HQ master list. Also drives the Programmes pages of the website. */
export const programmes = pgTable(
  'programmes',
  {
    id: id(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    ageLabel: text('age_label').notNull().default(''), // "1.5 to 2.5 years"
    ageFromMonths: integer('age_from_months').notNull().default(0),
    ageToMonths: integer('age_to_months').notNull().default(0),
    tagline: text('tagline').notNull().default(''),
    description: text('description').notNull().default(''),
    highlights: jsonb('highlights').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    image: text('image').notNull().default(''),
    color: text('color').notNull().default('indigo'),
    seatsPerClass: integer('seats_per_class').notNull().default(12),
    timing: text('timing').notNull().default(''),
    /** Fee HQ suggests; a centre sets its own in fee_heads. */
    suggestedMonthlyFee: integer('suggested_monthly_fee').notNull().default(0),
    /** Bengali and Hindi wording for the website; English lives in the columns above. */
    i18n: jsonb('i18n').$type<ProgrammeI18n>().notNull().default(sql`'{}'::jsonb`),
    sort: integer('sort').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('programmes_slug_uq').on(t.slug)],
);

export const academicYears = pgTable(
  'academic_years',
  {
    id: id(),
    name: text('name').notNull(), // 2026-27
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    isCurrent: boolean('is_current').notNull().default(false),
  },
  (t) => [uniqueIndex('academic_years_name_uq').on(t.name)],
);

/** A class section at one centre: "Nursery A, morning". */
export const batches = pgTable(
  'batches',
  {
    id: id(),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    programmeId: uuid('programme_id').notNull().references(() => programmes.id),
    academicYearId: uuid('academic_year_id').notNull().references(() => academicYears.id),
    name: text('name').notNull(),
    capacity: integer('capacity').notNull().default(12),
    timing: text('timing').notNull().default(''),
    teacherId: uuid('teacher_id').references(() => staff.id, { onDelete: 'set null' }),
    active: boolean('active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index('batches_centre_idx').on(t.centreId)],
);

export const students = pgTable(
  'students',
  {
    id: id(),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    admissionNo: text('admission_no').notNull(),
    name: text('name').notNull(),
    dob: date('dob'),
    gender: text('gender').notNull().default(''),
    photo: text('photo').notNull().default(''),
    programmeId: uuid('programme_id').references(() => programmes.id),
    batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'set null' }),
    academicYearId: uuid('academic_year_id').references(() => academicYears.id),
    admissionDate: date('admission_date').notNull(),
    status: text('status').$type<StudentStatus>().notNull().default('active'),
    leftOn: date('left_on'),
    leftReason: text('left_reason').notNull().default(''),
    fatherName: text('father_name').notNull().default(''),
    motherName: text('mother_name').notNull().default(''),
    guardianPhone: text('guardian_phone').notNull().default(''),
    altPhone: text('alt_phone').notNull().default(''),
    email: text('email').notNull().default(''),
    address: text('address').notNull().default(''),
    bloodGroup: text('blood_group').notNull().default(''),
    medicalNotes: text('medical_notes').notNull().default(''),
    pickupPerson: text('pickup_person').notNull().default(''),
    tshirtSize: text('tshirt_size').notNull().default(''),
    /** Monthly fee agreed for this child; null means "use the fee head". */
    monthlyFee: integer('monthly_fee'),
    /** The parent's login, shared by siblings. */
    parentUserId: uuid('parent_user_id').references(() => users.id, { onDelete: 'set null' }),
    meta: meta(),
    createdAt: createdAt(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex('students_admission_uq').on(t.centreId, t.admissionNo),
    index('students_centre_idx').on(t.centreId, t.status),
    index('students_batch_idx').on(t.batchId),
    index('students_parent_idx').on(t.parentUserId),
  ],
);

export const attendance = pgTable(
  'attendance',
  {
    id: id(),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id').references(() => batches.id, { onDelete: 'set null' }),
    day: date('day').notNull(),
    status: text('status').$type<AttendanceStatus>().notNull(),
    note: text('note').notNull().default(''),
    markedBy: uuid('marked_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('attendance_student_day_uq').on(t.studentId, t.day), index('attendance_centre_day_idx').on(t.centreId, t.day)],
);

export const staffAttendance = pgTable(
  'staff_attendance',
  {
    id: id(),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    status: text('status').$type<AttendanceStatus>().notNull(),
    markedBy: uuid('marked_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('staff_attendance_day_uq').on(t.staffId, t.day)],
);

/* ───────────────────────────── leads ───────────────────────────── */

export const franchiseLeads = pgTable(
  'franchise_leads',
  {
    id: id(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull().default(''),
    city: text('city').notNull().default(''),
    state: text('state').notNull().default(''),
    occupation: text('occupation').notNull().default(''),
    investmentRange: text('investment_range').notNull().default(''),
    hasSpace: boolean('has_space'),
    spaceSqft: integer('space_sqft'),
    message: text('message').notNull().default(''),
    source: text('source').notNull().default('website'),
    stage: text('stage').$type<FranchiseStage>().notNull().default('new'),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    nextFollowUp: date('next_follow_up'),
    lostReason: text('lost_reason').notNull().default(''),
    convertedCentreId: uuid('converted_centre_id').references(() => centres.id, { onDelete: 'set null' }),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('franchise_leads_stage_idx').on(t.stage)],
);

export const admissionEnquiries = pgTable(
  'admission_enquiries',
  {
    id: id(),
    /** Null when the parent picked no centre on the website; HQ assigns it. */
    centreId: uuid('centre_id').references(() => centres.id, { onDelete: 'cascade' }),
    childName: text('child_name').notNull(),
    dob: date('dob'),
    programmeId: uuid('programme_id').references(() => programmes.id),
    parentName: text('parent_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull().default(''),
    area: text('area').notNull().default(''),
    message: text('message').notNull().default(''),
    source: text('source').notNull().default('website'),
    stage: text('stage').$type<EnquiryStage>().notNull().default('new'),
    nextFollowUp: date('next_follow_up'),
    visitOn: date('visit_on'),
    lostReason: text('lost_reason').notNull().default(''),
    convertedStudentId: uuid('converted_student_id').references(() => students.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('admission_enquiries_centre_idx').on(t.centreId, t.stage)],
);

/** Follow-up notes on a franchise lead or an admission enquiry. */
export const activityNotes = pgTable(
  'activity_notes',
  {
    id: id(),
    entityType: text('entity_type').$type<'franchise_lead' | 'admission_enquiry' | 'student' | 'centre'>().notNull(),
    entityId: uuid('entity_id').notNull(),
    note: text('note').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdByName: text('created_by_name').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('activity_notes_entity_idx').on(t.entityType, t.entityId)],
);

export const contactMessages = pgTable('contact_messages', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  subject: text('subject').notNull().default(''),
  message: text('message').notNull(),
  centreId: uuid('centre_id').references(() => centres.id, { onDelete: 'set null' }),
  handled: boolean('handled').notNull().default(false),
  createdAt: createdAt(),
});

/* ───────────────────────────── money ───────────────────────────── */

/** What a centre charges. `centreId` null = an HQ template copied to new centres. */
export const feeHeads = pgTable(
  'fee_heads',
  {
    id: id(),
    centreId: uuid('centre_id').references(() => centres.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // Tuition fee, Admission fee, Annual kit
    kind: text('kind').$type<FeeKind>().notNull().default('monthly'),
    programmeId: uuid('programme_id').references(() => programmes.id),
    amount: integer('amount').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index('fee_heads_centre_idx').on(t.centreId)],
);

export const invoices = pgTable(
  'invoices',
  {
    id: id(),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    invoiceNo: text('invoice_no').notNull(),
    /** 'YYYY-MM' for the monthly run; null for a one-off bill. */
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
    uniqueIndex('invoices_no_uq').on(t.centreId, t.invoiceNo),
    // One monthly bill per child per month: makes the monthly run safe to repeat.
    uniqueIndex('invoices_student_period_uq').on(t.studentId, t.period),
    index('invoices_centre_status_idx').on(t.centreId, t.status),
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
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    receiptNo: text('receipt_no').notNull(),
    amount: integer('amount').notNull(),
    method: text('method').$type<PaymentMethod>().notNull().default('cash'),
    reference: text('reference').notNull().default(''),
    paidOn: date('paid_on').notNull(),
    note: text('note').notNull().default(''),
    receivedBy: uuid('received_by').references(() => users.id, { onDelete: 'set null' }),
    /** A wrong entry is voided, never deleted; voided rows are ignored in every total. */
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidReason: text('void_reason').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('payments_receipt_uq').on(t.centreId, t.receiptNo),
    index('payments_centre_paid_idx').on(t.centreId, t.paidOn),
    index('payments_invoice_idx').on(t.invoiceId),
  ],
);

export const expenses = pgTable(
  'expenses',
  {
    id: id(),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    category: text('category').notNull(), // Rent, Salary, Electricity, Supplies ...
    description: text('description').notNull().default(''),
    amount: integer('amount').notNull(),
    spentOn: date('spent_on').notNull(),
    paidTo: text('paid_to').notNull().default(''),
    method: text('method').$type<PaymentMethod>().notNull().default('cash'),
    /** Set when this expense is a salary payment. */
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    /** 'YYYY-MM' the salary is for. */
    salaryPeriod: text('salary_period'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    deletedAt: deletedAt(),
  },
  (t) => [index('expenses_centre_spent_idx').on(t.centreId, t.spentOn)],
);

/** What a franchise centre owes HQ for one month. */
export const royaltyInvoices = pgTable(
  'royalty_invoices',
  {
    id: id(),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    period: text('period').notNull(), // YYYY-MM
    /** Fee collection of that month the royalty was worked out on. */
    basisAmount: integer('basis_amount').notNull().default(0),
    royaltyType: text('royalty_type').$type<RoyaltyType>().notNull(),
    royaltyValue: integer('royalty_value').notNull(),
    amount: integer('amount').notNull(),
    paid: integer('paid').notNull().default(0),
    status: text('status').$type<InvoiceStatus>().notNull().default('unpaid'),
    dueDate: date('due_date').notNull(),
    notes: text('notes').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('royalty_invoices_centre_period_uq').on(t.centreId, t.period)],
);

export const royaltyPayments = pgTable(
  'royalty_payments',
  {
    id: id(),
    royaltyInvoiceId: uuid('royalty_invoice_id').notNull().references(() => royaltyInvoices.id, { onDelete: 'cascade' }),
    centreId: uuid('centre_id').notNull().references(() => centres.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    method: text('method').$type<PaymentMethod>().notNull().default('bank'),
    reference: text('reference').notNull().default(''),
    paidOn: date('paid_on').notNull(),
    recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('royalty_payments_invoice_idx').on(t.royaltyInvoiceId)],
);

/* ───────────────────────────── communication ───────────────────────────── */

/**
 * One table for three kinds of notice:
 *  - audience 'public'  : shown on the website (centreId null = every centre)
 *  - audience 'centres' : HQ circular to franchise owners (centreId null = all)
 *  - audience 'parents' : a centre's notice to its parents (centreId set), or
 *                         an HQ notice to all parents (centreId null)
 */
export const announcements = pgTable(
  'announcements',
  {
    id: id(),
    audience: text('audience').$type<AnnouncementAudience>().notNull(),
    centreId: uuid('centre_id').references(() => centres.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    image: text('image').notNull().default(''),
    pinned: boolean('pinned').notNull().default(false),
    /** For events: the day it happens. */
    eventDate: date('event_date'),
    publishOn: date('publish_on').notNull(),
    expiresOn: date('expires_on'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('announcements_audience_idx').on(t.audience, t.centreId)],
);

/**
 * WhatsApp reminders waiting to be sent: a fee falling due, a fee overdue, a
 * child absent today, a birthday. The daily job (and opening the Reminders
 * screen) fills it; someone at the school sends each from their own WhatsApp.
 *
 * `dedupeKey` names the thing and the occasion ('fee_due:<billId>',
 * 'birthday:<childId>:2026'), so the same reminder is never queued twice
 * however often the job runs.
 */
export const messageOutbox = pgTable(
  'message_outbox',
  {
    id: id(),
    centreId: uuid('centre_id').references(() => centres.id, { onDelete: 'cascade' }),
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
  (t) => [uniqueIndex('message_outbox_dedupe_uq').on(t.dedupeKey), index('message_outbox_centre_status_idx').on(t.centreId, t.status, t.dueOn)],
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
    centreId: uuid('centre_id').references(() => centres.id, { onDelete: 'cascade' }),
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

/** Running numbers: receipt, invoice and admission numbers per centre. */
export const counters = pgTable('counters', {
  key: text('key').primaryKey(), // `${centreId}:receipt:2026`
  value: integer('value').notNull().default(0),
});

export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    userName: text('user_name').notNull().default(''),
    centreId: uuid('centre_id').references(() => centres.id, { onDelete: 'cascade' }),
    action: text('action').notNull(), // 'payment.create'
    entity: text('entity').notNull().default(''),
    entityId: text('entity_id').notNull().default(''),
    summary: text('summary').notNull().default(''),
    meta: meta(),
    createdAt: createdAt(),
  },
  (t) => [index('audit_log_created_idx').on(t.createdAt), index('audit_log_centre_idx').on(t.centreId)],
);

/* ───────────────────────────── row types ───────────────────────────── */

export type Centre = typeof centres.$inferSelect;
export type User = typeof users.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type Programme = typeof programmes.$inferSelect;
export type AcademicYear = typeof academicYears.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type FranchiseLead = typeof franchiseLeads.$inferSelect;
export type AdmissionEnquiry = typeof admissionEnquiries.$inferSelect;
export type ActivityNote = typeof activityNotes.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type FeeHead = typeof feeHeads.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type OutboxMessage = typeof messageOutbox.$inferSelect;
export type RoyaltyInvoice = typeof royaltyInvoices.$inferSelect;
export type RoyaltyPayment = typeof royaltyPayments.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type MediaItem = typeof media.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
