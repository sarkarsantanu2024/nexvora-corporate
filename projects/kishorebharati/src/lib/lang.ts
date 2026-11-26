/** The language of the current request. Server only. */
import { headers } from 'next/headers';
import { cache } from 'react';
import { DEFAULT_LANG, LANG_HEADER, isLang, type Lang } from './i18n';

export const getLang = cache(async (): Promise<Lang> => {
  const value = (await headers()).get(LANG_HEADER);
  return isLang(value) ? value : DEFAULT_LANG;
});
