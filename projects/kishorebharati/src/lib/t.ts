/** Dashboard words in the person's language, for server components. See src/i18n/ui.ts. */
import { cache } from 'react';
import { makeT, uiDict, type Translate } from '@/i18n/ui';
import { getLang } from './lang';

export const getT = cache(async (): Promise<Translate> => makeT(uiDict(await getLang())));
