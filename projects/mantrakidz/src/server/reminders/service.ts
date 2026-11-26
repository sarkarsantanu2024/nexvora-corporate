/**
 * The reminder queue: WhatsApp messages to parents, waiting for someone at
 * the school to send them.
 *
 * Nothing is sent by the app. `fillQueue` (run by the daily job for every
 * school, and for one school whenever its Reminders screen opens) writes the
 * messages that are due; a person presses Send, their own WhatsApp opens with
 * the text ready, and the row is marked sent. The kinds live in ./kinds.ts.
 *
 * Every reminder belongs to one school. The school's screens only ever read
 * and change its own rows; the school is taken from the login, never from
 * the browser.
 */
import { and, desc, eq, inArray, lt, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { OUTBOX_STATUSES, messageOutbox, type OutboxStatus } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { uuid } from '@/lib/validators';
import { fillTemplate, waPhone } from '@/lib/wa';
import type { Ctx } from '../centre/money/shared';
import { PAGE_SIZE, assertAdmin, countInt, getSetting, pageOf, putSetting } from '../hq/shared';
import { REMINDER_KINDS, kindOf } from './kinds';

/** Sent and set-aside reminders are kept this long, so "who sent what" can be looked up. */
export const KEEP_DONE_DAYS = 60;
/** A reminder nobody sent for this long is out of date and removed. */
const KEEP_WAITING_DAYS = 45;
/** Written in "done by" when a reminder is set aside because it is no longer needed. */
export const NOT_NEEDED = 'Not needed any more';

const isStatus = (value: unknown): value is OutboxStatus => (OUTBOX_STATUSES as readonly unknown[]).includes(value);

export const kindEnabled = (settings: { enabled: Record<string, boolean> }, key: string) => settings.enabled[key] ?? kindOf(key)?.defaultOn ?? false;

export const wordingOf = (settings: { templates: Record<string, string> }, key: string) => settings.templates[key]?.trim() || kindOf(key)?.defaultTemplate || '';

/**
 * Queues what is due today and sets aside waiting reminders whose reason has
 * gone. Safe to run any number of times: a reminder already queued (in any
 * state) is never queued again.
 */
export async function fillQueue(options: { centreId?: string; today?: string } = {}): Promise<{ added: number; closed: number }> {
  const db = await getDb();
  const today = options.today ?? todayIST();
  const settings = await getSetting('reminders');
  let added = 0;
  for (const kind of REMINDER_KINDS) {
    if (!kindEnabled(settings, kind.key)) continue;
    const wording = wordingOf(settings, kind.key);
    const due = await kind.collect({ db, today, settings, centreId: options.centreId });
    const rows = due
      .filter((item) => waPhone(item.phone))
      .map((item) => ({
        centreId: item.centreId,
        kind: kind.key,
        dedupeKey: item.dedupeKey,
        toName: item.toName,
        phone: item.phone,
        body: fillTemplate(wording, item.values),
        entity: item.entity,
        entityId: item.entityId,
        href: item.href,
        dueOn: item.dueOn,
      }));
    // A school with hundreds of children: insert in slices so one statement stays small.
    for (let i = 0; i < rows.length; i += 200) {
      const inserted = await db.insert(messageOutbox).values(rows.slice(i, i + 200)).onConflictDoNothing({ target: messageOutbox.dedupeKey }).returning({ id: messageOutbox.id });
      added += inserted.length;
    }
  }
  return { added, closed: await closeResolved(options.centreId) };
}

/** Waiting reminders whose thing is dealt with (paid, marked present) are set aside by themselves. */
async function closeResolved(centreId?: string): Promise<number> {
  const db = await getDb();
  const school = centreId ? eq(messageOutbox.centreId, centreId) : undefined;
  let closed = 0;
  for (const kind of REMINDER_KINDS) {
    if (!kind.resolved) continue;
    const waiting = await db
      .select({ entityId: messageOutbox.entityId })
      .from(messageOutbox)
      .where(and(eq(messageOutbox.kind, kind.key), eq(messageOutbox.status, 'waiting'), school));
    const ids = [...new Set(waiting.map((row) => row.entityId).filter(Boolean))];
    if (!ids.length) continue;
    const done = await kind.resolved(db, ids);
    if (!done.length) continue;
    const rows = await db
      .update(messageOutbox)
      .set({ status: 'dismissed', doneAt: new Date(), doneByName: NOT_NEEDED })
      .where(and(eq(messageOutbox.kind, kind.key), eq(messageOutbox.status, 'waiting'), inArray(messageOutbox.entityId, done), school))
      .returning({ id: messageOutbox.id });
    closed += rows.length;
  }
  return closed;
}

/** Removes old rows so the table stays small. Run by the daily job. */
export async function cleanQueue(now = new Date()): Promise<number> {
  const db = await getDb();
  const doneBefore = new Date(now.getTime() - KEEP_DONE_DAYS * 86_400_000);
  const waitingBefore = new Date(now.getTime() - KEEP_WAITING_DAYS * 86_400_000);
  const rows = await db
    .delete(messageOutbox)
    .where(
      or(
        and(inArray(messageOutbox.status, ['sent', 'dismissed']), lt(messageOutbox.doneAt, doneBefore)),
        and(eq(messageOutbox.status, 'waiting'), lt(messageOutbox.createdAt, waitingBefore)),
      ),
    )
    .returning({ id: messageOutbox.id });
  return rows.length;
}

export type QueueFilters = { status?: string; kind?: string; page?: string | number };

export async function listQueue(ctx: Ctx, filters: QueueFilters = {}) {
  const db = await getDb();
  const status: OutboxStatus = isStatus(filters.status) ? filters.status : 'waiting';
  const page = pageOf(filters.page);
  const byKind: SQL | undefined = filters.kind && kindOf(filters.kind) ? eq(messageOutbox.kind, filters.kind) : undefined;
  const school = eq(messageOutbox.centreId, ctx.centre.id);
  const where = and(school, eq(messageOutbox.status, status), byKind);
  const [rows, [{ n }], statusRows] = await Promise.all([
    db
      .select()
      .from(messageOutbox)
      .where(where)
      // Waiting: oldest due first, so nothing slips. Done: the latest on top.
      .orderBy(...(status === 'waiting' ? [messageOutbox.dueOn, messageOutbox.createdAt] : [desc(messageOutbox.doneAt)]))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(messageOutbox).where(where),
    db.select({ status: messageOutbox.status, n: countInt() }).from(messageOutbox).where(and(school, byKind)).groupBy(messageOutbox.status),
  ]);
  const counts = Object.fromEntries(OUTBOX_STATUSES.map((key) => [key, 0])) as Record<OutboxStatus, number>;
  for (const row of statusRows) counts[row.status] = row.n;
  return { rows, total: n, page, pageSize: PAGE_SIZE, counts, status };
}

export async function countWaiting(centreId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db.select({ n: countInt() }).from(messageOutbox).where(and(eq(messageOutbox.centreId, centreId), eq(messageOutbox.status, 'waiting')));
  return row.n;
}

async function finish(ctx: Ctx, id: string, status: 'sent' | 'dismissed') {
  const db = await getDb();
  const [row] = await db
    .update(messageOutbox)
    .set({ status, doneAt: new Date(), doneBy: ctx.session.uid, doneByName: ctx.session.name })
    .where(and(eq(messageOutbox.id, uuid.parse(id)), eq(messageOutbox.centreId, ctx.centre.id), eq(messageOutbox.status, 'waiting')))
    .returning();
  if (!row) throw new ApiError(404, 'This reminder was already dealt with');
  await audit(ctx.session, status === 'sent' ? 'reminder.sent' : 'reminder.dismissed', {
    entity: 'reminder',
    entityId: row.id,
    centreId: ctx.centre.id,
    summary: status === 'sent' ? `Sent a WhatsApp reminder to ${row.toName}` : `Set aside the reminder for ${row.toName}`,
  });
  return row;
}

export const markSent = (ctx: Ctx, id: string) => finish(ctx, id, 'sent');
export const dismissReminder = (ctx: Ctx, id: string) => finish(ctx, id, 'dismissed');

/** Puts a sent or set-aside reminder back in the waiting list (pressed by mistake). */
export async function reopenReminder(ctx: Ctx, id: string) {
  const db = await getDb();
  const [row] = await db
    .update(messageOutbox)
    .set({ status: 'waiting', doneAt: null, doneBy: null, doneByName: '' })
    .where(and(eq(messageOutbox.id, uuid.parse(id)), eq(messageOutbox.centreId, ctx.centre.id), inArray(messageOutbox.status, ['sent', 'dismissed'])))
    .returning();
  if (!row) throw new ApiError(404, 'Reminder not found');
  return row;
}

/* ───────────── settings (head office): which kinds are on, and their wording ───────────── */

export async function loadReminderSettings() {
  const settings = await getSetting('reminders');
  return {
    daysBefore: settings.daysBefore,
    kinds: REMINDER_KINDS.map((kind) => ({
      key: kind.key,
      label: kind.label,
      description: kind.description,
      placeholders: kind.placeholders,
      defaultTemplate: kind.defaultTemplate,
      enabled: kindEnabled(settings, kind.key),
      template: wordingOf(settings, kind.key),
    })),
  };
}

const reminderInput = z.object({
  daysBefore: z.coerce.number({ invalid_type_error: 'Enter a number of days' }).int('Whole days only').min(1, 'At least 1 day').max(15, 'At most 15 days'),
  kinds: z.array(z.object({ key: z.string(), enabled: z.boolean(), template: z.string().trim().max(1000) })),
});

export async function saveReminderSettings(session: Session, input: z.input<typeof reminderInput>) {
  assertAdmin(session);
  const { daysBefore, kinds } = reminderInput.parse(input);
  const current = await getSetting('reminders');
  const next = { ...current, daysBefore, enabled: { ...current.enabled }, templates: { ...current.templates } };
  for (const item of kinds) {
    const kind = kindOf(item.key);
    if (!kind) continue;
    next.enabled[kind.key] = item.enabled;
    // Saving the default wording unchanged keeps it "default", so a better default later reaches this client too.
    next.templates[kind.key] = item.template === kind.defaultTemplate ? '' : item.template;
  }
  await putSetting('reminders', next);
  await audit(session, 'settings.reminders', { entity: 'settings', entityId: 'reminders', summary: 'Updated the reminder settings' });
}
