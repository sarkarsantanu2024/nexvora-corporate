/**
 * Words and lists used by the money screens. No server imports, so client
 * forms can use them too.
 */
import type { FeeKind, PaymentMethod } from '@/db/schema';

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank: 'Bank transfer',
  cheque: 'Cheque',
  card: 'Card',
};

/** The methods in the order the forms list them. Client forms use this so they need not load the table definitions. */
export const METHODS = Object.keys(METHOD_LABELS) as PaymentMethod[];

/** These need a reference so the entry can be matched to the bank statement. */
export const METHODS_NEEDING_REFERENCE: PaymentMethod[] = ['upi', 'bank', 'cheque'];

export const REFERENCE_HINT: Record<PaymentMethod, string> = {
  cash: 'Optional',
  upi: 'UPI transaction number',
  bank: 'Bank transaction number',
  cheque: 'Cheque number and bank',
  card: 'Optional: last 4 digits or slip number',
};

export const FEE_KIND_LABELS: Record<FeeKind, string> = {
  monthly: 'Every month',
  one_time: 'One time',
  annual: 'Every year',
};

/** How collection is grouped in the income statement. */
export const FEE_TYPE_LABELS: Record<FeeKind | 'other', string> = {
  monthly: 'Monthly fees',
  one_time: 'One time fees',
  annual: 'Yearly charges',
  other: 'Other charges',
};

export const SALARY_CATEGORY = 'Salary';

export const EXPENSE_CATEGORIES = [
  'Rent',
  SALARY_CATEGORY,
  'Electricity',
  'Water and internet',
  'Teaching material',
  'Cleaning and upkeep',
  'Repairs',
  'Food and snacks',
  'Events and outings',
  'Printing and stationery',
  'Marketing',
  'Transport',
  'Royalty to head office',
  'Other',
] as const;

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

/** 125000 → 'Rupees one lakh twenty five thousand only' (lakh and crore, the way a receipt book reads). */
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
