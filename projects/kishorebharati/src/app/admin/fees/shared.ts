/** Helpers the money screens share. No server imports, so client parts can use them too. */
import type { Shift, Stream } from '@/db/schema';
import { sectionLabel } from '@/config/school';
import type { Translate } from '@/i18n/ui';
import { billPeriodLabel } from '@/server/money/labels';

type Place = { grade: number | null; sectionName: string | null; stream: string | null; shift: string | null; rollNo?: number | null };

/** 'Class 7 A' / 'সপ্তম শ্রেণি A', or '' for a student without a place this year. */
export function classOf(place: Place, lang: string): string {
  if (place.grade == null) return '';
  return sectionLabel({ grade: place.grade, name: place.sectionName ?? '', stream: (place.stream ?? '') as Stream, shift: (place.shift ?? 'day') as Shift }, lang === 'bn' ? 'bn' : 'en');
}

/** What a bill is for, in the person's language: "Fees for 2026" from the period, or a one-off bill's own title. */
export function billName(bill: { period: string | null; title: string }, t: Translate): string {
  return bill.period ? t('Fees for {period}', { period: billPeriodLabel(bill.period) }) : bill.title;
}
