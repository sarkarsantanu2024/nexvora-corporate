/**
 * The three public forms: admission enquiry, franchise enquiry, contact.
 * Each function validates what the browser sent and adds one row. Nothing
 * here needs a login.
 *
 * The schemas are built per language, so a Bengali or Hindi visitor reads the
 * field errors in their own language. (The shared pieces in lib/validators
 * carry English messages only, which is why the phone, email and date rules
 * are repeated here with the same patterns.)
 */
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { getDict } from '@/components/site/i18n';
import { getDb } from '@/db';
import { admissionEnquiries, centres, contactMessages, franchiseLeads, programmes } from '@/db/schema';
import { todayIST } from '@/lib/date';
import { isLang, type Lang } from '@/lib/i18n';

/** What a franchise enquirer can pick for "how much do you plan to invest". Stored in English whatever the visitor's language. */
export const INVESTMENT_RANGES = ['Below 5 lakh', '5 to 8 lakh', '8 to 12 lakh', '12 lakh and above', 'Not sure yet'] as const;

/** The language the form was filled in, sent along in the body. Anything odd counts as English. */
export function bodyLang(body: unknown): Lang {
  const value = typeof body === 'object' && body !== null ? (body as { lang?: unknown }).lang : undefined;
  return typeof value === 'string' && isLang(value) ? value : 'en';
}

/**
 * A hidden field no person fills in. A bot that fills every field gives
 * itself away; we answer "thank you" and store nothing.
 */
const honeypot = z.string().max(200).optional();
export const isBot = (input: { website?: string }) => Boolean(input.website?.trim());

/** The zod pieces, with messages in one language. */
function pieces(lang: Lang) {
  const e = getDict(lang).errors;
  const required = (message: string, max = 80) => z.string({ required_error: message, invalid_type_error: message }).trim().min(1, message).max(max, e.tooLong);
  const text = (max = 200) => z.string().trim().max(max, e.tooLong).default('');
  /** Accepts +91 / 0 prefixes and spaces; always yields the bare 10 digits. */
  const phone = z
    .string({ required_error: e.phoneRequired, invalid_type_error: e.phoneRequired })
    .trim()
    .min(1, e.phoneRequired)
    .transform((v) => v.replace(/[\s\-()]/g, ''))
    .pipe(z.string().regex(/^(\+?91|0)?[6-9]\d{9}$/, e.phone))
    .transform((v) => v.slice(-10));
  const email = z.union([z.literal(''), z.string().trim().max(120, e.tooLong).email(e.email)], { errorMap: () => ({ message: e.email }) }).default('');
  /** '' or missing becomes null */
  const optionalDay = z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, e.date), z.null(), z.undefined()], { errorMap: () => ({ message: e.date }) })
    .transform((v) => v || null);
  const optionalUuid = z.union([z.literal(''), z.string().uuid(), z.null(), z.undefined()]).transform((v) => v || null);
  return { e, required, text, phone, email, optionalDay, optionalUuid };
}

export const admissionSchema = (lang: Lang) => {
  const p = pieces(lang);
  return z.object({
    childName: p.required(p.e.childName),
    dob: p.optionalDay.refine((v) => !v || v <= todayIST(), p.e.dobFuture),
    programmeId: p.optionalUuid,
    centreId: p.optionalUuid,
    parentName: p.required(p.e.yourName),
    phone: p.phone,
    email: p.email,
    area: p.text(80),
    message: p.text(1000),
    website: honeypot,
  });
};

export async function createAdmissionEnquiry(input: z.infer<ReturnType<typeof admissionSchema>>) {
  const db = await getDb();

  // Ids come from the browser: keep them only when they point at something a visitor is allowed to pick.
  let programmeId: string | null = null;
  if (input.programmeId) {
    const [row] = await db
      .select({ id: programmes.id })
      .from(programmes)
      .where(and(eq(programmes.id, input.programmeId), eq(programmes.active, true)));
    programmeId = row?.id ?? null;
  }
  let centreId: string | null = null;
  if (input.centreId) {
    const [row] = await db
      .select({ id: centres.id })
      .from(centres)
      .where(
        and(
          eq(centres.id, input.centreId),
          eq(centres.showOnWebsite, true),
          isNull(centres.deletedAt),
          inArray(centres.status, ['active', 'onboarding']),
        ),
      );
    centreId = row?.id ?? null;
  }

  const [row] = await db
    .insert(admissionEnquiries)
    .values({
      centreId,
      childName: input.childName,
      dob: input.dob,
      programmeId,
      parentName: input.parentName,
      phone: input.phone,
      email: input.email,
      area: input.area,
      message: input.message,
      source: 'website',
    })
    .returning({ id: admissionEnquiries.id });
  return row;
}

export const franchiseSchema = (lang: Lang) => {
  const p = pieces(lang);
  return z.object({
    name: p.required(p.e.yourName),
    phone: p.phone,
    email: p.email,
    city: p.required(p.e.city),
    state: p.text(80),
    occupation: p.text(120),
    investmentRange: z.union([z.literal(''), z.enum(INVESTMENT_RANGES)], { errorMap: () => ({ message: p.e.check }) }).default(''),
    hasSpace: z.enum(['', 'yes', 'no'], { errorMap: () => ({ message: p.e.check }) }).default(''),
    spaceSqft: z
      .union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(1).max(1_000_000)], { errorMap: () => ({ message: p.e.sqft }) })
      .transform((v) => (typeof v === 'number' ? v : null)),
    message: p.text(1000),
    website: honeypot,
  });
};

export async function createFranchiseLead(input: z.infer<ReturnType<typeof franchiseSchema>>) {
  const db = await getDb();
  const hasSpace = input.hasSpace === '' ? null : input.hasSpace === 'yes';
  const [row] = await db
    .insert(franchiseLeads)
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email,
      city: input.city,
      state: input.state,
      occupation: input.occupation,
      investmentRange: input.investmentRange,
      hasSpace,
      spaceSqft: hasSpace ? input.spaceSqft : null,
      message: input.message,
      source: 'website',
    })
    .returning({ id: franchiseLeads.id });
  return row;
}

export const contactSchema = (lang: Lang) => {
  const p = pieces(lang);
  return z.object({
    name: p.required(p.e.yourName),
    phone: p.phone,
    email: p.email,
    subject: p.text(120),
    message: p.required(p.e.message, 2000),
    website: honeypot,
  });
};

export async function createContactMessage(input: z.infer<ReturnType<typeof contactSchema>>) {
  const db = await getDb();
  const [row] = await db
    .insert(contactMessages)
    .values({ name: input.name, phone: input.phone, email: input.email, subject: input.subject, message: input.message })
    .returning({ id: contactMessages.id });
  return row;
}
