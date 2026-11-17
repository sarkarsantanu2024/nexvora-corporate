/** Daily attendance of children and staff, and the monthly register. */
import { and, asc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { attendance, batches, programmes, staff, staffAttendance, students, users, type AttendanceStatus } from '@/db/schema';
import { ApiError, fail } from '@/lib/api';
import { audit } from '@/lib/audit';
import { formatDate, periodRange, todayIST } from '@/lib/date';
import { percent } from '@/lib/money';
import { day, optionalUuid, period as periodSchema, text, uuid } from '@/lib/validators';
import { MARKS } from './constants';
import { isUuid, loadBatch, requireManager, type Ctx } from './shared';

const pastDay = day.refine((v) => v <= todayIST(), 'Attendance cannot be marked for a future date');

/** Who is expected in class on a day: on the active list and admitted by then. */
const expectedOn = (centreId: string, onDay: string) =>
  and(eq(students.centreId, centreId), eq(students.status, 'active'), isNull(students.deletedAt), lte(students.admissionDate, onDay));

/** Each open class with how many of its children are marked for the day. */
export async function dayProgress(ctx: Ctx, onDay: string) {
  const db = await getDb();
  const rows = await db
    .select({
      id: batches.id,
      name: batches.name,
      children: sql<number>`count(${students.id})::int`,
      marked: sql<number>`count(${attendance.id})::int`,
    })
    .from(batches)
    .innerJoin(programmes, eq(programmes.id, batches.programmeId))
    .innerJoin(students, and(eq(students.batchId, batches.id), expectedOn(ctx.centre.id, onDay)))
    .leftJoin(attendance, and(eq(attendance.studentId, students.id), eq(attendance.day, onDay)))
    .where(and(eq(batches.centreId, ctx.centre.id), eq(batches.active, true)))
    .groupBy(batches.id, batches.name, programmes.sort)
    .orderBy(asc(programmes.sort), asc(batches.name));
  return rows;
}

/** The marking sheet for one class on one day. */
export async function attendanceSheet(ctx: Ctx, input: { day: string; batchId: string }) {
  const onDay = pastDay.parse(input.day);
  const db = await getDb();
  const batch = await loadBatch(db, ctx.centre.id, input.batchId);
  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      photo: students.photo,
      admissionNo: students.admissionNo,
      status: attendance.status,
      note: attendance.note,
      markedAt: attendance.createdAt,
      markedByName: users.name,
    })
    .from(students)
    .leftJoin(attendance, and(eq(attendance.studentId, students.id), eq(attendance.day, onDay)))
    .leftJoin(users, eq(users.id, attendance.markedBy))
    .where(and(expectedOn(ctx.centre.id, onDay), eq(students.batchId, batch.id)))
    .orderBy(asc(students.name));

  // The latest mark tells the teacher who saved this sheet last, and when.
  const last = rows.reduce<(typeof rows)[number] | null>((best, row) => (row.markedAt && (!best?.markedAt || row.markedAt > best.markedAt) ? row : best), null);
  return {
    day: onDay,
    batch: { id: batch.id, name: batch.name },
    rows,
    markedBy: last?.markedByName ?? '',
    markedAt: last?.markedAt ?? null,
    isHoliday: rows.length > 0 && rows.every((r) => r.status === 'holiday'),
  };
}

const saveInput = z.object({
  day: pastDay,
  batchId: uuid,
  marks: z
    .array(z.object({ studentId: uuid, status: z.enum(MARKS), note: text(200) }))
    .min(1, 'Mark at least one child')
    .max(200),
});
export type SaveAttendanceInput = z.input<typeof saveInput>;

/**
 * Saves a class's attendance. One row per child per day: saving the same day
 * again changes the marks instead of adding more.
 */
export async function saveAttendance(ctx: Ctx, raw: SaveAttendanceInput) {
  const data = saveInput.parse(raw);
  const db = await getDb();
  const batch = await loadBatch(db, ctx.centre.id, data.batchId);
  const marks = [...new Map(data.marks.map((m) => [m.studentId, m])).values()];

  const allowed = await db
    .select({ id: students.id })
    .from(students)
    .where(and(expectedOn(ctx.centre.id, data.day), eq(students.batchId, batch.id), inArray(students.id, marks.map((m) => m.studentId))));
  if (allowed.length !== marks.length) fail('Some children are not in this class any more. Reload the page and try again.');

  await db
    .insert(attendance)
    .values(marks.map((m) => ({ centreId: ctx.centre.id, studentId: m.studentId, batchId: batch.id, day: data.day, status: m.status, note: m.note, markedBy: ctx.session.uid })))
    .onConflictDoUpdate({
      target: [attendance.studentId, attendance.day],
      set: {
        status: sql`excluded.status`,
        note: sql`excluded.note`,
        batchId: sql`excluded.batch_id`,
        markedBy: sql`excluded.marked_by`,
        // Doubles as "last marked at", which the sheet shows.
        createdAt: sql`now()`,
      },
    });
  await audit(ctx.session, 'attendance.save', { entity: 'batch', entityId: batch.id, centreId: ctx.centre.id, summary: `Attendance of ${batch.name} for ${formatDate(data.day)}: ${marks.length} marked` });
  return { saved: marks.length };
}

const holidayInput = z.object({ day: pastDay, batchId: optionalUuid });

/** Marks a holiday for one class, or for every class when no class is given. */
export async function markHoliday(ctx: Ctx, raw: z.input<typeof holidayInput>) {
  const data = holidayInput.parse(raw);
  const db = await getDb();
  const batch = data.batchId ? await loadBatch(db, ctx.centre.id, data.batchId) : null;
  const children = await db
    .select({ id: students.id, batchId: students.batchId })
    .from(students)
    .where(and(expectedOn(ctx.centre.id, data.day), batch ? eq(students.batchId, batch.id) : undefined));
  if (!children.length) fail('There are no children to mark for that day');

  await db
    .insert(attendance)
    .values(children.map((c) => ({ centreId: ctx.centre.id, studentId: c.id, batchId: c.batchId, day: data.day, status: 'holiday' as const, markedBy: ctx.session.uid })))
    .onConflictDoUpdate({
      target: [attendance.studentId, attendance.day],
      set: { status: sql`excluded.status`, note: sql`''`, batchId: sql`excluded.batch_id`, markedBy: sql`excluded.marked_by`, createdAt: sql`now()` },
    });
  await audit(ctx.session, 'attendance.holiday', { entity: 'centre', entityId: ctx.centre.id, centreId: ctx.centre.id, summary: `Holiday on ${formatDate(data.day)} for ${batch ? batch.name : 'the whole school'}` });
  return { marked: children.length };
}

/** The month's register for one class: children down, days across. */
export async function monthlyRegister(ctx: Ctx, input: { period: string; batchId: string }) {
  const month = periodSchema.parse(input.period);
  const db = await getDb();
  const batch = await loadBatch(db, ctx.centre.id, input.batchId);
  const { from, to } = periodRange(month);

  const [children, marks] = await Promise.all([
    db
      .select({ id: students.id, name: students.name, admissionNo: students.admissionNo, status: students.status })
      .from(students)
      .where(
        and(
          eq(students.centreId, ctx.centre.id),
          isNull(students.deletedAt),
          eq(students.batchId, batch.id),
          lte(students.admissionDate, to),
          // A child who left during the month still belongs on that month's register.
          or(eq(students.status, 'active'), gte(students.leftOn, from)),
        ),
      )
      .orderBy(asc(students.name)),
    // The whole grid in one query; it is keyed by child below.
    db
      .select({ studentId: attendance.studentId, day: attendance.day, status: attendance.status })
      .from(attendance)
      .innerJoin(students, eq(students.id, attendance.studentId))
      .where(and(eq(attendance.centreId, ctx.centre.id), eq(students.batchId, batch.id), gte(attendance.day, from), lte(attendance.day, to))),
  ]);

  const byChild = new Map<string, Map<string, AttendanceStatus>>();
  for (const mark of marks) {
    if (!byChild.has(mark.studentId)) byChild.set(mark.studentId, new Map());
    byChild.get(mark.studentId)!.set(mark.day, mark.status);
  }
  const lastDay = Number(to.slice(8));
  const days = Array.from({ length: lastDay }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);

  const rows = children.map((child) => {
    const own = byChild.get(child.id) ?? new Map<string, AttendanceStatus>();
    const tally = { present: 0, absent: 0, leave: 0, holiday: 0 };
    for (const status of own.values()) tally[status] += 1;
    return {
      ...child,
      marks: days.map((d) => own.get(d) ?? null),
      ...tally,
      percent: percent(tally.present, tally.present + tally.absent + tally.leave),
    };
  });
  return { period: month, batch: { id: batch.id, name: batch.name }, days, rows };
}

/* ───────────── staff ───────────── */

/** Staff on the rolls for a day, with their mark if any. */
export async function staffSheet(ctx: Ctx, input: { day: string }) {
  requireManager(ctx);
  const onDay = pastDay.parse(input.day);
  const db = await getDb();
  const rows = await db
    .select({
      staffId: staff.id,
      name: staff.name,
      roleTitle: staff.roleTitle,
      status: staffAttendance.status,
      markedAt: staffAttendance.createdAt,
      markedByName: users.name,
    })
    .from(staff)
    .leftJoin(staffAttendance, and(eq(staffAttendance.staffId, staff.id), eq(staffAttendance.day, onDay)))
    .leftJoin(users, eq(users.id, staffAttendance.markedBy))
    .where(
      and(
        eq(staff.centreId, ctx.centre.id),
        isNull(staff.deletedAt),
        or(isNull(staff.joinedOn), lte(staff.joinedOn, onDay)),
        or(eq(staff.active, true), gte(staff.leftOn, onDay)),
      ),
    )
    .orderBy(asc(staff.name));
  const last = rows.reduce<(typeof rows)[number] | null>((best, row) => (row.markedAt && (!best?.markedAt || row.markedAt > best.markedAt) ? row : best), null);
  return { day: onDay, rows, markedBy: last?.markedByName ?? '', markedAt: last?.markedAt ?? null };
}

const staffSaveInput = z.object({
  day: pastDay,
  marks: z.array(z.object({ staffId: uuid, status: z.enum(MARKS) })).min(1, 'Mark at least one staff member').max(100),
});

export async function saveStaffAttendance(ctx: Ctx, raw: z.input<typeof staffSaveInput>) {
  requireManager(ctx);
  const data = staffSaveInput.parse(raw);
  const db = await getDb();
  const marks = [...new Map(data.marks.map((m) => [m.staffId, m])).values()];
  const allowed = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.centreId, ctx.centre.id), isNull(staff.deletedAt), inArray(staff.id, marks.map((m) => m.staffId))));
  if (allowed.length !== marks.length) throw new ApiError(404, 'Staff member not found');

  await db
    .insert(staffAttendance)
    .values(marks.map((m) => ({ centreId: ctx.centre.id, staffId: m.staffId, day: data.day, status: m.status, markedBy: ctx.session.uid })))
    .onConflictDoUpdate({
      target: [staffAttendance.staffId, staffAttendance.day],
      set: { status: sql`excluded.status`, markedBy: sql`excluded.marked_by`, createdAt: sql`now()` },
    });
  await audit(ctx.session, 'staff_attendance.save', { entity: 'centre', entityId: ctx.centre.id, centreId: ctx.centre.id, summary: `Staff attendance for ${formatDate(data.day)}: ${marks.length} marked` });
  return { saved: marks.length };
}

/** A class id from the URL, checked, or the first open class when there is none. */
export const pickBatchId = (requested: string | undefined, options: { id: string }[]) =>
  isUuid(requested) && options.some((o) => o.id === requested) ? requested : (options[0]?.id ?? '');
