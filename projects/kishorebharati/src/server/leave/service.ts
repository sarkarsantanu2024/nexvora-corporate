/**
 * Staff leave: a teacher applies for their own leave, the office records an
 * application for anyone, and only the head of school (admin) approves or
 * rejects it. Leave types and yearly quotas are in settings ('office').
 *
 * Days are counted without the Sundays and calendar holidays inside the
 * range, and a leave stays inside one calendar year so the balance of each
 * year is plain.
 *
 * For the attendance screens: listApprovedLeave(from, to) gives every day of
 * approved leave, so a day with no attendance row can show "on leave".
 */
import { and, asc, desc, eq, gte, inArray, isNull, lte, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { LEAVE_STATUSES, staff, staffLeaves, type LeaveStatus } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { addDays, todayIST, weekday } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day as dayField, optionalUuid, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, isAdmin, pageOf } from '../admin/shared';
import { holidaysBetween } from '../daily/shared';
import type { LeaveType } from '../office/defaults';
import { officeSettings } from '../office/shared';
import { assertSchool, isOffice, staffOf } from '../school/access';

/** Pending and approved leave hold days; rejected and cancelled do not. */
const HOLDING: LeaveStatus[] = ['pending', 'approved'];

export async function leaveTypes(db?: DbOrTx): Promise<LeaveType[]> {
  return (await officeSettings(db)).leaveTypes;
}

/** Days a leave counts: every day of the range but Sundays and calendar holidays. */
export async function countLeaveDays(from: string, to: string, db?: DbOrTx): Promise<number> {
  const holidays = await holidaysBetween(from, to, db);
  let n = 0;
  for (let day = from; day <= to; day = addDays(day, 1)) if (weekday(day) !== 0 && !holidays.has(day)) n++;
  return n;
}

/** The staff row a teacher's login is linked to, or a refusal. */
async function myStaffId(session: Session, db: DbOrTx): Promise<string> {
  const me = await staffOf(session, db);
  if (!me) throw new ApiError(400, 'Your login is not linked to a staff member. Ask the office.');
  return me.id;
}

export type LeaveFilters = { status?: string; staff?: string; year?: string; page?: string | number };
const isStatus = (value: unknown): value is LeaveStatus => (LEAVE_STATUSES as readonly string[]).includes(value as string);
const yearOf = (value: unknown) => (/^\d{4}$/.test(String(value ?? '')) ? String(value) : todayIST().slice(0, 4));

/** Leave applications, newest first. A teacher sees only their own. */
export async function listLeaves(session: Session, filters: LeaveFilters = {}) {
  assertSchool(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const year = yearOf(filters.year);
  const parts: (SQL | undefined)[] = [gte(staffLeaves.fromDate, `${year}-01-01`), lte(staffLeaves.fromDate, `${year}-12-31`)];
  if (!isOffice(session)) parts.push(eq(staffLeaves.staffId, await myStaffId(session, db)));
  else if (uuid.safeParse(filters.staff).success) parts.push(eq(staffLeaves.staffId, filters.staff as string));
  const base = and(...parts);
  const where = isStatus(filters.status) ? and(base, eq(staffLeaves.status, filters.status)) : base;
  const [rows, [{ n }], statusRows] = await Promise.all([
    db
      .select({ leave: staffLeaves, staffName: staff.name, designation: staff.designation })
      .from(staffLeaves)
      .innerJoin(staff, eq(staff.id, staffLeaves.staffId))
      .where(where)
      .orderBy(desc(staffLeaves.fromDate), desc(staffLeaves.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(staffLeaves).where(where),
    db.select({ status: staffLeaves.status, n: countInt() }).from(staffLeaves).where(base).groupBy(staffLeaves.status),
  ]);
  const counts = Object.fromEntries(LEAVE_STATUSES.map((status) => [status, 0])) as Record<LeaveStatus, number>;
  for (const row of statusRows) counts[row.status] = row.n;
  return { rows, total: n, page, pageSize: PAGE_SIZE, counts, year };
}

/** Days of each type a person has used (approved) and asked for (pending) in a calendar year. */
async function usedDays(db: DbOrTx, staffId: string, year: string, exceptId?: string) {
  const rows = await db
    .select({ leaveType: staffLeaves.leaveType, status: staffLeaves.status, days: staffLeaves.days, id: staffLeaves.id })
    .from(staffLeaves)
    .where(and(eq(staffLeaves.staffId, staffId), inArray(staffLeaves.status, HOLDING), gte(staffLeaves.fromDate, `${year}-01-01`), lte(staffLeaves.fromDate, `${year}-12-31`)));
  const approved = new Map<string, number>();
  const pending = new Map<string, number>();
  for (const row of rows) {
    if (row.id === exceptId) continue;
    const map = row.status === 'approved' ? approved : pending;
    map.set(row.leaveType, (map.get(row.leaveType) ?? 0) + row.days);
  }
  return { approved, pending };
}

export const leaveInput = z.object({
  staffId: optionalUuid,
  leaveType: z.string().trim().min(1, 'Choose the kind of leave'),
  fromDate: dayField,
  toDate: dayField,
  reason: text(500),
});
export type LeaveInput = z.input<typeof leaveInput>;

/**
 * A new application. A teacher applies only for themself; the office may
 * record one for anyone. It waits for the head of school.
 */
export async function applyLeave(session: Session, raw: LeaveInput) {
  assertSchool(session);
  const input = leaveInput.parse(raw);
  const db = await getDb();
  let staffId: string;
  if (isOffice(session)) {
    staffId = input.staffId ?? (await myStaffId(session, db));
  } else {
    staffId = await myStaffId(session, db);
    if (input.staffId && input.staffId !== staffId) throw new ApiError(403, 'You can apply only for your own leave');
  }
  const [person] = await db.select({ id: staff.id, name: staff.name }).from(staff).where(and(eq(staff.id, staffId), isNull(staff.deletedAt))).limit(1);
  if (!person) throw new ApiError(404, 'Staff member not found');

  const types = await leaveTypes(db);
  const type = types.find((item) => item.key === input.leaveType);
  if (!type) throw new ApiError(400, 'Choose the kind of leave', { leaveType: 'Choose the kind of leave' });
  if (input.toDate < input.fromDate) throw new ApiError(400, 'The last day cannot be before the first day', { toDate: 'The last day cannot be before the first day' });
  if (input.fromDate.slice(0, 4) !== input.toDate.slice(0, 4)) throw new ApiError(400, 'Apply separately for the days in each year', { toDate: 'Apply separately for the days in each year' });
  const days = await countLeaveDays(input.fromDate, input.toDate, db);
  if (days === 0) throw new ApiError(400, 'Those days are all Sundays or holidays');

  const [overlap] = await db
    .select({ id: staffLeaves.id })
    .from(staffLeaves)
    .where(and(eq(staffLeaves.staffId, staffId), inArray(staffLeaves.status, HOLDING), lte(staffLeaves.fromDate, input.toDate), gte(staffLeaves.toDate, input.fromDate)))
    .limit(1);
  if (overlap) throw new ApiError(400, 'There is already a leave for some of these days');

  if (type.quota > 0) {
    const used = await usedDays(db, staffId, input.fromDate.slice(0, 4));
    const taken = (used.approved.get(type.key) ?? 0) + (used.pending.get(type.key) ?? 0);
    if (taken + days > type.quota) throw new ApiError(400, 'Not enough days of this leave are left this year');
  }

  const [row] = await db
    .insert(staffLeaves)
    .values({ staffId, leaveType: type.key, fromDate: input.fromDate, toDate: input.toDate, days, reason: input.reason, appliedBy: session.uid, appliedByName: session.name })
    .returning();
  await audit(session, 'leave.apply', { entity: 'staff_leave', entityId: row.id, summary: `${type.name} for ${person.name}, ${days} days from ${input.fromDate}` });
  return row;
}

/** Only the head of school approves or rejects, and only a leave still waiting. */
export async function decideLeave(session: Session, id: string, decision: 'approved' | 'rejected', note = '') {
  assertAdmin(session);
  if (decision !== 'approved' && decision !== 'rejected') throw new ApiError(400, 'Choose approve or reject');
  const db = await getDb();
  const [leave] = await db.select().from(staffLeaves).where(eq(staffLeaves.id, uuid.parse(id))).limit(1);
  if (!leave) throw new ApiError(404, 'Leave not found');
  if (leave.status !== 'pending') throw new ApiError(400, 'This leave has already been decided');
  if (decision === 'approved') {
    const type = (await leaveTypes(db)).find((item) => item.key === leave.leaveType);
    if (type && type.quota > 0) {
      const used = await usedDays(db, leave.staffId, leave.fromDate.slice(0, 4), leave.id);
      if ((used.approved.get(type.key) ?? 0) + leave.days > type.quota) throw new ApiError(400, 'Not enough days of this leave are left this year');
    }
  }
  const [row] = await db
    .update(staffLeaves)
    .set({ status: decision, decidedBy: session.uid, decidedByName: session.name, decidedAt: new Date(), decisionNote: text(300).parse(note), updatedAt: new Date() })
    .where(and(eq(staffLeaves.id, leave.id), eq(staffLeaves.status, 'pending')))
    .returning();
  if (!row) throw new ApiError(400, 'This leave has already been decided');
  await audit(session, `leave.${decision === 'approved' ? 'approve' : 'reject'}`, { entity: 'staff_leave', entityId: row.id, summary: `Leave from ${row.fromDate} ${decision}` });
  return row;
}

/**
 * Takes back an application. A teacher: their own, while it waits. The
 * office: any that waits. The head of school may also cancel an approved one.
 */
export async function cancelLeave(session: Session, id: string) {
  assertSchool(session);
  const db = await getDb();
  const [leave] = await db.select().from(staffLeaves).where(eq(staffLeaves.id, uuid.parse(id))).limit(1);
  if (!leave) throw new ApiError(404, 'Leave not found');
  if (!isOffice(session) && leave.staffId !== (await myStaffId(session, db))) throw new ApiError(403, 'You can cancel only your own leave');
  const allowed = leave.status === 'pending' || (leave.status === 'approved' && isAdmin(session));
  if (!allowed) throw new ApiError(400, 'This leave cannot be cancelled now');
  await db.update(staffLeaves).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(staffLeaves.id, leave.id));
  await audit(session, 'leave.cancel', { entity: 'staff_leave', entityId: leave.id, summary: `Cancelled the leave from ${leave.fromDate}` });
}

/** For each person and each leave type: the quota, days approved, days waiting and days left in a year. A teacher sees only their own line. */
export async function leaveBalances(session: Session, yearInput?: string) {
  assertSchool(session);
  const db = await getDb();
  const year = yearOf(yearInput);
  const types = await leaveTypes(db);
  const mine = isOffice(session) ? null : await myStaffId(session, db);
  const people = await db
    .select({ id: staff.id, name: staff.name, designation: staff.designation })
    .from(staff)
    .where(and(isNull(staff.deletedAt), mine ? eq(staff.id, mine) : eq(staff.active, true)))
    .orderBy(asc(staff.sort), asc(staff.name));
  const sums = await db
    .select({ staffId: staffLeaves.staffId, leaveType: staffLeaves.leaveType, status: staffLeaves.status, days: staffLeaves.days })
    .from(staffLeaves)
    .where(and(inArray(staffLeaves.status, HOLDING), gte(staffLeaves.fromDate, `${year}-01-01`), lte(staffLeaves.fromDate, `${year}-12-31`), mine ? eq(staffLeaves.staffId, mine) : undefined));
  const key = (staffId: string, type: string, status: string) => `${staffId}|${type}|${status}`;
  const total = new Map<string, number>();
  for (const row of sums) total.set(key(row.staffId, row.leaveType, row.status), (total.get(key(row.staffId, row.leaveType, row.status)) ?? 0) + row.days);
  return {
    year,
    types,
    people: people.map((person) => ({
      ...person,
      balances: types.map((type) => {
        const approved = total.get(key(person.id, type.key, 'approved')) ?? 0;
        const pending = total.get(key(person.id, type.key, 'pending')) ?? 0;
        return { key: type.key, quota: type.quota, approved, pending, left: type.quota > 0 ? Math.max(0, type.quota - approved) : null };
      }),
    })),
  };
}

/** Leave waiting for the head of school (for the bell and the overview). */
export async function pendingLeaveCount(db?: DbOrTx): Promise<number> {
  const conn = db ?? (await getDb());
  const [{ n }] = await conn.select({ n: countInt() }).from(staffLeaves).where(eq(staffLeaves.status, 'pending'));
  return n;
}

/** A person's own leave decided since a moment (for the bell). */
export async function decidedSince(session: Session, since: Date) {
  const db = await getDb();
  const me = await staffOf(session, db);
  if (!me) return [];
  return db
    .select({ id: staffLeaves.id, status: staffLeaves.status, fromDate: staffLeaves.fromDate, toDate: staffLeaves.toDate, leaveType: staffLeaves.leaveType })
    .from(staffLeaves)
    .where(and(eq(staffLeaves.staffId, me.id), or(eq(staffLeaves.status, 'approved'), eq(staffLeaves.status, 'rejected')), gte(staffLeaves.decidedAt, since)))
    .orderBy(desc(staffLeaves.decidedAt))
    .limit(5);
}

export type ApprovedLeaveDay = { staffId: string; day: string; leaveType: string; leaveId: string };

/**
 * Every day of approved leave between two days (both included), one line per
 * person per day, Sundays left out. For the staff attendance screens: a day
 * with no attendance row for a person who is on approved leave shows as
 * leave. Read only; it writes nothing.
 */
export async function listApprovedLeave(from: string, to: string, db?: DbOrTx): Promise<ApprovedLeaveDay[]> {
  const conn = db ?? (await getDb());
  const rows = await conn
    .select({ id: staffLeaves.id, staffId: staffLeaves.staffId, leaveType: staffLeaves.leaveType, fromDate: staffLeaves.fromDate, toDate: staffLeaves.toDate })
    .from(staffLeaves)
    .where(and(eq(staffLeaves.status, 'approved'), lte(staffLeaves.fromDate, to), gte(staffLeaves.toDate, from)));
  const out: ApprovedLeaveDay[] = [];
  for (const row of rows) {
    const start = row.fromDate > from ? row.fromDate : from;
    const end = row.toDate < to ? row.toDate : to;
    for (let day = start; day <= end; day = addDays(day, 1)) if (weekday(day) !== 0) out.push({ staffId: row.staffId, day, leaveType: row.leaveType, leaveId: row.id });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || a.staffId.localeCompare(b.staffId));
}

/** People to pick from when the office records a leave. */
export async function staffChoices(session: Session) {
  assertSchool(session);
  const db = await getDb();
  if (!isOffice(session)) {
    const me = await staffOf(session, db);
    return me ? [{ id: me.id, name: me.name, designation: me.designation }] : [];
  }
  return db
    .select({ id: staff.id, name: staff.name, designation: staff.designation })
    .from(staff)
    .where(and(isNull(staff.deletedAt), eq(staff.active, true)))
    .orderBy(asc(staff.sort), asc(staff.name));
}
