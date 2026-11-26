/**
 * Languages of the public website and the dashboards. No server-only imports
 * here: the middleware and client components use this file too.
 *
 * Which languages this client uses, and which is the default, is set in ONE
 * place: src/config/languages.ts. Everything here follows it.
 *
 * The default language lives at the plain address (/about); every other
 * language lives under a prefix (/en/about, /bn/about, /hi/about). The
 * middleware strips the prefix and passes the language on in a request header,
 * so there is ONE set of pages. The dashboards keep each person's language in
 * a cookie instead (src/i18n/ui.ts).
 *
 * Website content is stored the same way whatever the default: English is the
 * base row ('home.hero'), each other language a layer on top ('home.hero@bn').
 */
import { DEFAULT_LANGUAGE, LANGUAGES } from '@/config/languages';

/** Every language the code base has words for. */
export const ALL_LANGS = ['en', 'bn', 'hi'] as const;
export type Lang = (typeof ALL_LANGS)[number];

/** The languages this client uses, in menu order. */
export const LANGS: readonly Lang[] = LANGUAGES.filter((code, i) => ALL_LANGS.includes(code) && LANGUAGES.indexOf(code) === i);
/** The language at the plain address, and the dashboard's language before a person picks one. */
export const DEFAULT_LANG: Lang = LANGS.includes(DEFAULT_LANGUAGE) ? DEFAULT_LANGUAGE : LANGS[0];
/** The languages that need a translation layer over the English base. */
export type ExtraLang = Exclude<Lang, 'en'>;
export const EXTRA_LANGS: ExtraLang[] = LANGS.filter((code): code is ExtraLang => code !== 'en');

export const LANG_HEADER = 'x-app-lang';

export const LANG_NAMES: Record<Lang, { own: string; english: string; short: string; htmlLang: string }> = {
  en: { own: 'English', english: 'English', short: 'EN', htmlLang: 'en-IN' },
  bn: { own: 'বাংলা', english: 'Bengali', short: 'বাং', htmlLang: 'bn-IN' },
  hi: { own: 'हिन्दी', english: 'Hindi', short: 'हिं', htmlLang: 'hi-IN' },
};

/** True only for a language this client uses. */
export const isLang = (value: string | null | undefined): value is Lang => LANGS.includes(value as Lang);

/**
 * '/bn/about' → { lang: 'bn', path: '/about', prefixed: true };
 * '/about' → { lang: DEFAULT_LANG, path: '/about', prefixed: false }.
 * Only the prefixes of languages in use count: with Hindi off, '/hi/about' is just an unknown page.
 * A prefix of the default language is reported (prefixed: true) so the middleware can send it to the plain address.
 */
export function splitLocale(pathname: string): { lang: Lang; path: string; prefixed: boolean } {
  const match = /^\/([a-z]{2})(\/.*)?$/.exec(pathname);
  if (!match || !isLang(match[1])) return { lang: DEFAULT_LANG, path: pathname || '/', prefixed: false };
  return { lang: match[1], path: match[2] || '/', prefixed: true };
}

/** The address of a site page in a language: ('bn', '/about') → '/bn/about' (or '/about' when Bengali is the default). */
export function localePath(lang: Lang, path: string): string {
  // Leave alone anything that is not a site page.
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const clean = splitLocale(path).path;
  if (/^\/(admin|login|account|api|media|brand|images|_next)(\/|$|\?)/.test(clean)) return clean;
  if (lang === DEFAULT_LANG || !isLang(lang)) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

/** Storage key of a section's translated content: ('home.hero', 'bn') → 'home.hero@bn'. English is the base row. */
export const contentKey = (key: string, lang: Lang) => (lang === 'en' ? key : `${key}@${lang}`);
