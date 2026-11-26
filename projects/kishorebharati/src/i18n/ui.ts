/**
 * The language of the dashboard: the languages set in src/config/languages.ts
 * (English, Bengali, Hindi). With no cookie it opens in the default language.
 *
 * The English sentence itself is the key. A screen writes t('Add login') and
 * the Hindi and Bengali files say what that is in their language. A sentence
 * that is not in a file yet simply shows in English, so a screen can be
 * translated a little at a time and nothing ever shows a blank or a code.
 *
 *   server component:  const t = await getT();        (src/lib/t.ts)
 *   client component:  const t = useT();              (src/components/ui/lang.tsx)
 *   with a value:      t('{n} new enquiries', { n: 12 })
 *
 * Names of people and places, amounts, dates and anything typed in by a user
 * are never translated.
 *
 * No server-only imports here: the middleware and client components use it.
 */
import { DEFAULT_LANG, isLang, type ExtraLang, type Lang } from '@/lib/i18n';
import { MODULES_BN } from './modules';
import { UI_BN } from './ui-bn';
import { UI_HI } from './ui-hi';

/** The cookie that remembers a person's dashboard language. */
export const UI_LANG_COOKIE = 'ui_lang';

export type UiDict = Record<string, string>;
const DICTS: Record<ExtraLang, UiDict> = { bn: { ...UI_BN, ...MODULES_BN }, hi: UI_HI };

/** The translations for a language; nothing for English (the sentences are English already). */
export const uiDict = (lang: Lang): UiDict | null => (lang === 'en' ? null : DICTS[lang]);

export const readUiLang = (value: string | null | undefined): Lang => (isLang(value) ? value : DEFAULT_LANG);

export type Translate = (text: string, values?: Record<string, string | number>) => string;

export function makeT(dict: UiDict | null): Translate {
  return (text, values) => {
    let out = dict?.[text] || text;
    if (values) for (const [name, value] of Object.entries(values)) out = out.replaceAll(`{${name}}`, String(value));
    return out;
  };
}
