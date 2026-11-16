/** Money is whole rupees everywhere. These are the only sums done on it. */
import type { InvoiceStatus, RoyaltyType } from '@/db/schema';

/** 125000 → '₹1,25,000' */
export const inr = (amount: number | null | undefined) => `₹${Math.round(amount ?? 0).toLocaleString('en-IN')}`;

/** 125000 → '₹1.25 L' for chart axes and tiles. */
export function inrShort(amount: number): string {
  const n = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (n >= 1_00_00_000) return `${sign}₹${(n / 1_00_00_000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  if (n >= 1_00_000) return `${sign}₹${(n / 1_00_000).toFixed(2).replace(/\.?0+$/, '')} L`;
  if (n >= 1_000) return `${sign}₹${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${sign}₹${n}`;
}

/** Status of a bill from what it is for and what has been paid. */
export function invoiceStatus(total: number, paid: number): InvoiceStatus {
  if (paid <= 0) return total <= 0 ? 'paid' : 'unpaid';
  return paid >= total ? 'paid' : 'partial';
}

export const balanceOf = (row: { total: number; paid: number }) => Math.max(0, row.total - row.paid);

/** Royalty for one month. Percent is of the month's fee collection. */
export function royaltyAmount(type: RoyaltyType, value: number, collection: number): number {
  return type === 'fixed' ? Math.max(0, value) : Math.round((Math.max(0, collection) * value) / 100);
}

/** 45 of 60 → 75. Zero when there is nothing to divide by. */
export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/**
 * Spread one payment over several unpaid bills, oldest first.
 * Returns how much goes to each bill and what is left over.
 */
export function allocatePayment(amount: number, bills: { id: string; balance: number }[]) {
  let left = Math.max(0, Math.round(amount));
  const parts: { id: string; amount: number }[] = [];
  for (const bill of bills) {
    if (left <= 0) break;
    const take = Math.min(left, Math.max(0, bill.balance));
    if (take > 0) parts.push({ id: bill.id, amount: take });
    left -= take;
  }
  return { parts, unallocated: left };
}
