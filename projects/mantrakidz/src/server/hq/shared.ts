/**
 * Pieces every head office service uses: the admin check, settings access,
 * notes, and the SQL fragments that keep totals consistent across screens.
 */
import { and, desc, eq, isNull, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { getDb, type DbOrTx } from '@/db';
import { activityNotes, centres, payments, settings, type Centre, type RoyaltyType } from '@/db/schema';
import { ApiError } from '@/lib/api';
import type { Session } from '@/lib/auth';
import { requiredText } from '@/lib/validators';

export const isAdmin = (session: Session) => session.role === 'hq_admin';

/** Checked in the service, so hiding a button is never the only guard. */
export function assertAdmin(session: Session) {
  if (!isAdmin(session)) throw new ApiError(403, 'Only a head office admin can do this');
}

export function assertHq(session: Session) {
  if (session.role !== 'hq_admin' && session.role !== 'hq_staff') throw new ApiError(403, 'Only head office can do this');
}

/** Centres that have not been deleted. */
export const liveCentre = isNull(centres.deletedAt);

/** Fee receipts that count: voided ones are left out of every total. */
export const livePayment = isNull(payments.voidedAt);

/** sum() that comes back as a JavaScript number and never as null. */
export const total = (expr: AnyColumn | SQL) => sql<number>`coalesce(sum(${expr}), 0)::int`;
export const countInt = () => sql<number>`count(*)::int`;
/** 'YYYY-MM' of a date column, for group by month. */
export const monthOf = (column: AnyColumn) => sql<string>`to_char(${column}, 'YYYY-MM')`;

export const PAGE_SIZE = 25;
export const pageOf = (value: unknown) => Math.max(1, Math.floor(Number(value)) || 1);

/* ───────────── settings ───────────── */

export type OrgSettings = { name: string; legalName: string; phone: string; email: string; address: string };
export type RoyaltySettings = { dueDay: number };
export type FeeSettings = { dueDay: number; reminderTemplate: string; receiptFooter: string };

/** Set by Nexvora only (src/server/platform.ts). Plain strings here so this file needs nothing from there. */
export type PlatformSettings = { plan: 'website' | 'panel' | 'platinum'; status: 'active' | 'suspended'; note: string; changedAt: string };

/** Which reminders are switched on, their wording, and how many days before a due date (src/server/reminders). Empty wording means the default. */
export type ReminderSettings = { enabled: Record<string, boolean>; templates: Record<string, string>; daysBefore: number };

/** When the daily job last ran and what it did (src/server/jobs.ts). */
export type JobsSettings = { lastRunAt: string; lastResult: string[] };

export const SETTING_DEFAULTS = {
  org: { name: 'Mantra Kidz', legalName: '', phone: '', email: '', address: '' } as OrgSettings,
  royalty: { dueDay: 10 } as RoyaltySettings,
  fees: { dueDay: 10, reminderTemplate: '', receiptFooter: '' } as FeeSettings,
  platform: { plan: 'platinum', status: 'active', note: '', changedAt: '' } as PlatformSettings,
  reminders: { enabled: {}, templates: {}, daysBefore: 3 } as ReminderSettings,
  jobs: { lastRunAt: '', lastResult: [] } as JobsSettings,
};
type SettingKey = keyof typeof SETTING_DEFAULTS;

export async function getSetting<K extends SettingKey>(key: K, db?: DbOrTx): Promise<(typeof SETTING_DEFAULTS)[K]> {
  const conn = db ?? (await getDb());
  const [row] = await conn.select().from(settings).where(eq(settings.key, key)).limit(1);
  const stored = row && typeof row.value === 'object' && row.value !== null ? (row.value as object) : {};
  return { ...SETTING_DEFAULTS[key], ...stored };
}

export async function putSetting<K extends SettingKey>(key: K, value: (typeof SETTING_DEFAULTS)[K], db?: DbOrTx) {
  const conn = db ?? (await getDb());
  await conn
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

/* ───────────── royalty terms over time ───────────── */

export type RoyaltyTerm = { from: string; type: RoyaltyType; value: number };

/**
 * A change of royalty terms applies from the month it is made in, never to
 * months already over. The history sits in centres.meta.royaltyTerms; the
 * columns on the centre always hold the terms in force now.
 */
export function royaltyTermsFor(centre: Pick<Centre, 'royaltyType' | 'royaltyValue' | 'meta'>, period: string): { type: RoyaltyType; value: number } {
  const history = Array.isArray(centre.meta?.royaltyTerms) ? (centre.meta.royaltyTerms as RoyaltyTerm[]) : [];
  const match = history
    .filter((term) => term.from <= period)
    .sort((a, b) => (a.from < b.from ? 1 : -1))[0];
  return match ? { type: match.type, value: match.value } : { type: centre.royaltyType, value: centre.royaltyValue };
}

export const royaltyRateLabel = (type: RoyaltyType, value: number) =>
  type === 'fixed' ? `₹${value.toLocaleString('en-IN')} a month` : `${value}% of collection`;

/* ───────────── notes ───────────── */

type NoteEntity = 'franchise_lead' | 'centre';

export async function listNotes(entityType: NoteEntity, entityId: string) {
  const db = await getDb();
  return db
    .select()
    .from(activityNotes)
    .where(and(eq(activityNotes.entityType, entityType), eq(activityNotes.entityId, entityId)))
    .orderBy(desc(activityNotes.createdAt))
    .limit(200);
}

export async function insertNote(db: DbOrTx, session: Session, entityType: NoteEntity, entityId: string, note: string) {
  const text = requiredText('Note', 2000).parse(note);
  await db.insert(activityNotes).values({ entityType, entityId, note: text, createdBy: session.uid, createdByName: session.name });
}
