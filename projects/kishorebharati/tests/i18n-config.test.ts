/**
 * The language set-up follows src/config/languages.ts: the default language at
 * the plain address, every other language in use under its prefix, and a
 * language not in use nowhere.
 */
import { describe, expect, it } from 'vitest';
import { readUiLang } from '@/i18n/ui';
import { ALL_LANGS, DEFAULT_LANG, LANGS, isLang, localePath, splitLocale } from '@/lib/i18n';

describe('language config', () => {
  it('keeps English and the default in the list', () => {
    expect(LANGS).toContain('en');
    expect(LANGS).toContain(DEFAULT_LANG);
  });

  it('puts the default language at the plain address and the others under a prefix', () => {
    expect(localePath(DEFAULT_LANG, '/about')).toBe('/about');
    expect(splitLocale('/about')).toEqual({ lang: DEFAULT_LANG, path: '/about', prefixed: false });
    for (const lang of LANGS.filter((code) => code !== DEFAULT_LANG)) {
      expect(localePath(lang, '/about')).toBe(`/${lang}/about`);
      expect(localePath(lang, '/')).toBe(`/${lang}`);
      expect(splitLocale(`/${lang}/about`)).toEqual({ lang, path: '/about', prefixed: true });
    }
    // Dashboards and files never get a prefix.
    for (const lang of LANGS) expect(localePath(lang, '/login')).toBe('/login');
  });

  it('knows nothing of a language that is not in use', () => {
    for (const lang of ALL_LANGS.filter((code) => !LANGS.includes(code))) {
      expect(isLang(lang)).toBe(false);
      expect(splitLocale(`/${lang}/about`)).toEqual({ lang: DEFAULT_LANG, path: `/${lang}/about`, prefixed: false });
      expect(readUiLang(lang)).toBe(DEFAULT_LANG);
    }
  });

  it('opens the dashboard in the default language when there is no cookie', () => {
    expect(readUiLang(undefined)).toBe(DEFAULT_LANG);
  });
});
