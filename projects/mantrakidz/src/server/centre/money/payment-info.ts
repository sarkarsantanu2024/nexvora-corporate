/**
 * How parents pay a centre: UPI and bank details kept in centres.meta.payment.
 * There is no payment gateway; a parent pays from their own app and the
 * centre records the receipt. No server imports, so screens of any kind can
 * read and format the details.
 */
export type PaymentDetails = {
  upiId: string;
  payeeName: string;
  /** Uploaded QR picture; when empty a "Pay by UPI" link is shown instead. */
  qrImage: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bank: string;
  branch: string;
  note: string;
};

export const EMPTY_PAYMENT: PaymentDetails = {
  upiId: '',
  payeeName: '',
  qrImage: '',
  accountName: '',
  accountNumber: '',
  ifsc: '',
  bank: '',
  branch: '',
  note: '',
};

/** Reads the details off a centre row, whatever state meta is in. */
export function paymentDetailsOf(centre: { meta: Record<string, unknown> | null }): PaymentDetails {
  const stored = centre.meta && typeof centre.meta.payment === 'object' && centre.meta.payment !== null ? (centre.meta.payment as Record<string, unknown>) : {};
  const out = { ...EMPTY_PAYMENT };
  for (const key of Object.keys(EMPTY_PAYMENT) as (keyof PaymentDetails)[]) {
    if (typeof stored[key] === 'string') out[key] = stored[key] as string;
  }
  return out;
}

export const hasBank = (d: PaymentDetails) => Boolean(d.accountNumber && d.ifsc);
export const hasPaymentDetails = (d: PaymentDetails) => Boolean(d.upiId || d.qrImage || hasBank(d));

/** Opens the parent's UPI app with the payee, amount and bill number filled in. Works on phones. */
export function upiPayLink(d: PaymentDetails, amount: number, note: string, fallbackPayee = ''): string {
  if (!d.upiId) return '';
  const params = new URLSearchParams({ pa: d.upiId, pn: d.payeeName || fallbackPayee });
  if (amount > 0) params.set('am', String(Math.round(amount)));
  params.set('cu', 'INR');
  if (note) params.set('tn', note.slice(0, 50));
  // UPI apps want %20, not +, for spaces.
  return `upi://pay?${params.toString().replace(/\+/g, '%20')}`;
}

/** Lines added to the WhatsApp fee reminder. Empty when nothing is set up. */
export function paymentText(d: PaymentDetails): string {
  const lines: string[] = [];
  if (d.upiId) lines.push(`Pay by UPI: ${d.upiId}${d.payeeName ? ` (${d.payeeName})` : ''}`);
  if (hasBank(d)) {
    lines.push(
      `Bank transfer: ${[d.accountName, `A/c ${d.accountNumber}`, `IFSC ${d.ifsc}`, [d.bank, d.branch].filter(Boolean).join(', ')].filter(Boolean).join(', ')}`,
    );
  }
  if (lines.length) lines.push('After paying, please send the screenshot here.');
  return lines.join('\n');
}
