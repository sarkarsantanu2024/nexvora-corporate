/** The fixed words of the website in the visitor's language. Safe to import anywhere. */
import type { Lang } from '@/lib/i18n';
import { bn } from './bn';
import { en, type Dict } from './en';
import { hi } from './hi';

export type { Dict };

const DICTS: Record<Lang, Dict> = { en, bn, hi };

export const getDict = (lang: Lang): Dict => DICTS[lang] ?? en;

/** 'Call {phone}' + { phone: '98…' } → 'Call 98…' */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
