/**
 * What kind of school this is: the classes it teaches, its shifts and its
 * Higher Secondary streams. Every screen, form, report and printout reads
 * these instead of writing "Class 5 to 12" itself, so the same code serves
 * the high school (this project) and the primary school (a copy of it with
 * this file changed: classes 0 to 4, morning and day shifts, no streams).
 *
 * A class is a number. 0 is pre-primary; 1 to 12 are Class 1 to Class 12.
 */
import type { Shift, Stream } from '@/db/schema';

export const SCHOOL = {
  /** Classes taught, lowest first. */
  grades: [5, 6, 7, 8, 9, 10, 11, 12] as number[],
  /** Shifts the school runs. One shift: the shift is never shown on screen. */
  shifts: ['day'] as Shift[],
  /** Streams from this class upward; null when the school has no streams. */
  streamsFrom: 11 as number | null,
  streams: ['science', 'arts'] as Exclude<Stream, ''>[],
  /** Madhyamik is taken at the end of this class; null for a school without board exams. */
  boardExamGrades: [10, 12] as number[],
  /** Who the school takes: 'boys', 'girls' or 'co-ed'. Sets the default gender on the admission form. */
  students: 'boys' as 'boys' | 'girls' | 'co-ed',
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const bnDigits = (value: number | string) => String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

const BN_ORDINAL: Record<number, string> = {
  1: 'প্রথম',
  2: 'দ্বিতীয়',
  3: 'তৃতীয়',
  4: 'চতুর্থ',
  5: 'পঞ্চম',
  6: 'ষষ্ঠ',
  7: 'সপ্তম',
  8: 'অষ্টম',
  9: 'নবম',
  10: 'দশম',
  11: 'একাদশ',
  12: 'দ্বাদশ',
};

/** 'Class 7' / 'সপ্তম শ্রেণি'; 0 is pre-primary. */
export function gradeLabel(grade: number, lang: 'en' | 'bn' | 'hi' = 'en'): string {
  if (lang === 'bn') return grade === 0 ? 'প্রাক-প্রাথমিক' : `${BN_ORDINAL[grade] ?? bnDigits(grade)} শ্রেণি`;
  return grade === 0 ? 'Pre-primary' : `Class ${grade}`;
}

export const STREAM_LABELS: Record<Exclude<Stream, ''>, { en: string; bn: string }> = {
  science: { en: 'Science', bn: 'বিজ্ঞান' },
  arts: { en: 'Arts', bn: 'কলা' },
};

export const SHIFT_LABELS: Record<Shift, { en: string; bn: string }> = {
  morning: { en: 'Morning', bn: 'প্রাতঃ' },
  day: { en: 'Day', bn: 'দিবা' },
};

/** Does this class have streams? */
export const hasStreams = (grade: number) => SCHOOL.streamsFrom !== null && grade >= SCHOOL.streamsFrom;

/**
 * A section's name as people say it: 'Class 7 A', 'Class 11 Science A',
 * 'Class 3 A (Morning)' when the school runs more than one shift.
 */
export function sectionLabel(section: { grade: number; name: string; stream: Stream; shift: Shift }, lang: 'en' | 'bn' | 'hi' = 'en'): string {
  const l = lang === 'bn' ? 'bn' : 'en';
  const parts = [gradeLabel(section.grade, lang)];
  if (section.stream) parts.push(STREAM_LABELS[section.stream][l]);
  parts.push(section.name);
  let out = parts.join(' ');
  if (SCHOOL.shifts.length > 1) out += ` (${SHIFT_LABELS[section.shift][l]})`;
  return out;
}
