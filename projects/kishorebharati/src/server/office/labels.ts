/**
 * Words and small sums of the office registers. Free of database imports so
 * client components can use them too. Each label reaches t() through a
 * variable, so its Bengali is in src/i18n/modules/office.ts by hand.
 */
import type { AssetCondition, AssetMovementKind, AssetSource, LeaveStatus, MeetingKind, StudentRecordKind } from '@/db/schema';

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Awaiting decision',
  approved: 'Approved',
  rejected: 'Not approved',
  cancelled: 'Cancelled',
};

export const RECORD_KIND_LABELS: Record<StudentRecordKind, string> = {
  achievement: 'Achievement',
  discipline: 'Discipline',
  health: 'Health check-up',
};

export const LEVELS = ['school', 'district', 'state', 'national'] as const;
export type Level = (typeof LEVELS)[number];
export const LEVEL_LABELS: Record<Level, string> = { school: 'School', district: 'District', state: 'State', national: 'National' };

export const ASSET_SOURCE_LABELS: Record<AssetSource, string> = {
  school_fund: 'School fund',
  government_grant: 'Government grant',
  donation: 'Donation',
};

export const ASSET_CONDITION_LABELS: Record<AssetCondition, string> = {
  good: 'Good',
  needs_repair: 'Needs repair',
  unusable: 'Unusable',
};

export const CONDITION_TONES: Record<AssetCondition, 'green' | 'amber' | 'red'> = { good: 'green', needs_repair: 'amber', unusable: 'red' };

export const MOVEMENT_LABELS: Record<AssetMovementKind, string> = {
  received: 'Received',
  issued: 'Issued',
  returned: 'Returned',
  damaged: 'Damaged',
  written_off: 'Written off',
};

export const MEETING_KIND_LABELS: Record<MeetingKind, string> = {
  smc: 'Managing committee',
  staff: 'Staff meeting',
  ptm: 'Parent-teacher meeting',
};

export const MEETING_TONES: Record<MeetingKind, 'brand' | 'blue' | 'green'> = { smc: 'brand', staff: 'blue', ptm: 'green' };

/** Categories the stock form offers; the office may type another. */
export const ASSET_CATEGORIES = ['Furniture', 'Lab equipment', 'Computers', 'Sports goods', 'Books', 'Other'];

export const UNITS = ['kg', 'litre', 'pcs'] as const;
export const UNIT_LABELS: Record<string, string> = { kg: 'kg', litre: 'litre', pcs: 'pcs' };

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** A stock quantity is kept in thousandths of its unit (1 kg = 1000). 12500 → '12.5'. */
export const qtyText = (milli: number) => {
  const value = milli / 1000;
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
};

/** '12.5' → 12500; anything that is not a number → NaN. */
export const qtyMilli = (input: string | number) => Math.round(Number(input) * 1000);

/** Body mass index from height in cm and weight in kg, one decimal; null when either is missing. */
export function bmi(heightCm: number | null | undefined, weightKg: number | null | undefined): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** 'HH:MM' now in India. */
export function nowTimeIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
}

/** '14:05' → '2:05 pm' */
export function timeText(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const h = Number(match[1]);
  return `${h % 12 || 12}:${match[2]} ${h < 12 ? 'am' : 'pm'}`;
}
