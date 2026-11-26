/**
 * The kinds of WhatsApp reminder this app can queue. Each one says what is
 * due today and, optionally, which waiting reminders are no longer needed.
 *
 * ADDING YOUR OWN (a business module: fee due, birthday, order ready)
 *   1. Write a ReminderKind like `enquiryReply` below. `collect` returns what
 *      is due today; give each a `dedupeKey` that names the thing and the
 *      occasion ('fee_due:<billId>', 'birthday:<childId>:<year>'), so the same
 *      reminder is never queued twice however often the job runs.
 *   2. If the reason can go away (the fee was paid), write `resolved`: the
 *      waiting reminders whose thing is dealt with are set aside by themselves.
 *   3. Add it to REMINDER_KINDS at the bottom. The queue, the Settings card
 *      (switch and wording) and the daily job pick it up.
 *   4. Add its label, description and default wording to src/i18n/ui-hi.ts
 *      and ui-bn.ts (the wording itself is the owner's to change).
 */
import { and, eq, gte, inArray, isNull, ne, or, isNotNull } from 'drizzle-orm';
import type { DB } from '@/db';
import { enquiries } from '@/db/schema';
import { addDays, todayIST } from '@/lib/date';
import type { ReminderSettings } from '../admin/shared';

export type ReminderCandidate = {
  dedupeKey: string;
  toName: string;
  phone: string;
  /** The words that fill the {placeholders} of the wording. */
  values: Record<string, string | number>;
  entity: string;
  entityId: string;
  /** The screen where the thing itself is seen. */
  href: string;
  dueOn: string;
};

export type ReminderContext = { db: DB; today: string; settings: ReminderSettings; business: string };

export type ReminderKind = {
  key: string;
  /** English; the screens pass it through t(). */
  label: string;
  description: string;
  defaultTemplate: string;
  /** The {words} the wording may use, shown under the box on the Settings screen. */
  placeholders: string[];
  defaultOn: boolean;
  collect: (ctx: ReminderContext) => Promise<ReminderCandidate[]>;
  /** Of these entity ids, the ones whose reminder is no longer needed. */
  resolved?: (db: DB, entityIds: string[]) => Promise<string[]>;
};

/** How long after an enquiry arrives a thank-you still makes sense. */
const REPLY_WITHIN_DAYS = 3;

/** A first reply to someone who wrote from the website's contact form. */
const enquiryReply: ReminderKind = {
  key: 'enquiry_reply',
  label: 'Reply to a new enquiry',
  description: 'A thank-you on WhatsApp to each person who writes from the website, while the enquiry is still new.',
  defaultTemplate: 'Namaste {name}, thank you for your message to {business}. We will call you soon. You can also reply here on WhatsApp.',
  placeholders: ['name', 'business'],
  defaultOn: true,
  async collect({ db, today, business }) {
    const since = new Date(`${addDays(today, -REPLY_WITHIN_DAYS)}T00:00:00+05:30`);
    const rows = await db
      .select({ id: enquiries.id, name: enquiries.name, phone: enquiries.phone })
      .from(enquiries)
      .where(and(eq(enquiries.status, 'new'), isNull(enquiries.deletedAt), ne(enquiries.phone, ''), gte(enquiries.createdAt, since)));
    return rows.map((row) => ({
      dedupeKey: `enquiry_reply:${row.id}`,
      toName: row.name,
      phone: row.phone,
      values: { name: row.name.split(' ')[0] || row.name, business },
      entity: 'enquiry',
      entityId: row.id,
      href: `/admin/enquiries/${row.id}`,
      dueOn: todayIST(),
    }));
  },
  // Once someone has answered (or the enquiry went to the Trash), the thank-you is no longer needed.
  async resolved(db, ids) {
    if (!ids.length) return [];
    const rows = await db
      .select({ id: enquiries.id })
      .from(enquiries)
      .where(and(inArray(enquiries.id, ids), or(ne(enquiries.status, 'new'), isNotNull(enquiries.deletedAt))));
    const gone = new Set(rows.map((row) => row.id));
    // An id that no longer exists at all is resolved too.
    const still = await db.select({ id: enquiries.id }).from(enquiries).where(inArray(enquiries.id, ids));
    const present = new Set(still.map((row) => row.id));
    return ids.filter((id) => gone.has(id) || !present.has(id));
  },
};

/** Every kind, in the order the Settings screen shows them. A business module adds its own here. */
export const REMINDER_KINDS: ReminderKind[] = [enquiryReply];

export const kindOf = (key: string) => REMINDER_KINDS.find((kind) => kind.key === key);
