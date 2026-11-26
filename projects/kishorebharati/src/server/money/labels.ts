/**
 * Words, lists and small helpers of the money screens. No server imports, so
 * client forms and the parents' corner can use them too.
 */
import type { FeeKind, PaymentMethod } from '@/db/schema';

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank: 'Bank transfer',
  cheque: 'Cheque',
};

/** The methods in the order the forms list them. */
export const METHODS = Object.keys(METHOD_LABELS) as PaymentMethod[];

/** These need a reference so the entry can be matched with the bank statement. */
export const METHODS_NEEDING_REFERENCE: PaymentMethod[] = ['upi', 'bank', 'cheque'];

export const REFERENCE_HINT: Record<PaymentMethod, string> = {
  cash: 'Optional',
  upi: 'UPI transaction number',
  bank: 'Bank transaction number',
  cheque: 'Cheque number and bank',
};

export const FEE_KIND_LABELS: Record<FeeKind, string> = {
  annual: 'Once a year',
  monthly: 'Every month',
  one_time: 'One time',
};

/** Bill status words as people say them (the code word 'partial' reads badly). */
export const BILL_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  partial: 'Part paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const isOpenStatus = (status: string) => status === 'unpaid' || status === 'partial';

/** What a bill's status is for a total and what has come in. */
export function invoiceStatus(total: number, paid: number): 'unpaid' | 'partial' | 'paid' {
  if (paid <= 0) return total <= 0 ? 'paid' : 'unpaid';
  return paid >= total ? 'paid' : 'partial';
}

/**
 * Spreads a payment over bills in the order given (oldest first). Every rupee
 * lands somewhere; nothing is spread past a bill's balance.
 */
export function allocatePayment(amount: number, bills: { id: string; balance: number }[]): { parts: { id: string; amount: number }[]; left: number } {
  let left = Math.max(0, Math.floor(amount));
  const parts: { id: string; amount: number }[] = [];
  for (const bill of bills) {
    if (left <= 0) break;
    const take = Math.min(left, Math.max(0, bill.balance));
    if (take <= 0) continue;
    parts.push({ id: bill.id, amount: take });
    left -= take;
  }
  return { parts, left };
}

/**
 * A bill's period as people say it: '2026' is the year 2026, '2026-04' is
 * Apr 2026, null is a one-off bill (shown by its title).
 */
export function billPeriodLabel(period: string | null): string {
  if (!period) return '';
  if (/^\d{4}$/.test(period)) return period;
  const [y, m] = period.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[(m ?? 1) - 1]} ${y}`;
}

/* ───────────── how parents pay ───────────── */

/** UPI and bank details kept in the `payment` setting. There is no payment gateway. */
export type PaymentDetails = {
  upiId: string;
  payeeName: string;
  /** Uploaded QR picture; when empty a "Pay by UPI app" link is offered instead. */
  qrImage: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bank: string;
  branch: string;
  note: string;
};

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

/** Lines added to a WhatsApp fee reminder, in Bengali like the reminder itself. Empty when nothing is set up. */
export function paymentText(d: PaymentDetails): string {
  const lines: string[] = [];
  if (d.upiId) lines.push(`ইউপিআই-তে দিতে পারেন: ${d.upiId}${d.payeeName ? ` (${d.payeeName})` : ''}`);
  if (hasBank(d)) {
    lines.push(`ব্যাংকে জমা: ${[d.accountName, `A/c ${d.accountNumber}`, `IFSC ${d.ifsc}`, [d.bank, d.branch].filter(Boolean).join(', ')].filter(Boolean).join(', ')}`);
  }
  if (lines.length) lines.push('জমা দেওয়ার পর স্ক্রিনশট এখানে পাঠান।');
  return lines.join('\n');
}

/* ───────────── amount in words ───────────── */

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} hundred` : '', rest ? twoDigits(rest) : ''].filter(Boolean).join(' ');
}

/** 125000 → 'Rupees one lakh twenty five thousand only', the way a receipt book reads. */
export function rupeesInWords(amount: number): string {
  const n = Math.max(0, Math.round(amount));
  if (n === 0) return 'Rupees zero only';
  const crore = Math.floor(n / 1_00_00_000);
  const lakh = Math.floor((n % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((n % 1_00_000) / 1_000);
  const rest = n % 1_000;
  const words = [
    crore ? `${crore < 1000 ? threeDigits(crore) : crore} crore` : '',
    lakh ? `${twoDigits(lakh)} lakh` : '',
    thousand ? `${twoDigits(thousand)} thousand` : '',
    rest ? threeDigits(rest) : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `Rupees ${words} only`;
}
