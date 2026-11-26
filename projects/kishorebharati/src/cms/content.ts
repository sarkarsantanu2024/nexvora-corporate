/**
 * Reading website content. Server only.
 *
 *   const hero = await content(homeHero);     // typed like homeHero.defaults
 *
 * What comes back is the section's defaults with whatever has been published
 * laid over the top. An editor who has switched preview on (edit panel) sees
 * their unpublished draft instead.
 *
 * Published content is cached and tagged 'cms'; publishing calls
 * revalidateTag('cms'), so the site updates at once without a rebuild.
 */
import { unstable_cache } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { getDb } from '@/db';
import { siteContent } from '@/db/schema';
import { contentKey, type ExtraLang, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/lang';
import { SESSION_COOKIE, readSessionToken } from '@/lib/session-token';
import { mergeContent } from '@/server/cms/merge';
import { SECTIONS } from './sections';
import type { ContentData, SectionDef } from './types';

export const CMS_TAG = 'cms';
export const PREVIEW_COOKIE = 'app_preview';

type Stored = { data: ContentData; draft: ContentData | null };

async function loadAll(): Promise<Record<string, Stored>> {
  const db = await getDb();
  const rows = await db.select().from(siteContent);
  const out: Record<string, Stored> = {};
  for (const row of rows) out[row.key] = { data: row.data as ContentData, draft: (row.draft as ContentData | null) ?? null };
  return out;
}

const loadAllCached = unstable_cache(loadAll, ['cms-all'], { tags: [CMS_TAG] });

/**
 * True when the visitor is an editor looking at their draft.
 *
 * Two ways in, and both need a head-office login, because a draft is
 * unpublished wording that no visitor should be able to read by setting a
 * cookie by hand:
 *  - the editor switched preview on (the cookie), or
 *  - the page is being drawn inside the edit panel's preview pane. Browsers
 *    mark such a request `Sec-Fetch-Dest: iframe`, which lets the pane show
 *    drafts without changing what the editor sees in their other tabs.
 */
export const isPreview = cache(async (): Promise<boolean> => {
  const jar = await cookies();
  const asked = jar.get(PREVIEW_COOKIE)?.value === '1' || (await headers()).get('sec-fetch-dest') === 'iframe';
  if (!asked) return false;
  const session = await readSessionToken(jar.get(SESSION_COOKIE)?.value);
  return Boolean(session);
});

/**
 * Lays one language's wording over the English content. Only fields the
 * section declares are taken, and an empty translation never blanks a field:
 * whatever is missing simply stays in English.
 */
export function overlayContent<T extends ContentData>(def: SectionDef<T>, base: T, layer: ContentData | null | undefined): T {
  if (!layer) return base;
  const out: ContentData = { ...base };
  for (const field of def.fields) {
    const value = layer[field.name];
    if (field.type === 'list') {
      if (Array.isArray(value) && value.length) out[field.name] = value;
    } else if (typeof value === 'string' && value.trim()) {
      out[field.name] = value;
    }
  }
  return out as T;
}

/**
 * A section's content in one language, from already-loaded rows.
 * English: defaults + saved. Bengali/Hindi: that, then the section's built-in
 * translation, then whatever the editor saved for that language
 * (stored under 'key@bn' / 'key@hi').
 */
export function resolveContent<T extends ContentData>(
  def: SectionDef<T>,
  lang: Lang,
  pick: (key: string) => ContentData | null | undefined,
): T {
  const english = mergeContent(def, pick(def.key));
  if (lang === 'en') return english;
  const builtIn = def.translations?.[lang as ExtraLang] as ContentData | undefined;
  return overlayContent(def, overlayContent(def, english, builtIn), pick(contentKey(def.key, lang)));
}

/** One section, for a page to render, in the visitor's language. */
export async function content<T extends ContentData>(def: SectionDef<T>, lang?: Lang): Promise<T> {
  const preview = await isPreview();
  const all = preview ? await loadAll() : await loadAllCached();
  const language = lang ?? (await getLang());
  return resolveContent(def, language, (key) => {
    const stored = all[key];
    return preview ? (stored?.draft ?? stored?.data) : stored?.data;
  });
}

/** A section can be switched off from the panel; pages skip it when this is true. */
export const isHidden = (data: ContentData) => data._hidden === '1';

/** Everything, for the edit panel: published, draft and defaults side by side. */
export async function allContentForEditing() {
  const all = await loadAll();
  return SECTIONS.map((def) => {
    const stored = all[def.key];
    return {
      def,
      published: mergeContent(def, stored?.data),
      draft: stored?.draft ? mergeContent(def, stored.draft) : null,
      hasDraft: Boolean(stored?.draft),
    };
  });
}

export { mergeContent };

export const sectionByKey = (key: string) => SECTIONS.find((def) => def.key === key) ?? null;
