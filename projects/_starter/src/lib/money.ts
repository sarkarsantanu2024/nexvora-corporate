/** Money is whole rupees everywhere. These are the ways it is written out. */

/** 125000 becomes '₹1,25,000' */
export const inr = (amount: number | null | undefined) => `₹${Math.round(amount ?? 0).toLocaleString('en-IN')}`;

/** 125000 becomes '₹1.25 L', for chart axes and tiles. */
export function inrShort(amount: number): string {
  const n = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (n >= 1_00_00_000) return `${sign}₹${(n / 1_00_00_000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  if (n >= 1_00_000) return `${sign}₹${(n / 1_00_000).toFixed(2).replace(/\.?0+$/, '')} L`;
  if (n >= 1_000) return `${sign}₹${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${sign}₹${n}`;
}
