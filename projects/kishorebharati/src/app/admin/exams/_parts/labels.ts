/** How the exams screens name things in the page's language. */
import { gradeLabel } from '@/config/school';
import type { Lang } from '@/lib/i18n';

/** The subject's Bengali name on a Bengali screen when the office has given one. */
export const subjectName = (row: { subjectName?: string; subjectNameBn?: string; name?: string; nameBn?: string }, lang: Lang) => {
  const en = row.subjectName ?? row.name ?? '';
  const bn = row.subjectNameBn ?? row.nameBn ?? '';
  return lang === 'bn' && bn ? bn : en;
};

/** 'Class 5 to Class 10', or one class. */
export const gradeRange = (from: number, to: number, lang: Lang, word: string) =>
  from === to ? gradeLabel(from, lang) : `${gradeLabel(from, lang)} ${word} ${gradeLabel(to, lang)}`;

/** A percentage as printed: one decimal, no trailing .0. */
export const pct = (value: number | null) => (value === null ? '–' : `${Number.isInteger(value) ? value : value.toFixed(1)}%`);
