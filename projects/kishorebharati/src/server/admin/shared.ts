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
import { TIMETABLE_DEFAULTS, type TimetableSettings } from '../timetable/defaults';
import { OFFICE_DEFAULTS, type OfficeSettings } from '../office/defaults';

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

/** Set by Nexvora only (src/server/platform.ts). Plain strings here so this file needs nothing from there. */
export type PlatformSettings = { plan: 'website' | 'panel' | 'platinum'; status: 'active' | 'suspended'; note: string; changedAt: string };

/** Which reminders are switched on, and their wording (src/server/reminders). Empty wording means the default. */
export type ReminderSettings = { enabled: Record<string, boolean>; templates: Record<string, string>; daysBefore: number };

/** The school's own details (seeded from its official page, edited in Settings). Printouts and the website read these. */
export type SchoolSettings = {
  high: { name: string; nameBn: string; udise: string; address: string; addressBn: string; phone: string; phone2: string; email: string; board: string };
  founded: number;
  founder: string;
  founderBn: string;
  motto: string;
};

/** When the daily job last ran and what it did (src/server/jobs.ts). */
export type JobsSettings = { lastRunAt: string; lastResult: string[] };

/**
 * Every group of settings and what it holds before anyone saves it.
 * A business module adds its own group here (say `billing`), and the same
 * getSetting / putSetting work for it.
 */
export const SETTING_DEFAULTS = {
  org: { name: BRAND.name, legalName: '', phone: '', email: '', address: '' } as OrgSettings,
  platform: { plan: 'platinum', status: 'active', note: '', changedAt: '' } as PlatformSettings,
  reminders: { enabled: {}, templates: {}, daysBefore: 3 } as ReminderSettings,
  jobs: { lastRunAt: '', lastResult: [] } as JobsSettings,
  school: {
    high: { name: BRAND.name, nameBn: '', udise: '', address: '', addressBn: '', phone: '', phone2: '', email: '', board: '' },
    founded: 0,
    founder: '',
    founderBn: '',
    motto: '',
  } as SchoolSettings,
  /** Period times and when each class goes home (src/server/timetable/defaults.ts). */
  timetable: TIMETABLE_DEFAULTS as TimetableSettings,
  /** How a new admission number is written (src/server/students): {n} the running number, {year} the school year. */
  students: { admissionFormat: '{n}/{year}' } as { admissionFormat: string },
  /** Letter grades of the exam results (src/server/exams/grading.ts): WBBSE scale, to be confirmed by the school. */
  grading: {
    scale: [
      { grade: 'AA', min: 90 },
      { grade: 'A+', min: 80 },
      { grade: 'A', min: 60 },
      { grade: 'B+', min: 45 },
      { grade: 'B', min: 35 },
      { grade: 'C', min: 25 },
      { grade: 'D', min: 0 },
    ],
  } as { scale: { grade: string; min: number }[] },
  /** Fees (src/server/money): days from a bill to its due date, and a line printed at the foot of every receipt. */
  fees: { dueDays: 30, receiptFooter: '' } as { dueDays: number; receiptFooter: string },
  /** How parents pay the school (src/server/money/labels.ts, PaymentDetails). No gateway: shown on bills and reminders. */
  payment: { upiId: '', payeeName: '', qrImage: '', accountName: '', accountNumber: '', ifsc: '', bank: '', branch: '', note: '' } as {
    upiId: string;
    payeeName: string;
    qrImage: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bank: string;
    branch: string;
    note: string;
  },
  /** The expense categories the office picks from (src/server/money/expenses.ts). */
  expenses: { categories: ['Electricity', 'Repairs', 'Stationery', 'Events', 'Mid-day meal', 'Cleaning', 'Other'] } as { categories: string[] },
  /** Library rules (src/server/library): loan length, late fine a day, books a student may hold, accession number prefix. */
  library: { loanDays: 14, finePerDay: 1, maxBooks: 2, accessionPrefix: 'KB' } as { loanDays: number; finePerDay: number; maxBooks: number; accessionPrefix: string },
  /** Office registers (src/server/office/defaults.ts): mid-day meal classes, menu and stock items, leave types and quotas. */
  office: OFFICE_DEFAULTS as OfficeSettings,
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
