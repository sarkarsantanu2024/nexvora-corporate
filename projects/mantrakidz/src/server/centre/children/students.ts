/** Children of one centre: the list, admission, changes, leaving, promotion and the parent login. */
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import {
  academicYears,
  admissionEnquiries,
  attendance,
  batches,
  invoices,
  payments,
  programmes,
  STUDENT_STATUSES,
  students,
  users,
} from '@/db/schema';
import { ApiError, fail } from '@/lib/api';
import { audit } from '@/lib/audit';
import { hashPassword } from '@/lib/auth';
import { addMonths, currentPeriod, formatDate, periodRange, todayIST } from '@/lib/date';
import { percent } from '@/lib/money';
import { nextAdmissionNo } from '@/lib/numbering';
import { sheetDate } from '@/lib/csv';
import { day, optionalDay, optionalEmail, optionalPhone, optionalUuid, phone, requiredText, rupees, text, uuid } from '@/lib/validators';
import { runImport, type ImportResult } from '../../import';
import { currentYear } from './batches';
import { loadEnquiry } from './enquiries';
import { insertNote, isUuid, likeTerm, loadBatch, loadStudent, requireManager, startingPassword, type Ctx } from './shared';

export const PAGE_SIZE = 25;

export const studentInput = z.object({
  name: requiredText("Child's name", 80),
  dob: optionalDay.refine((v) => !v || v <= todayIST(), 'Date of birth cannot be in the future'),
  gender: z.enum(['', 'Girl', 'Boy']).default(''),
  photo: text(500),
  programmeId: z.string().uuid('Choose a programme'),
  batchId: optionalUuid,
  admissionDate: day,
  /** Blank means the class fee applies. */
  monthlyFee: z.union([z.literal(''), z.null(), z.undefined(), rupees]).transform((v) => (v === '' || v == null ? null : v)),
  fatherName: text(80),
  motherName: text(80),
  guardianPhone: phone,
  altPhone: optionalPhone,
  email: optionalEmail,
  address: text(300),
  bloodGroup: text(5),
  medicalNotes: text(500),
  pickupPerson: text(80),
  tshirtSize: text(10),
});
export type StudentInput = z.input<typeof studentInput>;

export type StudentFilters = { q?: string; batch?: string; programme?: string; status?: string; page?: number };

function studentWhere(centreId: string, filters: StudentFilters) {
  const q = filters.q?.trim();
  // Active children by default; 'all' lifts the filter.
  const status = filters.status === 'all' ? null : (STUDENT_STATUSES.find((s) => s === filters.status) ?? 'active');
  return and(
    eq(students.centreId, centreId),
    isNull(students.deletedAt),
    status ? eq(students.status, status) : undefined,
    isUuid(filters.batch) ? eq(students.batchId, filters.batch) : undefined,
    isUuid(filters.programme) ? eq(students.programmeId, filters.programme) : undefined,
    q
      ? or(
          ilike(students.name, likeTerm(q)),
          ilike(students.admissionNo, likeTerm(q)),
          ilike(students.guardianPhone, likeTerm(q)),
          ilike(students.altPhone, likeTerm(q)),
        )
      : undefined,
  );
}

const listColumns = {
  id: students.id,
  name: students.name,
  photo: students.photo,
  admissionNo: students.admissionNo,
  admissionDate: students.admissionDate,
  dob: students.dob,
  gender: students.gender,
  status: students.status,
  fatherName: students.fatherName,
  motherName: students.motherName,
  guardianPhone: students.guardianPhone,
  altPhone: students.altPhone,
  address: students.address,
  batchId: students.batchId,
  batchName: batches.name,
  programmeName: programmes.name,
};

/** One page of children with their class and programme names, in a single joined query. */
export async function listStudents(ctx: Ctx, filters: StudentFilters = {}) {
  const db = await getDb();
  const where = studentWhere(ctx.centre.id, filters);
  const page = Math.max(1, filters.page ?? 1);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(listColumns)
      .from(students)
      .leftJoin(batches, eq(batches.id, students.batchId))
      .leftJoin(programmes, eq(programmes.id, students.programmeId))
      .where(where)
      .orderBy(asc(students.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(students).where(where),
  ]);
  return { rows, total, page, pageSize: PAGE_SIZE };
}

/** The whole filtered list, for the CSV export. */
export async function exportStudents(ctx: Ctx, filters: StudentFilters = {}) {
  const db = await getDb();
  return db
    .select(listColumns)
    .from(students)
    .leftJoin(batches, eq(batches.id, students.batchId))
    .leftJoin(programmes, eq(programmes.id, students.programmeId))
    .where(studentWhere(ctx.centre.id, filters))
    .orderBy(asc(students.name))
    .limit(5000);
}

/** One child with the names a profile page shows, and the parent login if there is one. */
export async function getStudent(ctx: Ctx, id: string) {
  if (!isUuid(id)) throw new ApiError(404, 'Child not found');
  const db = await getDb();
  const [row] = await db
    .select({
      student: students,
      batchName: batches.name,
      programmeName: programmes.name,
      yearName: academicYears.name,
      parentUsername: users.username,
      parentActive: users.active,
      parentLastLogin: users.lastLoginAt,
    })
    .from(students)
    .leftJoin(batches, eq(batches.id, students.batchId))
    .leftJoin(programmes, eq(programmes.id, students.programmeId))
    .leftJoin(academicYears, eq(academicYears.id, students.academicYearId))
    .leftJoin(users, eq(users.id, students.parentUserId))
    .where(and(eq(students.id, id), eq(students.centreId, ctx.centre.id), isNull(students.deletedAt)))
    .limit(1);
  if (!row) throw new ApiError(404, 'Child not found');
  return row;
}

/** Checks the programme and class go together and belong here; gives the academic year. */
async function resolvePlacement(db: DbOrTx, centreId: string, programmeId: string, batchId: string | null) {
  const [programme] = await db.select({ id: programmes.id }).from(programmes).where(eq(programmes.id, programmeId)).limit(1);
  if (!programme) throw new ApiError(422, 'Choose a programme', { programmeId: 'Choose a programme' });
  if (!batchId) return { academicYearId: (await currentYear(db))?.id ?? null };
  const batch = await loadBatch(db, centreId, batchId);
  if (batch.programmeId !== programmeId) throw new ApiError(422, 'That class belongs to another programme', { batchId: 'Choose a class of this programme' });
  return { academicYearId: batch.academicYearId };
}

/**
 * Admit a child. The admission number is taken inside the same transaction as
 * the insert, and an enquiry (when the child came from one) is closed with it.
 */
export async function admitStudent(ctx: Ctx, raw: StudentInput, opts: { enquiryId?: string | null } = {}) {
  const data = studentInput.parse(raw);
  const db = await getDb();
  const student = await db.transaction(async (tx) => {
    const { academicYearId } = await resolvePlacement(tx, ctx.centre.id, data.programmeId, data.batchId);
    const enquiry = opts.enquiryId ? await loadEnquiry(tx, ctx.centre.id, opts.enquiryId) : null;
    if (enquiry?.stage === 'admitted') fail('This enquiry has already been admitted');

    const admissionNo = await nextAdmissionNo(tx, ctx.centre, data.admissionDate);
    const [row] = await tx
      .insert(students)
      .values({ ...data, centreId: ctx.centre.id, admissionNo, academicYearId })
      .returning();

    if (enquiry) {
      await tx
        .update(admissionEnquiries)
        .set({ stage: 'admitted', convertedStudentId: row.id, nextFollowUp: null, updatedAt: new Date() })
        .where(and(eq(admissionEnquiries.id, enquiry.id), eq(admissionEnquiries.centreId, ctx.centre.id)));
      await insertNote(tx, ctx.session, 'admission_enquiry', enquiry.id, `Admitted as ${row.name}, admission number ${admissionNo}`);
    }
    return row;
  });
  await audit(ctx.session, 'student.admit', { entity: 'student', entityId: student.id, centreId: ctx.centre.id, summary: `${student.name} admitted (${student.admissionNo})` });
  return student;
}

export async function updateStudent(ctx: Ctx, id: string, raw: StudentInput) {
  const data = studentInput.parse(raw);
  const db = await getDb();
  await loadStudent(db, ctx.centre.id, id);
  const { academicYearId } = await resolvePlacement(db, ctx.centre.id, data.programmeId, data.batchId);
  const [row] = await db
    .update(students)
    .set({ ...data, academicYearId })
    .where(and(eq(students.id, id), eq(students.centreId, ctx.centre.id)))
    .returning();
  await audit(ctx.session, 'student.update', { entity: 'student', entityId: id, centreId: ctx.centre.id, summary: `${row.name} edited` });
  return row;
}

/** Move one child to another class; the programme and year follow the class. */
export async function moveStudent(ctx: Ctx, id: string, raw: { batchId: string }) {
  const batchId = uuid.parse(raw.batchId);
  const db = await getDb();
  const child = await loadStudent(db, ctx.centre.id, id);
  const batch = await loadBatch(db, ctx.centre.id, batchId);
  if (child.batchId === batch.id) fail('The child is already in that class');
  await db
    .update(students)
    .set({ batchId: batch.id, programmeId: batch.programmeId, academicYearId: batch.academicYearId })
    .where(and(eq(students.id, id), eq(students.centreId, ctx.centre.id)));
  await insertNote(db, ctx.session, 'student', id, `Moved to ${batch.name}`);
  await audit(ctx.session, 'student.move', { entity: 'student', entityId: id, centreId: ctx.centre.id, summary: `${child.name} moved to ${batch.name}` });
  return { batchName: batch.name };
}

const leftInput = z.object({ leftOn: day, reason: requiredText('Reason', 300) });

/** The child stays in the records but drops out of attendance and future bills. */
export async function markStudentLeft(ctx: Ctx, id: string, raw: z.input<typeof leftInput>) {
  requireManager(ctx);
  const data = leftInput.parse(raw);
  const db = await getDb();
  const child = await loadStudent(db, ctx.centre.id, id);
  if (child.status !== 'active') fail('This child is not on the active list');
  if (data.leftOn < child.admissionDate) throw new ApiError(422, 'The leaving date is before the admission date', { leftOn: 'Must be on or after the admission date' });
  await db
    .update(students)
    .set({ status: 'left', leftOn: data.leftOn, leftReason: data.reason })
    .where(and(eq(students.id, id), eq(students.centreId, ctx.centre.id)));
  await insertNote(db, ctx.session, 'student', id, `Marked as left on ${formatDate(data.leftOn)}: ${data.reason}`);
  await audit(ctx.session, 'student.left', { entity: 'student', entityId: id, centreId: ctx.centre.id, summary: `${child.name} left: ${data.reason}` });
}

export async function readmitStudent(ctx: Ctx, id: string) {
  requireManager(ctx);
  const db = await getDb();
  const child = await loadStudent(db, ctx.centre.id, id);
  if (child.status === 'active') fail('This child is already on the active list');
  await db
    .update(students)
    .set({ status: 'active', leftOn: null, leftReason: '' })
    .where(and(eq(students.id, id), eq(students.centreId, ctx.centre.id)));
  await insertNote(db, ctx.session, 'student', id, 'Re-admitted');
  await audit(ctx.session, 'student.readmit', { entity: 'student', entityId: id, centreId: ctx.centre.id, summary: `${child.name} re-admitted` });
}

/** Only for a child added by mistake: one with bills must be marked as left instead. */
export async function deleteStudent(ctx: Ctx, id: string) {
  requireManager(ctx);
  const db = await getDb();
  const child = await loadStudent(db, ctx.centre.id, id);
  const [{ n }] = await db.select({ n: count() }).from(invoices).where(eq(invoices.studentId, id));
  if (n > 0) fail('This child has bills, so the record is kept. Mark the child as left instead.');
  await db
    .update(students)
    // What it was is kept, so the Trash can bring it back as it was.
    .set({ deletedAt: new Date(), status: 'left', batchId: null, meta: { ...child.meta, trashed: { status: child.status, batchId: child.batchId } } })
    .where(and(eq(students.id, id), eq(students.centreId, ctx.centre.id)));
  await audit(ctx.session, 'student.delete', { entity: 'student', entityId: id, centreId: ctx.centre.id, summary: `${child.name} (${child.admissionNo}) deleted` });
}

export async function addStudentNote(ctx: Ctx, id: string, raw: { note: string }) {
  const note = requiredText('Note', 1000).parse(raw.note);
  const db = await getDb();
  await loadStudent(db, ctx.centre.id, id);
  await insertNote(db, ctx.session, 'student', id, note);
}

/* ───────────── parent login ───────────── */

/**
 * Gives the parent a login named after the guardian mobile. Brothers and
 * sisters with the same mobile share it: if the login exists the child is
 * simply linked, and no new password is made.
 */
export async function createParentLogin(ctx: Ctx, studentId: string) {
  const db = await getDb();
  const child = await loadStudent(db, ctx.centre.id, studentId);
  if (!child.guardianPhone) fail('Add the guardian mobile number first');
  const username = child.guardianPhone;

  const password = startingPassword();
  const passwordHash = await hashPassword(password);

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(users).where(eq(users.username, username)).limit(1);
    let userId: string;
    let created = false;
    if (existing) {
      if (existing.role !== 'parent' || existing.centreId !== ctx.centre.id) {
        fail('This mobile number is already used by another login. Ask head office for help.');
      }
      userId = existing.id;
      if (!existing.active) {
        await tx
          .update(users)
          .set({ active: true, passwordHash, mustChangePassword: true, failedLogins: 0, lockedUntil: null })
          .where(eq(users.id, existing.id));
        created = true;
      }
    } else {
      const [user] = await tx
        .insert(users)
        .values({
          name: child.motherName || child.fatherName || `Parent of ${child.name}`,
          username,
          phone: username,
          email: child.email,
          passwordHash,
          role: 'parent',
          centreId: ctx.centre.id,
          mustChangePassword: true,
        })
        .returning({ id: users.id });
      userId = user.id;
      created = true;
    }
    // This child, and any brother or sister with the same mobile who has no login yet.
    const linked = await tx
      .update(students)
      .set({ parentUserId: userId })
      .where(
        and(
          eq(students.centreId, ctx.centre.id),
          isNull(students.deletedAt),
          or(eq(students.id, child.id), and(eq(students.guardianPhone, username), isNull(students.parentUserId))),
        ),
      )
      .returning({ id: students.id, name: students.name });
    return { userId, created, linked };
  });

  await audit(ctx.session, result.created ? 'parent_login.create' : 'parent_login.link', {
    entity: 'user',
    entityId: result.userId,
    centreId: ctx.centre.id,
    summary: result.created ? `Parent login ${username} created for ${child.name}` : `${child.name} added to parent login ${username}`,
  });
  return {
    userId: result.userId,
    username,
    /** Null when the child joined a login that already existed: its password is unchanged. */
    password: result.created ? password : null,
    children: result.linked.map((c) => c.name),
  };
}

export async function resetParentPassword(ctx: Ctx, studentId: string) {
  const db = await getDb();
  const child = await loadStudent(db, ctx.centre.id, studentId);
  if (!child.parentUserId) throw new ApiError(400, 'This child has no parent login yet');
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, child.parentUserId), eq(users.role, 'parent'), eq(users.centreId, ctx.centre.id)))
    .limit(1);
  if (!user) fail('Parent login not found');
  const password = startingPassword();
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: true, failedLogins: 0, lockedUntil: null, active: true })
    .where(eq(users.id, user.id));
  await audit(ctx.session, 'parent_login.reset', { entity: 'user', entityId: user.id, centreId: ctx.centre.id, summary: `Password reset for parent login ${user.username}` });
  return { username: user.username, password, children: [child.name] };
}

/* ───────────── year-end promotion ───────────── */

const promoteInput = z
  .object({
    fromBatchId: uuid,
    studentIds: z.array(uuid).min(1, 'Tick at least one child').max(200),
    mode: z.enum(['move', 'pass_out']),
    toBatchId: optionalUuid,
    /** For leavers: the day they finished. */
    leftOn: optionalDay,
  })
  .refine((v) => v.mode !== 'move' || Boolean(v.toBatchId), { path: ['toBatchId'], message: 'Choose the class they move to' });
export type PromoteInput = z.input<typeof promoteInput>;

/**
 * Moves the ticked children of one class up to another (the target class
 * carries the programme and academic year), or marks them as passed out.
 * Children who were not ticked are left exactly as they are.
 */
export async function promoteStudents(ctx: Ctx, raw: PromoteInput) {
  requireManager(ctx);
  const data = promoteInput.parse(raw);
  const ids = [...new Set(data.studentIds)];
  const db = await getDb();

  const result = await db.transaction(async (tx) => {
    const from = await loadBatch(tx, ctx.centre.id, data.fromBatchId);
    const rows = await tx
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.centreId, ctx.centre.id),
          eq(students.batchId, from.id),
          eq(students.status, 'active'),
          isNull(students.deletedAt),
          inArray(students.id, ids),
        ),
      );
    if (rows.length !== ids.length) fail('Some of the ticked children are no longer in that class. Reload the page and try again.');
    const scope = and(eq(students.centreId, ctx.centre.id), inArray(students.id, ids));

    if (data.mode === 'pass_out') {
      await tx
        .update(students)
        .set({ status: 'passed_out', leftOn: data.leftOn ?? todayIST(), leftReason: `Completed ${from.name}` })
        .where(scope);
      return { from, toName: '' };
    }
    const to = await loadBatch(tx, ctx.centre.id, data.toBatchId!);
    if (to.id === from.id) fail('Choose a different class to move them to');
    await tx
      .update(students)
      .set({ batchId: to.id, programmeId: to.programmeId, academicYearId: to.academicYearId })
      .where(scope);
    return { from, toName: to.name };
  });

  const summary =
    data.mode === 'pass_out'
      ? `${ids.length} children of ${result.from.name} marked as passed out`
      : `${ids.length} children moved from ${result.from.name} to ${result.toName}`;
  await audit(ctx.session, 'student.promote', { entity: 'batch', entityId: result.from.id, centreId: ctx.centre.id, summary, meta: { studentIds: ids } });
  return { moved: ids.length, toName: result.toName };
}

/** The active children of one class, for the promotion tick list. */
export async function batchChildren(ctx: Ctx, batchId: string) {
  if (!isUuid(batchId)) return [];
  const db = await getDb();
  return db
    .select({ id: students.id, name: students.name, admissionNo: students.admissionNo, dob: students.dob, photo: students.photo })
    .from(students)
    .where(and(eq(students.centreId, ctx.centre.id), eq(students.batchId, batchId), eq(students.status, 'active'), isNull(students.deletedAt)))
    .orderBy(asc(students.name));
}

/* ───────────── read-only summaries for the profile tabs ───────────── */

/** Billed, paid and balance for one child, straight from the bills; voided receipts left out. */
export async function studentFeeSummary(ctx: Ctx, studentId: string) {
  const db = await getDb();
  const scope = and(eq(invoices.centreId, ctx.centre.id), eq(invoices.studentId, studentId), ne(invoices.status, 'cancelled'));
  const [[totals], receipts] = await Promise.all([
    db
      .select({
        billed: sql<number>`coalesce(sum(${invoices.total}), 0)::int`,
        paid: sql<number>`coalesce(sum(${invoices.paid}), 0)::int`,
        unpaidBills: sql<number>`count(*) filter (where ${invoices.paid} < ${invoices.total})::int`,
      })
      .from(invoices)
      .where(scope),
    db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        amount: payments.amount,
        method: payments.method,
        paidOn: payments.paidOn,
        title: invoices.title,
      })
      .from(payments)
      .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
      .where(and(eq(payments.centreId, ctx.centre.id), eq(payments.studentId, studentId), isNull(payments.voidedAt)))
      .orderBy(desc(payments.paidOn), desc(payments.createdAt))
      .limit(5),
  ]);
  return { billed: totals.billed, paid: totals.paid, balance: Math.max(0, totals.billed - totals.paid), unpaidBills: totals.unpaidBills, receipts };
}

/** This month day by day, and the percent present for the last three months. */
export async function studentAttendance(ctx: Ctx, studentId: string) {
  const db = await getDb();
  const period = currentPeriod();
  const months = [addMonths(period, -2), addMonths(period, -1), period];
  const from = periodRange(months[0]).from;
  const to = periodRange(period).to;
  const rows = await db
    .select({ day: attendance.day, status: attendance.status })
    .from(attendance)
    .where(and(eq(attendance.centreId, ctx.centre.id), eq(attendance.studentId, studentId), gte(attendance.day, from), lte(attendance.day, to)))
    .orderBy(asc(attendance.day));

  const summary = months.map((month) => {
    const inMonth = rows.filter((r) => r.day.startsWith(month));
    const present = inMonth.filter((r) => r.status === 'present').length;
    // Holidays are not school days, so they do not count for or against the child.
    const schoolDays = inMonth.filter((r) => r.status !== 'holiday').length;
    return { month, present, schoolDays, percent: percent(present, schoolDays) };
  });
  return { period, days: rows.filter((r) => r.day.startsWith(period)), summary };
}

/* ───────────── import from a spreadsheet ───────────── */

const sheetText = (max: number) => z.string().trim().max(max).default('');
const importRow = z.object({
  name: z.string().trim().min(1, "Child's name is required").max(80),
  dob: sheetText(20),
  gender: sheetText(10),
  className: sheetText(80),
  programme: sheetText(80),
  fatherName: sheetText(80),
  motherName: sheetText(80),
  phone: sheetText(20),
  altPhone: sheetText(20),
  email: sheetText(120),
  address: sheetText(300),
  admissionDate: sheetText(20),
  monthlyFee: sheetText(12),
});

const GENDERS: Record<string, 'Girl' | 'Boy'> = { girl: 'Girl', f: 'Girl', female: 'Girl', boy: 'Boy', m: 'Boy', male: 'Boy' };

/**
 * Children from a spreadsheet, each admitted the normal way (an admission
 * number of its own, the same checks as the form). The class is matched by
 * its name in this school; without a class, the programme name is enough.
 * A child already on the list (same name and mobile) is left out.
 */
export async function importChildren(ctx: Ctx, rows: unknown): Promise<ImportResult> {
  requireManager(ctx);
  const db = await getDb();
  const [classList, programmeList, existing] = await Promise.all([
    db.select({ id: batches.id, name: batches.name, programmeId: batches.programmeId }).from(batches).where(and(eq(batches.centreId, ctx.centre.id), eq(batches.active, true))),
    db.select({ id: programmes.id, name: programmes.name }).from(programmes),
    db.select({ name: students.name, phone: students.guardianPhone }).from(students).where(and(eq(students.centreId, ctx.centre.id), isNull(students.deletedAt))),
  ]);
  const key = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
  const classByName = new Map(classList.map((row) => [key(row.name), row]));
  const programmeByName = new Map(programmeList.map((row) => [key(row.name), row]));
  const seen = new Set(existing.map((row) => `${key(row.name)}|${row.phone}`));

  const result = await runImport(rows, importRow, async (row) => {
    const placed = row.className ? classByName.get(key(row.className)) : undefined;
    if (row.className && !placed) fail(`No class called "${row.className}" at this school`);
    const programmeId = placed?.programmeId ?? (row.programme ? programmeByName.get(key(row.programme))?.id : undefined);
    if (!programmeId) fail(row.programme ? `No programme called "${row.programme}"` : 'Write the class or the programme');
    const dob = sheetDate(row.dob);
    if (dob === null) fail('Write the date of birth as DD-MM-YYYY');
    const admitted = sheetDate(row.admissionDate);
    if (admitted === null) fail('Write the admission date as DD-MM-YYYY');
    const fee = row.monthlyFee.replace(/[₹,\s]/g, '').replace(/^Rs\.?/i, '');
    const input: StudentInput = {
      name: row.name,
      dob: dob || '',
      gender: GENDERS[key(row.gender)] ?? '',
      photo: '',
      programmeId: programmeId as string,
      batchId: placed?.id ?? '',
      admissionDate: admitted || todayIST(),
      // "₹1,500" → 1500; empty means the class fee. Anything else is refused by the form's own check.
      monthlyFee: fee === '' ? '' : Number(fee),
      fatherName: row.fatherName,
      motherName: row.motherName,
      guardianPhone: row.phone,
      altPhone: row.altPhone,
      email: row.email,
      address: row.address,
      bloodGroup: '',
      medicalNotes: '',
      pickupPerson: '',
      tshirtSize: '',
    };
    const data = studentInput.parse(input);
    const dedupe = `${key(data.name)}|${data.guardianPhone}`;
    if (seen.has(dedupe)) fail('This child is already on the list');
    await admitStudent(ctx, data);
    seen.add(dedupe);
  });
  await audit(ctx.session, 'student.import', { entity: 'student', centreId: ctx.centre.id, summary: `Imported ${result.added} children from a spreadsheet` });
  return result;
}
