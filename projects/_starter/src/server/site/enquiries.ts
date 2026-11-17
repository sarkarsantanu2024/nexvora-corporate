/**
 * The public contact form. The function validates what the browser sent and
 * adds one row to `enquiries`. Nothing here needs a login.
 *
 * The schema is built per language, so a Bengali or Hindi visitor reads the
 * field errors in their own language. (The shared pieces in lib/validators
 * carry English messages only, which is why the phone and email rules are
 * repeated here with the same patterns.)
 *
 * A client that needs a second public form (a booking, a quote request) adds
 * its schema and save function here and a route under src/app/api/public.
 */
import { z } from 'zod';
import { getDict } from '@/components/site/i18n';
import { getDb } from '@/db';
import { enquiries } from '@/db/schema';
import { isLang, type Lang } from '@/lib/i18n';

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
  return { e, required, text, phone, email };
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

export async function createEnquiry(input: z.infer<ReturnType<typeof contactSchema>>) {
  const db = await getDb();
  const [row] = await db
    .insert(enquiries)
    .values({ name: input.name, phone: input.phone, email: input.email, subject: input.subject, message: input.message, source: 'website' })
    .returning({ id: enquiries.id });
  return row;
}
