/**
 * The kinds of WhatsApp reminder a school can send parents. Each one says
 * what is due today and which waiting reminders are no longer needed. Every
 * reminder belongs to one school (centre), and only that school sees it.
 *
 * ADDING YOUR OWN
 *   1. Write a ReminderKind like the ones below. `collect` returns what is
 *      due today; give each a `dedupeKey` that names the thing and the
 *      occasion ('fee_due:<billId>', 'birthday:<childId>:<year>'), so the same
 *      reminder is never queued twice however often the job runs.
 *   2. If the reason can go away (the fee was paid), write `resolved`.
 *   3. Add it to REMINDER_KINDS at the bottom. The queue, the head office
 *      Settings card and the daily job pick it up.
 *   4. Add its label and description to src/i18n/ui-hi.ts and ui-bn.ts.
 */
import { and, eq, gte, inArray, isNull, lt, lte, ne, notInArray, sql, type SQL } from 'drizzle-orm';
import type { DB } from '@/db';
import { attendance, centres, invoices, students } from '@/db/schema';
import { addDays, formatDate, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import type { ReminderSettings } from '../hq/shared';

export type ReminderCandidate = {
  centreId: string;
  dedupeKey: string;
  toName: string;
  phone: string;
  /** The words that fill the {placeholders} of the wording. */
  values: Record<string, string | number>;
  entity: string;
  entityId: string;
  /** The screen where the thing itself is seen. */
  href: string;
  dueOn: string;
};

/** `centreId` set: only that school (opening its Reminders screen). Unset: every school (the daily job). */
export type ReminderContext = { db: DB; today: string; settings: ReminderSettings; centreId?: string };

export type ReminderKind = {
  key: string;
  /** English; the screens pass it through t(). */
  label: string;
  description: string;
  defaultTemplate: string;
  /** The {words} the wording may use, shown under the box on the Settings screen. */
  placeholders: string[];
  defaultOn: boolean;
  collect: (ctx: ReminderContext) => Promise<ReminderCandidate[]>;
  /** Of these entity ids, the ones whose reminder is no longer needed. */
  resolved?: (db: DB, entityIds: string[]) => Promise<string[]>;
};

/** An overdue bill is chased once, and only if it fell due in the last this many days. */
const OVERDUE_LOOKBACK_DAYS = 30;

/** Schools that are open, and the one asked for. */
const liveSchool = (centreId?: string): SQL | undefined => and(isNull(centres.deletedAt), notInArray(centres.status, ['closed']), centreId ? eq(centres.id, centreId) : undefined);
const onRoll = and(isNull(students.deletedAt), eq(students.status, 'active'));
const parentOf = (child: { motherName: string; fatherName: string }) => child.motherName || child.fatherName || 'Parent';
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

const billColumns = {
  id: invoices.id,
  centreId: invoices.centreId,
  period: invoices.period,
  title: invoices.title,
  dueDate: invoices.dueDate,
  total: invoices.total,
  paid: invoices.paid,
  child: students.name,
  motherName: students.motherName,
  fatherName: students.fatherName,
  phone: students.guardianPhone,
  centreName: centres.name,
  centrePhone: centres.phone,
};

async function unpaidBills(ctx: ReminderContext, dueWhere: SQL | undefined) {
  return ctx.db
    .select(billColumns)
    .from(invoices)
    .innerJoin(students, eq(students.id, invoices.studentId))
    .innerJoin(centres, eq(centres.id, invoices.centreId))
    .where(and(inArray(invoices.status, ['unpaid', 'partial']), dueWhere, onRoll, liveSchool(ctx.centreId)));
}

function billCandidate(kind: string, bill: Awaited<ReturnType<typeof unpaidBills>>[number], dueOn: string): ReminderCandidate {
  return {
    centreId: bill.centreId,
    dedupeKey: `${kind}:${bill.id}`,
    toName: parentOf(bill),
    phone: bill.phone,
    values: {
      parent: parentOf(bill),
      child: firstName(bill.child),
      amount: inr(bill.total - bill.paid),
      month: bill.period ? periodLabel(bill.period) : bill.title,
      due_date: formatDate(bill.dueDate),
      centre: bill.centreName,
      centre_phone: bill.centrePhone,
    },
    entity: 'invoice',
    entityId: bill.id,
    href: `/centre/fees/bills/${bill.id}`,
    dueOn,
  };
}

/** A bill paid in full or cancelled needs no reminder. */
async function billsSettled(db: DB, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const open = await db.select({ id: invoices.id }).from(invoices).where(and(inArray(invoices.id, ids), inArray(invoices.status, ['unpaid', 'partial'])));
  const stillOpen = new Set(open.map((row) => row.id));
  return ids.filter((id) => !stillOpen.has(id));
}

const feeDue: ReminderKind = {
  key: 'fee_due',
  label: 'Fee due soon',
  description: 'A few days before a bill falls due, a reminder to the parent of each child who has not paid it.',
  defaultTemplate: 'Dear {parent}, a gentle reminder that the fee of {amount} for {child} ({month}) is due on {due_date}. You can pay at the school or by UPI. Thank you, {centre}.',
  placeholders: ['parent', 'child', 'amount', 'month', 'due_date', 'centre', 'centre_phone'],
  defaultOn: true,
  async collect(ctx) {
    const days = Math.min(15, Math.max(1, Math.floor(ctx.settings.daysBefore) || 3));
    const bills = await unpaidBills(ctx, and(gte(invoices.dueDate, ctx.today), lte(invoices.dueDate, addDays(ctx.today, days))));
    return bills.map((bill) => billCandidate('fee_due', bill, ctx.today));
  },
  resolved: billsSettled,
};

const feeOverdue: ReminderKind = {
  key: 'fee_overdue',
  label: 'Fee overdue',
  description: 'Once a bill is past its due date and still not paid in full, one reminder to the parent.',
  defaultTemplate: 'Dear {parent}, the fee of {amount} for {child} ({month}) was due on {due_date} and is still unpaid. Kindly pay at the earliest. {centre}, {centre_phone}',
  placeholders: ['parent', 'child', 'amount', 'month', 'due_date', 'centre', 'centre_phone'],
  defaultOn: true,
  async collect(ctx) {
    const bills = await unpaidBills(ctx, and(lt(invoices.dueDate, ctx.today), gte(invoices.dueDate, addDays(ctx.today, -OVERDUE_LOOKBACK_DAYS))));
    return bills.map((bill) => billCandidate('fee_overdue', bill, ctx.today));
  },
  resolved: billsSettled,
};

const absentToday: ReminderKind = {
  key: 'absent',
  label: 'Absent today',
  description: 'When a child is marked absent, a short message to the parent the same day. Made once the attendance is saved.',
  defaultTemplate: 'Dear {parent}, {child} was absent at {centre} today ({date}). We hope all is well. Please let us know if {child} will be away for more days.',
  placeholders: ['parent', 'child', 'date', 'centre', 'centre_phone'],
  defaultOn: true,
  async collect(ctx) {
    const rows = await ctx.db
      .select({
        id: attendance.id,
        studentId: students.id,
        centreId: attendance.centreId,
        child: students.name,
        motherName: students.motherName,
        fatherName: students.fatherName,
        phone: students.guardianPhone,
        centreName: centres.name,
        centrePhone: centres.phone,
      })
      .from(attendance)
      .innerJoin(students, eq(students.id, attendance.studentId))
      .innerJoin(centres, eq(centres.id, attendance.centreId))
      .where(and(eq(attendance.day, ctx.today), eq(attendance.status, 'absent'), onRoll, liveSchool(ctx.centreId)));
    return rows.map((row) => ({
      centreId: row.centreId,
      dedupeKey: `absent:${row.studentId}:${ctx.today}`,
      toName: parentOf(row),
      phone: row.phone,
      values: { parent: parentOf(row), child: firstName(row.child), date: formatDate(ctx.today), centre: row.centreName, centre_phone: row.centrePhone },
      entity: 'attendance',
      entityId: row.id,
      href: `/centre/students/${row.studentId}`,
      dueOn: ctx.today,
    }));
  },
  // Marked present after all (a late arrival): the message is no longer right.
  async resolved(db, ids) {
    if (!ids.length) return [];
    const still = await db.select({ id: attendance.id }).from(attendance).where(and(inArray(attendance.id, ids), eq(attendance.status, 'absent')));
    const absent = new Set(still.map((row) => row.id));
    return ids.filter((id) => !absent.has(id));
  },
};

const birthday: ReminderKind = {
  key: 'birthday',
  label: 'Birthday',
  description: "On a child's birthday, a greeting to the parent from the school.",
  defaultTemplate: 'Happy birthday, {child}! Wishing you a wonderful year ahead. With love from everyone at {centre}.',
  placeholders: ['parent', 'child', 'centre'],
  defaultOn: true,
  async collect(ctx) {
    const monthDay = ctx.today.slice(5);
    const rows = await ctx.db
      .select({
        id: students.id,
        centreId: students.centreId,
        child: students.name,
        motherName: students.motherName,
        fatherName: students.fatherName,
        phone: students.guardianPhone,
        centreName: centres.name,
      })
      .from(students)
      .innerJoin(centres, eq(centres.id, students.centreId))
      .where(and(onRoll, liveSchool(ctx.centreId), ne(students.guardianPhone, ''), sql`to_char(${students.dob}, 'MM-DD') = ${monthDay}`));
    return rows.map((row) => ({
      centreId: row.centreId,
      dedupeKey: `birthday:${row.id}:${ctx.today.slice(0, 4)}`,
      toName: parentOf(row),
      phone: row.phone,
      values: { parent: parentOf(row), child: firstName(row.child), centre: row.centreName },
      entity: 'student',
      entityId: row.id,
      href: `/centre/students/${row.id}`,
      dueOn: ctx.today,
    }));
  },
};

/** Every kind, in the order the Settings screen shows them. */
export const REMINDER_KINDS: ReminderKind[] = [feeDue, feeOverdue, absentToday, birthday];

export const kindOf = (key: string) => REMINDER_KINDS.find((kind) => kind.key === key);
