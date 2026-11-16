/** Saving a centre's UPI and bank details (managers only). Reading is in payment-info.ts. */
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { centres } from '@/db/schema';
import { audit } from '@/lib/audit';
import { text } from '@/lib/validators';
import type { PaymentDetails } from './payment-info';
import { assertManager, type Ctx } from './shared';

const paymentInput = z.object({
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
});
export type PaymentDetailsInput = z.input<typeof paymentInput>;

export async function savePaymentDetails(ctx: Ctx, input: PaymentDetailsInput): Promise<PaymentDetails> {
  assertManager(ctx);
  const data = paymentInput
    .superRefine((v, issue) => {
      // Half a bank account is of no use to a parent: number and IFSC go together.
      if (v.accountNumber && !v.ifsc) issue.addIssue({ code: 'custom', path: ['ifsc'], message: 'Enter the IFSC for this account' });
      if (v.ifsc && !v.accountNumber) issue.addIssue({ code: 'custom', path: ['accountNumber'], message: 'Enter the account number for this IFSC' });
    })
    .parse(input);
  const db = await getDb();
  // Merged in the database, so other things kept in meta (royalty history and so on) are never overwritten.
  await db
    .update(centres)
    .set({ meta: sql`${centres.meta} || ${JSON.stringify({ payment: data })}::jsonb`, updatedAt: new Date() })
    .where(eq(centres.id, ctx.centre.id));
  await audit(ctx.session, 'centre.payment_details', {
    entity: 'centre',
    entityId: ctx.centre.id,
    centreId: ctx.centre.id,
    summary: `Payment details changed: ${[data.upiId ? `UPI ${data.upiId}` : '', data.accountNumber ? `A/c ending ${data.accountNumber.slice(-4)}` : '', data.qrImage ? 'QR image' : ''].filter(Boolean).join(', ') || 'cleared'}`,
  });
  return data;
}
