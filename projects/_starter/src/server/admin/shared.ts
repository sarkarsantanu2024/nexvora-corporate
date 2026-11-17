/**
 * Pieces every dashboard service uses: the role checks, settings access and
 * the small SQL fragments that keep counts consistent across screens.
 */
import { eq, sql } from 'drizzle-orm';
import { BRAND } from '@/config/brand';
import { getDb, type DbOrTx } from '@/db';
import { settings } from '@/db/schema';
import { ApiError } from '@/lib/api';
import type { Session } from '@/lib/session-token';

export const isAdmin = (session: Session) => session.role === 'admin';

/** Checked in the service, so hiding a button is never the only guard. */
export function assertAdmin(session: Session) {
  if (!isAdmin(session)) throw new ApiError(403, 'Only an admin can do this');
}

export function assertTeam(session: Session) {
  if (session.role !== 'admin' && session.role !== 'staff') throw new ApiError(403, 'You do not have access to this');
}

/** count(*) that comes back as a JavaScript number. */
export const countInt = () => sql<number>`count(*)::int`;

export const PAGE_SIZE = 25;
export const pageOf = (value: unknown) => Math.max(1, Math.floor(Number(value)) || 1);

/* ───────────── settings ───────────── */

export type OrgSettings = { name: string; legalName: string; phone: string; email: string; address: string };

/**
 * Every group of settings and what it holds before anyone saves it.
 * A business module adds its own group here (say `billing`), and the same
 * getSetting / putSetting work for it.
 */
export const SETTING_DEFAULTS = {
  org: { name: BRAND.name, legalName: '', phone: '', email: '', address: '' } as OrgSettings,
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
