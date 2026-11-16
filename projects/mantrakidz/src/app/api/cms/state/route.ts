/**
 * What every section holds right now in one language (?lang=en|bn|hi; draft
 * if there is one, else live), for the voice assistant to show "old → new"
 * before it changes anything. Also which rows, in any language, have drafts
 * waiting. Head office only.
 */
import { handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { isLang } from '@/lib/i18n';
import { getAllStates, keysWithDraft } from '@/server/cms/service';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req) => {
  await apiSession(HQ_ROLES);
  const asked = new URL(req.url).searchParams.get('lang');
  const lang = isLang(asked) ? asked : 'en';
  const [states, drafts] = await Promise.all([getAllStates(lang), keysWithDraft()]);
  return ok({
    lang,
    drafts,
    sections: states.map((state) => ({
      key: state.section,
      values: state.draft ?? state.published,
      hasDraft: state.hasDraft,
      hidden: state.hiddenInDraft,
    })),
  });
});
