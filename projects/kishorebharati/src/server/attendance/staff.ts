/**
 * Staff attendance: who came to work each day, marked by the office.
 * Present, absent, on leave, half day or on duty (exam duty, a training).
 * Unlike the students' register, a holiday does not shut it: someone may be
 * on duty on a holiday.
 */
import { and, asc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { STAFF_ATTENDANCE_STATUSES, staff, staffAttendance, users, type StaffAttendanceStatus } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { formatDate, periodOf, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day as dayField, uuid } from '@/lib/validators';
import { assertOffice } from '../school/access';
import { daysOf, holidaysBetween } from '../daily/shared';

export const STAFF_LETTER: Record<StaffAttendanceStatus, string> = { present: 'P', absent: 'A', leave: 'L', half_day: 'H', duty: 'D' };

async function staffList() {
  const db = await getDb();
  return db
    .select({ id: staff.id, name: staff.name, nameBn: staff.nameBn, designation: staff.designation, photo: staff.photo })
    .from(staff)
    .where(and(eq(staff.active, true), isNull(staff.deletedAt)))
    .orderBy(asc(staff.sort), asc(staff.name));
}

export async function staffSheet(session: Session, day: string) {
  assertOffice(session);
  const date = dayField.parse(day);
  const db = await getDb();
  const [people, marks] = await Promise.all([
    staffList(),
    db
      .select({ staffId: staffAttendance.staffId, status: staffAttendance.status, createdAt: staffAttendance.createdAt, markedBy: users.name })
      .from(staffAttendance)
      .leftJoin(users, eq(users.id, staffAttendance.markedBy))
      .where(eq(staffAttendance.day, date)),
  ]);
  const statusOf = new Map(marks.map((row) => [row.staffId, row.status]));
  const latest = marks.reduce<(typeof marks)[number] | null>((best, row) => (!best || row.createdAt > best.createdAt ? row : best), null);
  return {
    day: date,
    rows: people.map((person) => ({ ...person, status: statusOf.get(person.id) ?? null })),
    markedAt: latest?.createdAt ?? null,
    markedBy: latest?.markedBy ?? '',
  };
}

const saveInput = z.object({
  day: dayField,
  marks: z
    .array(z.object({ staffId: uuid, status: z.enum(STAFF_ATTENDANCE_STATUSES) }))
    .min(1, 'Mark at least one person')
    .max(300),
});

export async function saveStaffAttendance(session: Session, raw: z.input<typeof saveInput>) {
  assertOffice(session);
  const input = saveInput.parse(raw);
  if (input.day > todayIST()) throw new ApiError(400, 'You cannot mark a day that has not come yet');
  const db = await getDb();
  const ids = [...new Set(input.marks.map((mark) => mark.staffId))];
  const known = await db.select({ id: staff.id }).from(staff).where(and(inArray(staff.id, ids), isNull(staff.deletedAt)));
  if (known.length !== ids.length) throw new ApiError(400, 'Someone on the list is not on the staff list');
  const byStaff = new Map(input.marks.map((mark) => [mark.staffId, mark.status]));
  const now = new Date();
  await db
    .insert(staffAttendance)
    .values([...byStaff].map(([staffId, status]) => ({ day: input.day, staffId, status, markedBy: session.uid, createdAt: now })))
    .onConflictDoUpdate({
      target: [staffAttendance.staffId, staffAttendance.day],
      set: { status: sql`excluded.status`, markedBy: sql`excluded.marked_by`, createdAt: sql`excluded.created_at` },
    });
  const absent = [...byStaff.values()].filter((status) => status === 'absent').length;
  await audit(session, 'staff_attendance.save', { entity: 'staff_attendance', entityId: input.day, summary: `Staff attendance for ${formatDate(input.day)}: ${byStaff.size} marked, ${absent} absent` });
  return { marked: byStaff.size, absent };
}

/** The month for every member of staff, with totals. */
export async function staffMonthly(session: Session, month: string) {
  assertOffice(session);
  const today = todayIST();
  const chosen = month <= periodOf(today) ? month : periodOf(today);
  const days = daysOf(chosen, today);
  const from = `${chosen}-01`;
  const to = days[days.length - 1] ?? from;
  const db = await getDb();
  const [people, marks, holidays] = await Promise.all([
    staffList(),
    db.select({ staffId: staffAttendance.staffId, day: staffAttendance.day, status: staffAttendance.status }).from(staffAttendance).where(and(gte(staffAttendance.day, from), lte(staffAttendance.day, to))),
    holidaysBetween(from, to, db),
  ]);
  const status = new Map(marks.map((row) => [`${row.staffId}:${row.day}`, row.status]));
  const rows = people.map((person) => {
    const cells = days.map((day) => status.get(`${person.id}:${day}`) ?? null);
    const total: Record<StaffAttendanceStatus, number> = { present: 0, absent: 0, leave: 0, half_day: 0, duty: 0 };
    for (const cell of cells) if (cell) total[cell]++;
    return { ...person, cells, total };
  });
  return { month: chosen, days, rows, holidays };
}
