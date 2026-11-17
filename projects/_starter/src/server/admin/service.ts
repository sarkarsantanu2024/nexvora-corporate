/**
 * The overview, the settings and the activity log.
 * Every figure is a count query; nothing here loads rows to add them up.
 */
import { and, desc, eq, gte, like, lt, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { announcements, auditLog, enquiries, galleryItems, users } from '@/db/schema';
import { audit } from '@/lib/audit';
import { addDays, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day, optionalEmail, optionalPhone, requiredText, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, getSetting, pageOf, putSetting } from './shared';

/* ───────────── overview ───────────── */

export async function getOverview() {
  const db = await getDb();
  const [[open], [allEnquiries], [notices], [photos], [logins], latest, activity] = await Promise.all([
    db.select({ n: countInt() }).from(enquiries).where(eq(enquiries.status, 'new')),
    db.select({ n: countInt() }).from(enquiries),
    db.select({ n: countInt() }).from(announcements),
    db.select({ n: countInt() }).from(galleryItems),
    db.select({ n: countInt() }).from(users).where(eq(users.active, true)),
    db
      .select({ id: enquiries.id, name: enquiries.name, phone: enquiries.phone, subject: enquiries.subject, message: enquiries.message, status: enquiries.status, createdAt: enquiries.createdAt })
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt))
      .limit(5),
    db
      .select({ id: auditLog.id, userName: auditLog.userName, action: auditLog.action, summary: auditLog.summary, createdAt: auditLog.createdAt })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(8),
  ]);
  return {
    tiles: { newEnquiries: open.n, enquiries: allEnquiries.n, notices: notices.n, photos: photos.n, users: logins.n },
    latest,
    activity,
  };
}

/* ───────────── settings ───────────── */

const orgInput = z.object({ name: requiredText('Name', 80), legalName: text(160), phone: optionalPhone, email: optionalEmail, address: text(300) });

export async function loadSettings() {
  return { org: await getSetting('org') };
}

export async function saveOrgSettings(session: Session, input: z.input<typeof orgInput>) {
  assertAdmin(session);
  await putSetting('org', orgInput.parse(input));
  await audit(session, 'settings.org', { entity: 'settings', entityId: 'org', summary: 'Updated the business details' });
}

/* ───────────── activity log ───────────── */

export type AuditFilters = { user?: string; action?: string; from?: string; to?: string; page?: string | number };

export async function listAudit(session: Session, filters: AuditFilters = {}) {
  assertAdmin(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const where: (SQL | undefined)[] = [];
  if (filters.user && uuid.safeParse(filters.user).success) where.push(eq(auditLog.userId, filters.user));
  // "enquiry" finds enquiry.status, enquiry.note and so on. Wildcards typed by the person are taken literally.
  const prefix = filters.action?.trim().replace(/[%_\\]/g, '');
  if (prefix) where.push(like(auditLog.action, `${prefix}%`));
  const isDay = (value?: string) => Boolean(value && day.safeParse(value).success);
  // The log is kept in UTC; a day picked on screen is an India day.
  if (isDay(filters.from)) where.push(gte(auditLog.createdAt, new Date(`${filters.from}T00:00:00+05:30`)));
  if (isDay(filters.to)) where.push(lt(auditLog.createdAt, new Date(`${addDays(filters.to as string, 1)}T00:00:00+05:30`)));
  const cond = where.length ? and(...where) : undefined;

  const [rows, [{ n }], people, kinds] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(cond)
      .orderBy(desc(auditLog.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(auditLog).where(cond),
    db
      .select({ id: auditLog.userId, name: sql<string>`max(${auditLog.userName})` })
      .from(auditLog)
      .where(sql`${auditLog.userId} is not null`)
      .groupBy(auditLog.userId)
      .orderBy(sql`max(${auditLog.userName})`),
    // The first word of each action ("enquiry", "user"), for the filter list.
    db
      .select({ kind: sql<string>`split_part(${auditLog.action}, '.', 1)` })
      .from(auditLog)
      .groupBy(sql`split_part(${auditLog.action}, '.', 1)`)
      .orderBy(sql`split_part(${auditLog.action}, '.', 1)`),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE, people, kinds: kinds.map((row) => row.kind), today: todayIST() };
}
