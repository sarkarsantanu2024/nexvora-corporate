/** The language of the current request. Server only. */
import { headers } from 'next/headers';
import { cache } from 'react';
import type { Programme, ProgrammeWords } from '@/db/schema';
import { DEFAULT_LANG, LANG_HEADER, isLang, type Lang } from './i18n';

export const getLang = cache(async (): Promise<Lang> => {
  const value = (await headers()).get(LANG_HEADER);
  return isLang(value) ? value : DEFAULT_LANG;
});

/** A programme with its words in the given language; English fills any gap. */
export function localizeProgramme<T extends Pick<Programme, 'i18n'> & ProgrammeWords>(programme: T, lang: Lang): T {
  if (lang === 'en') return programme;
  const words = programme.i18n?.[lang];
  if (!words) return programme;
  const out = { ...programme };
  for (const key of ['name', 'ageLabel', 'tagline', 'description', 'timing'] as const) {
    const value = words[key];
    if (typeof value === 'string' && value.trim()) (out as ProgrammeWords)[key] = value;
  }
  if (Array.isArray(words.highlights) && words.highlights.some((line) => line.trim())) {
    (out as ProgrammeWords).highlights = words.highlights;
  }
  return out;
}
