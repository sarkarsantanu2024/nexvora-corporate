/**
 * Royalty: what each franchise centre owes head office for a finished month.
 *
 * The amount is frozen on the royalty bill when it is raised (basis, type and
 * value are copied), so later changes to a centre's terms never rewrite a
 * month that is already billed.
 */
import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { PAYMENT_METHODS, centres, payments, royaltyInvoices, royaltyPayments, type Centre } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { addMonths, currentPeriod, periodLabel, periodRange, todayIST } from '@/lib/date';
import { inr, invoiceStatus, royaltyAmount } from '@/lib/money';
import { day, period as periodSchema, text, uuid } from '@/lib/validators';
import { assertAdmin, assertHq, getSetting, liveCentre, livePayment, royaltyTermsFor, total } from './shared';

/** The last month that is over: the one royalty is normally raised for. */
export const lastFinishedPeriod = () => addMonths(currentPeriod(), -1);

function dueDateFor(period: string, dueDay: number) {
  // Clamped to 28 so the date exists in every month.
  const d = Math.min(28, Math.max(1, Math.floor(dueDay) || 10));
  return `${addMonths(period, 1)}-${String(d).padStart(2, '0')}`;
}

/** Non-voided fee receipts of each centre with paidOn inside the month. */
async function collectionByCentre(db: DbOrTx, period: string, centreIds: string[]) {
  if (!centreIds.length) return new Map<string, number>();
  const { from, to } = periodRange(period);
  const rows = await db
    .select({ centreId: payments.centreId, amount: total(payments.amount) })
    .from(payments)
    .where(and(inArray(payments.centreId, centreIds), livePayment, gte(payments.paidOn, from), lte(payments.paidOn, to)))
    .groupBy(payments.centreId);
  return new Map(rows.map((row) => [row.centreId, row.amount]));
}

const runInput = z.object({ period: periodSchema, recalculate: z.boolean().default(false) });

export type RoyaltyRunResult = {
  period: string;
  created: number;
  /** Bills that already existed and were left as they are. */
  unchanged: number;
  recalculated: number;
  /** Unpaid bills whose amount no longer matches the month's collection. */
  stale: { id: string; centre: string; oldAmount: number; newAmount: number }[];
};

/**
 * Raises one royalty bill per active franchise centre for a finished month.
 * Safe to repeat: a centre already billed for the month is skipped (unique
 * centre + month). With `recalculate`, bills nobody has paid against yet are
 * brought in line with the month's collection.
 */
export async function runRoyalty(session: Session, input: z.input<typeof runInput>): Promise<RoyaltyRunResult> {
  assertHq(session);
  const data = runInput.parse(input);
  if (data.period >= currentPeriod()) throw new ApiError(400, 'Royalty can be raised only after the month is over');
  const db = await getDb();
  const { to } = periodRange(data.period);

  const result = await db.transaction(async (tx) => {
    const { dueDay } = await getSetting('royalty', tx);
    const eligible = (
      await tx
        .select()
        .from(centres)
        .where(and(liveCentre, eq(centres.status, 'active'), eq(centres.isCompanyOwned, false)))
        .orderBy(asc(centres.code))
    ).filter((centre) => !centre.openedOn || centre.openedOn <= to); // not open yet in that month: nothing to bill

    const ids = eligible.map((centre) => centre.id);
    const basis = await collectionByCentre(tx, data.period, ids);
    const existing = ids.length
      ? await tx.select().from(royaltyInvoices).where(and(eq(royaltyInvoices.period, data.period), inArray(royaltyInvoices.centreId, ids)))
      : [];
    const existingByCentre = new Map(existing.map((row) => [row.centreId, row]));

    const out: RoyaltyRunResult = { period: data.period, created: 0, unchanged: 0, recalculated: 0, stale: [] };
    const fresh: (typeof royaltyInvoices.$inferInsert)[] = [];

    for (const centre of eligible) {
      const terms = royaltyTermsFor(centre, data.period);
      const basisAmount = basis.get(centre.id) ?? 0;
      const amount = royaltyAmount(terms.type, terms.value, basisAmount);
      const bill = existingByCentre.get(centre.id);
      if (!bill) {
        fresh.push({
          centreId: centre.id,
          period: data.period,
          basisAmount,
          royaltyType: terms.type,
          royaltyValue: terms.value,
          amount,
          status: invoiceStatus(amount, 0),
          dueDate: dueDateFor(data.period, dueDay),
        });
        continue;
      }
      const differs = bill.amount !== amount || bill.basisAmount !== basisAmount;
      if (!differs || bill.paid > 0 || bill.status === 'cancelled') {
        out.unchanged += 1;
        continue;
      }
      if (data.recalculate) {
        await tx
          .update(royaltyInvoices)
          .set({ basisAmount, royaltyType: terms.type, royaltyValue: terms.value, amount, status: invoiceStatus(amount, 0) })
          .where(eq(royaltyInvoices.id, bill.id));
        out.recalculated += 1;
      } else {
        out.unchanged += 1;
        out.stale.push({ id: bill.id, centre: centre.name, oldAmount: bill.amount, newAmount: amount });
      }
    }

    if (fresh.length) {
      // The unique index is the last word if two people press the button together.
      const inserted = await tx.insert(royaltyInvoices).values(fresh).onConflictDoNothing().returning({ id: royaltyInvoices.id });
      out.created = inserted.length;
      out.unchanged += fresh.length - inserted.length;
    }
    return out;
  });

  if (result.created || result.recalculated) {
    await audit(session, 'royalty.run', {
      entity: 'royalty_invoice',
      summary: `Royalty for ${periodLabel(data.period)}: ${result.created} raised, ${result.recalculated} recalculated`,
      meta: { period: data.period },
    });
  }
  return result;
}

export type RoyaltyRow = {
  id: string;
  centreId: string;
  centreName: string;
  centreCode: string;
  ownerName: string;
  ownerPhone: string;
  period: string;
  basisAmount: number;
  royaltyType: Centre['royaltyType'];
  royaltyValue: number;
  amount: number;
  paid: number;
  balance: number;
  status: string;
  dueDate: string;
  overdue: boolean;
};

const rowColumns = {
  id: royaltyInvoices.id,
  centreId: royaltyInvoices.centreId,
  centreName: centres.name,
  centreCode: centres.code,
  ownerName: centres.ownerName,
  ownerPhone: centres.ownerPhone,
  period: royaltyInvoices.period,
  basisAmount: royaltyInvoices.basisAmount,
  royaltyType: royaltyInvoices.royaltyType,
  royaltyValue: royaltyInvoices.royaltyValue,
  amount: royaltyInvoices.amount,
  paid: royaltyInvoices.paid,
  status: royaltyInvoices.status,
  dueDate: royaltyInvoices.dueDate,
};

function decorate<T extends { amount: number; paid: number; dueDate: string; status: string }>(row: T, today: string) {
  const balance = row.status === 'cancelled' ? 0 : Math.max(0, row.amount - row.paid);
  return { ...row, balance, overdue: balance > 0 && row.dueDate < today };
}

/** Every royalty bill of one month, with totals, plus which centres are still to be billed. */
export async function listRoyalty(period: string) {
  const db = await getDb();
  const today = todayIST();
  const [rows, eligible] = await Promise.all([
    db
      .select(rowColumns)
      .from(royaltyInvoices)
      .innerJoin(centres, eq(centres.id, royaltyInvoices.centreId))
      .where(and(eq(royaltyInvoices.period, period), liveCentre))
      .orderBy(asc(centres.code)),
    db
      .select({ id: centres.id, name: centres.name, openedOn: centres.openedOn })
      .from(centres)
      .where(and(liveCentre, eq(centres.status, 'active'), eq(centres.isCompanyOwned, false))),
  ]);
  const list: RoyaltyRow[] = rows.map((row) => decorate(row, today));
  const billed = new Set(list.map((row) => row.centreId));
  const { to } = periodRange(period);
  const notRaised = eligible.filter((centre) => !billed.has(centre.id) && (!centre.openedOn || centre.openedOn <= to));
  const totals = list.reduce(
    (sum, row) => ({ basis: sum.basis + row.basisAmount, amount: sum.amount + row.amount, paid: sum.paid + row.paid, balance: sum.balance + row.balance }),
    { basis: 0, amount: 0, paid: 0, balance: 0 },
  );
  return { period, rows: list, totals, notRaised, canRaise: period < currentPeriod() };
}

/** Royalty still owed, across every month and centre. */
export async function royaltyOutstanding(db?: DbOrTx) {
  const conn = db ?? (await getDb());
  const [row] = await conn
    .select({ amount: total(sql`${royaltyInvoices.amount} - ${royaltyInvoices.paid}`) })
    .from(royaltyInvoices)
    .innerJoin(centres, eq(centres.id, royaltyInvoices.centreId))
    .where(and(liveCentre, inArray(royaltyInvoices.status, ['unpaid', 'partial'])));
  return row?.amount ?? 0;
}

const paymentInput = z.object({
  invoiceId: uuid,
  // No upper limit here: the balance of the bill is the limit, and that message says what is due.
  amount: z.coerce.number({ invalid_type_error: 'Enter the amount received' }).int('Whole rupees only').min(1, 'Enter the amount received'),
  method: z.enum(PAYMENT_METHODS).default('bank'),
  reference: text(80),
  paidOn: day,
});

/** Records money received against one royalty bill. Part payments are fine; more than the balance is not. */
export async function recordRoyaltyPayment(session: Session, input: z.input<typeof paymentInput>) {
  assertAdmin(session);
  const data = paymentInput.parse(input);
  if (data.paidOn > todayIST()) throw new ApiError(400, 'The payment date cannot be in the future', { paidOn: 'Pick today or an earlier date' });
  const db = await getDb();

  const saved = await db.transaction(async (tx) => {
    // Locked so two payments saved together cannot both pass the balance check.
    const [bill] = await tx.select().from(royaltyInvoices).where(eq(royaltyInvoices.id, data.invoiceId)).for('update');
    if (!bill) throw new ApiError(404, 'Royalty bill not found');
    if (bill.status === 'cancelled') throw new ApiError(400, 'This royalty bill is cancelled');
    const balance = bill.amount - bill.paid;
    if (data.amount > balance) {
      throw new ApiError(400, `Only ${inr(balance)} is due on this bill`, { amount: `Cannot be more than ${inr(balance)}` });
    }
    const [payment] = await tx
      .insert(royaltyPayments)
      .values({
        royaltyInvoiceId: bill.id,
        centreId: bill.centreId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        paidOn: data.paidOn,
        recordedBy: session.uid,
      })
      .returning();
    const paid = bill.paid + data.amount;
    const [updated] = await tx
      .update(royaltyInvoices)
      .set({ paid, status: invoiceStatus(bill.amount, paid) })
      .where(eq(royaltyInvoices.id, bill.id))
      .returning();
    return { payment, invoice: updated };
  });

  await audit(session, 'royalty.payment', {
    entity: 'royalty_payment',
    entityId: saved.payment.id,
    centreId: saved.invoice.centreId,
    summary: `${inr(data.amount)} royalty received for ${periodLabel(saved.invoice.period)}`,
  });
  return saved;
}

/** Marks a reversal row; the id of the payment it undoes follows the colon. */
const REVERSAL = 'reversal:';
export const isReversal = (reference: string) => reference.startsWith(REVERSAL);

/**
 * Undoes a royalty payment entered by mistake. The original row stays and a
 * matching minus entry is added, so the history of what was typed is kept
 * (royalty_payments has no voided column to mark instead).
 */
export async function voidRoyaltyPayment(session: Session, paymentId: string) {
  assertAdmin(session);
  const id = uuid.parse(paymentId);
  const db = await getDb();

  const saved = await db.transaction(async (tx) => {
    const [payment] = await tx.select().from(royaltyPayments).where(eq(royaltyPayments.id, id)).limit(1);
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (payment.amount <= 0) throw new ApiError(400, 'This entry is already a reversal');
    const [bill] = await tx.select().from(royaltyInvoices).where(eq(royaltyInvoices.id, payment.royaltyInvoiceId)).for('update');
    const [undone] = await tx
      .select({ id: royaltyPayments.id })
      .from(royaltyPayments)
      .where(and(eq(royaltyPayments.royaltyInvoiceId, payment.royaltyInvoiceId), eq(royaltyPayments.reference, `${REVERSAL}${payment.id}`)))
      .limit(1);
    if (undone) throw new ApiError(400, 'This payment has already been cancelled');

    await tx.insert(royaltyPayments).values({
      royaltyInvoiceId: payment.royaltyInvoiceId,
      centreId: payment.centreId,
      amount: -payment.amount,
      method: payment.method,
      reference: `${REVERSAL}${payment.id}`,
      paidOn: todayIST(),
      recordedBy: session.uid,
    });
    const paid = Math.max(0, bill.paid - payment.amount);
    await tx.update(royaltyInvoices).set({ paid, status: invoiceStatus(bill.amount, paid) }).where(eq(royaltyInvoices.id, bill.id));
    return { payment, bill };
  });

  await audit(session, 'royalty.payment.void', {
    entity: 'royalty_payment',
    entityId: saved.payment.id,
    centreId: saved.payment.centreId,
    summary: `Cancelled ${inr(saved.payment.amount)} royalty payment for ${periodLabel(saved.bill.period)}`,
  });
}

/** One centre's royalty, month by month, with every payment. Used by head office and by the centre head. */
export async function royaltyStatement(centreId: string) {
  const db = await getDb();
  const today = todayIST();
  const [[centre], bills, paid] = await Promise.all([
    db.select().from(centres).where(and(eq(centres.id, centreId), liveCentre)).limit(1),
    db.select().from(royaltyInvoices).where(eq(royaltyInvoices.centreId, centreId)).orderBy(desc(royaltyInvoices.period)),
    db.select().from(royaltyPayments).where(eq(royaltyPayments.centreId, centreId)).orderBy(desc(royaltyPayments.paidOn), desc(royaltyPayments.createdAt)),
  ]);
  if (!centre) throw new ApiError(404, 'School not found');

  const reversed = new Set(paid.filter((p) => isReversal(p.reference)).map((p) => p.reference.slice(REVERSAL.length)));
  const periodOfBill = new Map(bills.map((bill) => [bill.id, bill.period]));
  const rows = bills.map((bill) => decorate(bill, today));
  const live = rows.filter((row) => row.status !== 'cancelled');
  return {
    centre,
    rows,
    payments: paid.map((p) => ({
      id: p.id,
      period: periodOfBill.get(p.royaltyInvoiceId) ?? '',
      amount: p.amount,
      method: p.method,
      reference: isReversal(p.reference) ? 'Cancelled entry' : p.reference,
      paidOn: p.paidOn,
      reversal: isReversal(p.reference),
      reversed: reversed.has(p.id),
    })),
    totals: {
      amount: live.reduce((sum, row) => sum + row.amount, 0),
      paid: live.reduce((sum, row) => sum + row.paid, 0),
      balance: live.reduce((sum, row) => sum + row.balance, 0),
      overdue: live.filter((row) => row.overdue).reduce((sum, row) => sum + row.balance, 0),
    },
  };
}
