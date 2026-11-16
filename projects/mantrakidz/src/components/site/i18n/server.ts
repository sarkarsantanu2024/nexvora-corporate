/** For server components and metadata: the language of this request and its dictionary. */
import { cache } from 'react';
import { getLang } from '@/lib/lang';
import { getDict } from './index';

export const getSite = cache(async () => {
  const lang = await getLang();
  return { lang, t: getDict(lang) };
});
