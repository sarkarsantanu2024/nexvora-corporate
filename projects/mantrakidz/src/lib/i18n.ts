/**
 * Languages of the public website. No server-only imports here: the
 * middleware and client components use this file too.
 *
 * English lives at the plain address (/about); Bengali and Hindi live under
 * a prefix (/bn/about, /hi/about). The middleware strips the prefix and
 * passes the language on in a request header, so there is ONE set of pages.
 * The dashboards keep each person's language in a cookie instead (src/i18n/ui.ts).
 */
export const LANGS = ['en', 'bn', 'hi'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';
/** The languages that need a translation layer. */
export type ExtraLang = Exclude<Lang, 'en'>;
export const EXTRA_LANGS: ExtraLang[] = ['bn', 'hi'];

export const LANG_HEADER = 'x-mk-lang';

export const LANG_NAMES: Record<Lang, { own: string; english: string; short: string; htmlLang: string }> = {
  en: { own: 'English', english: 'English', short: 'EN', htmlLang: 'en-IN' },
  bn: { own: 'বাংলা', english: 'Bengali', short: 'বাং', htmlLang: 'bn-IN' },
  hi: { own: 'हिन्दी', english: 'Hindi', short: 'हिं', htmlLang: 'hi-IN' },
};

export const isLang = (value: string | null | undefined): value is Lang => LANGS.includes(value as Lang);

/** '/bn/about' → { lang: 'bn', path: '/about' }; '/about' → { lang: 'en', path: '/about' } */
export function splitLocale(pathname: string): { lang: Lang; path: string } {
  const match = /^\/(bn|hi)(\/.*)?$/.exec(pathname);
  if (!match) return { lang: 'en', path: pathname || '/' };
  return { lang: match[1] as Lang, path: match[2] || '/' };
}

/** The address of a site page in a language: ('bn', '/about') → '/bn/about'. */
export function localePath(lang: Lang, path: string): string {
  // Leave alone anything that is not a site page.
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const clean = splitLocale(path).path;
  if (/^\/(hq|centre|parent|login|account|api|media|brand|images|_next)(\/|$|\?)/.test(clean)) return clean;
  if (lang === 'en') return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

/** Storage key of a section's translated content: ('home.hero', 'bn') → 'home.hero@bn'. */
export const contentKey = (key: string, lang: Lang) => (lang === 'en' ? key : `${key}@${lang}`);
