/**
 * Pieces every money service of a centre uses: who is acting, the manager
 * check, fee settings and the SQL fragments that keep totals the same on
 * every screen.
 */
import { eq, isNull, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { getDb, type DbOrTx } from '@/db';
import { payments, settings, students, type Centre } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { canManageCentre, type Session } from '@/lib/auth';

/** Who is doing the work and in which centre. Every service takes this first. */
export type Ctx = { session: Session; centre: Centre };

/** Checked in the service, so hiding a button is never the only guard. */
export function assertManager(ctx: Ctx) {
  if (!canManageCentre(ctx.session)) throw new ApiError(403, 'Only the school head can do this');
}

export const notFound = (what: string): never => {
  throw new ApiError(404, `${what} not found`);
};

/** Receipts that count: voided ones are left out of every total. */
export const livePayment = isNull(payments.voidedAt);
export const liveStudent = isNull(students.deletedAt);

/** sum() that comes back as a JavaScript number and never as null. */
export const sumInt = (expr: AnyColumn | SQL) => sql<number>`coalesce(sum(${expr}), 0)::int`;
export const countInt = () => sql<number>`count(*)::int`;
/** 'YYYY-MM' of a date column, for group by month. */
export const monthOf = (column: AnyColumn) => sql<string>`to_char(${column}, 'YYYY-MM')`;

export const PAGE_SIZE = 25;
export const pageOf = (value: unknown) => Math.max(1, Math.floor(Number(value)) || 1);

/** Makes typed text safe inside ILIKE: % and _ are matched as themselves. */
export const likeText = (q: string) => `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

export type FeeSettings = { dueDay: number; reminderTemplate: string; receiptFooter: string };

const DEFAULT_REMINDER =
  'Dear {parent}, the fee of {amount} for {child} ({month}) at {centre} is due. Kindly pay at the school office. Thank you.';

/** Settings key `fees`, with defaults so a missing or half-filled row never breaks a bill. */
export async function feeSettings(db?: DbOrTx): Promise<FeeSettings> {
  const conn = db ?? (await getDb());
  const [row] = await conn.select().from(settings).where(eq(settings.key, 'fees')).limit(1);
  const stored = row && typeof row.value === 'object' && row.value !== null ? (row.value as Partial<FeeSettings>) : {};
  const dueDay = Number(stored.dueDay);
  return {
    // Kept to the 28th so the due date exists in February too.
    dueDay: Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 28 ? dueDay : 10,
    reminderTemplate: typeof stored.reminderTemplate === 'string' && stored.reminderTemplate.trim() ? stored.reminderTemplate : DEFAULT_REMINDER,
    receiptFooter: typeof stored.receiptFooter === 'string' ? stored.receiptFooter : '',
  };
}

/** The name a reminder or receipt message opens with. */
export const parentName = (child: { motherName: string; fatherName: string }) => child.motherName || child.fatherName || 'Parent';
