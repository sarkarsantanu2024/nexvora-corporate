/**
 * Value lists the head office screens and services share. Kept free of any
 * database import so client components can use them too.
 */
import type { FranchiseStage } from '@/db/schema';

export const LEAD_SOURCES = ['website', 'phone', 'referral', 'facebook', 'instagram', 'walk-in', 'event', 'other'] as const;

export const STAGE_LABELS: Record<FranchiseStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  meeting: 'Meeting',
  site_visit: 'Site visit',
  agreement: 'Agreement',
  onboarded: 'Onboarded',
  lost: 'Lost',
};

export const PROGRAMME_COLOURS = ['sun', 'coral', 'mint', 'sky', 'indigo'] as const;

/** What must be typed before the sample data is removed. */
export const SAMPLE_CONFIRM_WORD = 'REMOVE';

/** 'walk-in' → 'Walk-in' */
export const sourceLabel = (source: string) => source.replace(/^\w/, (c) => c.toUpperCase());
