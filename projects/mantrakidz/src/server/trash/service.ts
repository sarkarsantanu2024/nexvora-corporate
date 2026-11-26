/**
 * The Trash: records that were deleted, kept so a mistake can be undone.
 *
 * A deleted record keeps its row with `deleted_at` set, and every list leaves
 * it out. From the Trash an admin brings it back as it was, or removes it for
 * good where that is safe.
 *
 *   a school's Trash (school head):  children, staff and expenses of that school
 *   head office Trash (HQ admin):     schools
 *
 * Money records are never removed for good: an expense, and a school, can
 * only be brought back. A child or staff member could only be deleted when
 * nothing hung off them (no bills; no salary, attendance, class or login), so
 * removing them for good loses nothing else.
 *
 * Nothing leaves the Trash by itself.
 */
import { and, count, desc, eq, inArray, isNotNull, type AnyColumn } from 'drizzle-orm';
import { getDb, type DB } from '@/db';
import { activityNotes, batches, centres, expenses, invoices, payments, staff, students, users } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { canManageCentre, type Session } from '@/lib/auth';
import { inr } from '@/lib/money';
import { uuid } from '@/lib/validators';
import type { Ctx } from '../centre/money/shared';
import { assertAdmin } from '../hq/shared';

export type TrashRow = { kind: string; id: string; title: string; detail: string; deletedAt: Date; canPurge: boolean };

type Meta = Record<string, unknown>;
/** The state noted on delete (see the delete functions), and the meta without it. */
function takeTrashed<T extends object>(meta: Meta): { before: Partial<T>; rest: Meta } {
  const { trashed, ...rest } = meta;
  return { before: (trashed && typeof trashed === 'object' ? trashed : {}) as Partial<T>, rest };
}

type TrashSource = {
  kind: string;
  /** English; the screen passes it through t(). */
  label: string;
  canPurge: boolean;
  /** centreId: the school's own Trash. Undefined: head office. */
  list: (db: DB, centreId?: string) => Promise<TrashRow[]>;
  /** Returns the name, or null when it is not in this Trash. */
  restore: (db: DB, id: string, centreId?: string) => Promise<string | null>;
  purge: (db: DB, id: string, centreId?: string) => Promise<string | null>;
};

const LIST_LIMIT = 200;
const inSchool = (column: AnyColumn, centreId?: string) => (centreId ? eq(column, centreId) : undefined);

const childSource: TrashSource = {
  kind: 'student',
  label: 'Child',
  canPurge: true,
  async list(db, centreId) {
    const rows = await db
      .select({ id: students.id, name: students.name, admissionNo: students.admissionNo, phone: students.guardianPhone, deletedAt: students.deletedAt })
      .from(students)
      .where(and(isNotNull(students.deletedAt), inSchool(students.centreId, centreId)))
      .orderBy(desc(students.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({ kind: 'student', id: row.id, title: row.name, detail: [row.admissionNo, row.phone].filter(Boolean).join(' · '), deletedAt: row.deletedAt as Date, canPurge: true }));
  },
  async restore(db, id, centreId) {
    const [row] = await db.select().from(students).where(and(eq(students.id, id), isNotNull(students.deletedAt), inSchool(students.centreId, centreId))).limit(1);
    if (!row) return null;
    const { before, rest } = takeTrashed<{ status: typeof row.status; batchId: string | null }>(row.meta);
    // The class goes back only if it is still there.
    const [batch] = before.batchId ? await db.select({ id: batches.id }).from(batches).where(and(eq(batches.id, before.batchId), eq(batches.centreId, row.centreId))).limit(1) : [];
    await db
      .update(students)
      .set({ deletedAt: null, status: before.status ?? 'active', batchId: batch?.id ?? null, meta: rest })
      .where(eq(students.id, row.id));
    return row.name;
  },
  async purge(db, id, centreId) {
    const [row] = await db.select({ id: students.id, name: students.name }).from(students).where(and(eq(students.id, id), isNotNull(students.deletedAt), inSchool(students.centreId, centreId))).limit(1);
    if (!row) return null;
    const [[bills], [paid]] = await Promise.all([
      db.select({ n: count() }).from(invoices).where(eq(invoices.studentId, row.id)),
      db.select({ n: count() }).from(payments).where(eq(payments.studentId, row.id)),
    ]);
    if (bills.n + paid.n > 0) throw new ApiError(400, 'This child has bills or receipts, so the record is kept.');
    await db.transaction(async (tx) => {
      await tx.delete(activityNotes).where(and(eq(activityNotes.entityType, 'student'), eq(activityNotes.entityId, row.id)));
      // Attendance goes with the child (the table cascades).
      await tx.delete(students).where(eq(students.id, row.id));
    });
    return row.name;
  },
};

const staffSource: TrashSource = {
  kind: 'staff',
  label: 'Staff',
  canPurge: true,
  async list(db, centreId) {
    const rows = await db
      .select({ id: staff.id, name: staff.name, roleTitle: staff.roleTitle, phone: staff.phone, deletedAt: staff.deletedAt })
      .from(staff)
      .where(and(isNotNull(staff.deletedAt), inSchool(staff.centreId, centreId)))
      .orderBy(desc(staff.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({ kind: 'staff', id: row.id, title: row.name, detail: [row.roleTitle, row.phone].filter(Boolean).join(' · '), deletedAt: row.deletedAt as Date, canPurge: true }));
  },
  async restore(db, id, centreId) {
    const [row] = await db.select().from(staff).where(and(eq(staff.id, id), isNotNull(staff.deletedAt), inSchool(staff.centreId, centreId))).limit(1);
    if (!row) return null;
    const { before, rest } = takeTrashed<{ active: boolean }>(row.meta);
    await db.update(staff).set({ deletedAt: null, active: before.active ?? true, meta: rest }).where(eq(staff.id, row.id));
    return row.name;
  },
  async purge(db, id, centreId) {
    const [row] = await db.delete(staff).where(and(eq(staff.id, id), isNotNull(staff.deletedAt), inSchool(staff.centreId, centreId))).returning({ name: staff.name });
    return row?.name ?? null;
  },
};

const expenseSource: TrashSource = {
  kind: 'expense',
  label: 'Expense',
  canPurge: false,
  async list(db, centreId) {
    const rows = await db
      .select({ id: expenses.id, category: expenses.category, amount: expenses.amount, paidTo: expenses.paidTo, spentOn: expenses.spentOn, deletedAt: expenses.deletedAt })
      .from(expenses)
      .where(and(isNotNull(expenses.deletedAt), inSchool(expenses.centreId, centreId)))
      .orderBy(desc(expenses.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({
      kind: 'expense',
      id: row.id,
      title: `${row.category}: ${inr(row.amount)}`,
      detail: [row.paidTo, row.spentOn].filter(Boolean).join(' · '),
      deletedAt: row.deletedAt as Date,
      canPurge: false,
    }));
  },
  async restore(db, id, centreId) {
    const [row] = await db
      .update(expenses)
      .set({ deletedAt: null })
      .where(and(eq(expenses.id, id), isNotNull(expenses.deletedAt), inSchool(expenses.centreId, centreId)))
      .returning({ category: expenses.category, amount: expenses.amount });
    return row ? `${row.category}: ${inr(row.amount)}` : null;
  },
  async purge() {
    throw new ApiError(400, 'Money records are never removed for good. Bring it back, or leave it in the Trash.');
  },
};

const schoolSource: TrashSource = {
  kind: 'centre',
  label: 'School',
  canPurge: false,
  async list(db) {
    const rows = await db
      .select({ id: centres.id, name: centres.name, code: centres.code, area: centres.area, deletedAt: centres.deletedAt })
      .from(centres)
      .where(isNotNull(centres.deletedAt))
      .orderBy(desc(centres.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({ kind: 'centre', id: row.id, title: row.name, detail: [row.code, row.area].filter(Boolean).join(' · '), deletedAt: row.deletedAt as Date, canPurge: false }));
  },
  async restore(db, id) {
    const [row] = await db.select().from(centres).where(and(eq(centres.id, id), isNotNull(centres.deletedAt))).limit(1);
    if (!row) return null;
    const { before, rest } = takeTrashed<{ showOnWebsite: boolean; activeUserIds: string[] }>(row.meta);
    await db.transaction(async (tx) => {
      await tx.update(centres).set({ deletedAt: null, showOnWebsite: before.showOnWebsite ?? false, meta: rest, updatedAt: new Date() }).where(eq(centres.id, row.id));
      // Only the logins that were open before the delete are opened again.
      const ids = Array.isArray(before.activeUserIds) ? before.activeUserIds : [];
      if (ids.length) await tx.update(users).set({ active: true }).where(and(eq(users.centreId, row.id), inArray(users.id, ids)));
    });
    return row.name;
  },
  async purge() {
    throw new ApiError(400, 'A school is never removed for good: its history stays. Bring it back, or leave it in the Trash.');
  },
};

const SCHOOL_SOURCES: TrashSource[] = [childSource, staffSource, expenseSource];
const HQ_SOURCES: TrashSource[] = [schoolSource];

export const SCHOOL_TRASH_KINDS = SCHOOL_SOURCES.map((source) => ({ kind: source.kind, label: source.label }));

function sourceOf(list: TrashSource[], kind: string) {
  const source = list.find((item) => item.kind === kind);
  if (!source) throw new ApiError(400, 'Unknown kind of record');
  return source;
}

function assertSchoolHead(ctx: Ctx) {
  if (!canManageCentre(ctx.session)) throw new ApiError(403, 'Only the school head can do this');
}

const newestFirst = (rows: TrashRow[]) => rows.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());

/* ───────────── a school's Trash ───────────── */

export async function listSchoolTrash(ctx: Ctx, kind?: string) {
  assertSchoolHead(ctx);
  const db = await getDb();
  const chosen = kind ? SCHOOL_SOURCES.filter((source) => source.kind === kind) : SCHOOL_SOURCES;
  return newestFirst((await Promise.all(chosen.map((source) => source.list(db, ctx.centre.id)))).flat());
}

export async function restoreSchoolTrash(ctx: Ctx, kind: string, id: string) {
  assertSchoolHead(ctx);
  const name = await sourceOf(SCHOOL_SOURCES, kind).restore(await getDb(), uuid.parse(id), ctx.centre.id);
  if (name === null) throw new ApiError(404, 'It is no longer in the Trash');
  await audit(ctx.session, `${kind}.restore`, { entity: kind, entityId: id, centreId: ctx.centre.id, summary: `Brought back ${name} from the Trash` });
  return name;
}

export async function purgeSchoolTrash(ctx: Ctx, kind: string, id: string) {
  assertSchoolHead(ctx);
  const name = await sourceOf(SCHOOL_SOURCES, kind).purge(await getDb(), uuid.parse(id), ctx.centre.id);
  if (name === null) throw new ApiError(404, 'It is no longer in the Trash');
  await audit(ctx.session, `${kind}.purge`, { entity: kind, entityId: id, centreId: ctx.centre.id, summary: `Removed ${name} for good from the Trash` });
  return name;
}

/* ───────────── head office Trash ───────────── */

export async function listHqTrash(session: Session) {
  assertAdmin(session);
  const db = await getDb();
  return newestFirst((await Promise.all(HQ_SOURCES.map((source) => source.list(db)))).flat());
}

export async function restoreHqTrash(session: Session, kind: string, id: string) {
  assertAdmin(session);
  const name = await sourceOf(HQ_SOURCES, kind).restore(await getDb(), uuid.parse(id));
  if (name === null) throw new ApiError(404, 'It is no longer in the Trash');
  await audit(session, `${kind}.restore`, { entity: kind, entityId: id, summary: `Brought back ${name} from the Trash` });
  return name;
}
