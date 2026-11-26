/** Saving the money settings: how parents pay, fee rules and the expense categories. Head of school only. */
import { z } from 'zod';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { text } from '@/lib/validators';
import { assertAdmin, putSetting } from '../admin/shared';
import type { PaymentDetails } from './labels';

const paymentInput = z
  .object({
    upiId: z.union([z.literal(''), z.string().trim().regex(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/, 'Enter a UPI ID like name@bank')]).default(''),
    payeeName: text(80),
    qrImage: z.string().trim().max(500).default(''),
    accountName: text(100),
    accountNumber: z.union([z.literal(''), z.string().trim().regex(/^\d{6,18}$/, 'Enter the account number, digits only')]).default(''),
    ifsc: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(z.union([z.literal(''), z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter an 11 character IFSC like SBIN0001234')]))
      .default(''),
    bank: text(80),
    branch: text(80),
    note: text(300),
  })
  .superRefine((v, issue) => {
    // Half a bank account is of no use to a parent: number and IFSC go together.
    if (v.accountNumber && !v.ifsc) issue.addIssue({ code: 'custom', path: ['ifsc'], message: 'Enter the IFSC for this account' });
    if (v.ifsc && !v.accountNumber) issue.addIssue({ code: 'custom', path: ['accountNumber'], message: 'Enter the account number for this IFSC' });
  });
export type PaymentDetailsInput = z.input<typeof paymentInput>;

export async function savePaymentDetails(session: Session, input: PaymentDetailsInput): Promise<PaymentDetails> {
  assertAdmin(session);
  const data = paymentInput.parse(input);
  await putSetting('payment', data);
  await audit(session, 'settings.payment', {
    entity: 'settings',
    entityId: 'payment',
    summary: `Payment details changed: ${[data.upiId ? `UPI ${data.upiId}` : '', data.accountNumber ? `A/c ending ${data.accountNumber.slice(-4)}` : '', data.qrImage ? 'QR image' : ''].filter(Boolean).join(', ') || 'cleared'}`,
  });
  return data;
}

const feeInput = z.object({
  dueDays: z.coerce.number().int('Whole days only').min(0, 'Cannot be negative').max(365, 'A year at the most'),
  receiptFooter: text(200),
});

export async function saveFeeSettings(session: Session, input: z.input<typeof feeInput>) {
  assertAdmin(session);
  const data = feeInput.parse(input);
  await putSetting('fees', data);
  await audit(session, 'settings.fees', { entity: 'settings', entityId: 'fees', summary: `Fee settings: due ${data.dueDays} days after the bill` });
  return data;
}

const categoriesInput = z.object({
  categories: z.array(z.string().trim().min(1).max(60)).min(1, 'Keep at least one category').max(40),
});

export async function saveExpenseCategories(session: Session, input: z.input<typeof categoriesInput>) {
  assertAdmin(session);
  const data = categoriesInput.parse(input);
  // The same name twice would split one category's totals in two.
  const seen = new Set<string>();
  const categories = data.categories.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  await putSetting('expenses', { categories });
  await audit(session, 'settings.expenses', { entity: 'settings', entityId: 'expenses', summary: `Expense categories: ${categories.join(', ')}` });
  return { categories };
}
