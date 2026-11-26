/**
 * Editing website content: drafts, publishing, history.
 *
 * The rules, in one place:
 *  - Saving a draft never changes what visitors see.
 *  - Publishing copies the draft over the live content and keeps the PREVIOUS
 *    live content as a revision, so restoring a revision is an undo.
 *  - Whatever the browser sends is rebuilt field by field from the section's
 *    definition. Keys the definition does not know are dropped.
 *
 * Languages. English lives in the row named after the section ('home.hero').
 * Bengali and Hindi each have a row of their own ('home.hero@bn') that holds
 * ONLY what differs from the section's built-in translation: wording and
 * lists. Photos, links, phone numbers and choices are shared from English,
 * and so is hiding a section. Each row has its own draft and its own history.
 *
 * No cookies, no redirects and no cache calls in here (the actions do those),
 * so every function can be run from a test.
 */
import { desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { SECTIONS } from '@/cms/sections';
import type { ContentData, Field, ListField, ScalarField, SectionDef } from '@/cms/types';
import { getDb } from '@/db';
import { contentRevisions, siteContent } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { EXTRA_LANGS, LANG_NAMES, contentKey, type ExtraLang, type Lang } from '@/lib/i18n';
import type { Session } from '@/lib/session-token';
import { optionalEmail, optionalPhone } from '@/lib/validators';
import { mergeContent } from './merge';

export type Via = 'panel' | 'voice';
type Actor = Pick<Session, 'uid' | 'name'>;
type Row = Record<string, string>;

/** Longest text we keep when a field sets no limit of its own. */
const DEFAULT_MAX: Record<'text' | 'textarea', number> = { text: 300, textarea: 5000 };
const MAX_ROWS = 200;

/* ───────────── which row ───────────── */

export type RowTarget = { def: SectionDef; lang: Lang; /** The database key: 'home.hero' or 'home.hero@bn'. */ key: string };

/** 'home.hero' or 'home.hero@bn' → the section and language, or null for anything else. */
export function resolveKey(raw: string): RowTarget | null {
  if (typeof raw !== 'string') return null;
  const at = raw.indexOf('@');
  const base = at >= 0 ? raw.slice(0, at) : raw;
  const suffix = at >= 0 ? raw.slice(at + 1) : null;
  // No '@' at all is English; an '@' must be followed by exactly 'bn' or 'hi'.
  const lang: Lang | null = suffix === null ? 'en' : EXTRA_LANGS.includes(suffix as ExtraLang) ? (suffix as ExtraLang) : null;
  const def = SECTIONS.find((section) => section.key === base) as SectionDef | undefined;
  return def && lang ? { def, lang, key: contentKey(def.key, lang) } : null;
}

function targetOrFail(raw: string): RowTarget {
  const target = resolveKey(raw);
  if (!target) throw new ApiError(404, 'That part of the website does not exist');
  return target;
}

export const sectionOrFail = (key: string): SectionDef => targetOrFail(key).def;

/** The fields that have wording of their own in each language. */
export const isTranslatable = (field: Field) => field.type === 'text' || field.type === 'textarea' || field.type === 'list';

const labelOf = (target: RowTarget) => (target.lang === 'en' ? target.def.label : `${target.def.label} (${LANG_NAMES[target.lang].english})`);

/* ───────────── validation ───────────── */

/** A photo is one of ours ('/media/a.webp') or a full https address. Nothing else. */
export function isSafeImage(value: string): boolean {
  if (value === '') return true;
  if (/[\s"'<>\\]/.test(value) || value.includes('..')) return false;
  if (value.startsWith('/')) return !value.startsWith('//');
  return /^https:\/\/[^/]+\.[^/]+/i.test(value);
}

/** A link: a page or file on this site ('/videos/day.mp4'), or a full http(s) address (a YouTube link, an .mp4). */
function cleanUrl(raw: string): { value: string; error?: string } {
  let value = raw.trim();
  if (!value) return { value: '' };
  if (/[\s"'<>\\]/.test(value)) return { value, error: 'A link cannot have spaces or quotes in it' };
  if (value.startsWith('/') && !value.startsWith('//')) return { value };
  // "facebook.com/yourpage" is how people type a link.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value) && /^[^/]+\.[a-z]{2,}(\/|$)/i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('scheme');
    return { value };
  } catch {
    return { value, error: 'Enter a full link, like https://youtube.com/watch?v=…' };
  }
}

function cleanScalar(field: ScalarField, raw: unknown): { value: string; error?: string } {
  const text = typeof raw === 'string' ? raw : '';
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const value = field.type === 'text' ? text.replace(/\s+/g, ' ').trim() : text.replace(/\r\n/g, '\n').trim();
      const max = field.maxLength ?? DEFAULT_MAX[field.type];
      if ([...value].length > max) return { value, error: `Keep this within ${max} characters` };
      return { value };
    }
    case 'image': {
      const value = text.trim();
      return isSafeImage(value) ? { value } : { value, error: 'Choose a photo from the library or upload one' };
    }
    case 'url':
      return cleanUrl(text);
    case 'phone': {
      const parsed = optionalPhone.safeParse(text.trim());
      return parsed.success ? { value: parsed.data } : { value: text.trim(), error: 'Enter a 10 digit mobile number' };
    }
    case 'email': {
      const parsed = optionalEmail.safeParse(text.trim().toLowerCase());
      return parsed.success ? { value: parsed.data } : { value: text.trim(), error: 'Enter a valid email address' };
    }
    case 'toggle':
      return { value: text === '1' ? '1' : '' };
    case 'select': {
      const allowed = (field.options ?? []).map((option) => option.value);
      // Nothing chosen means the first choice, which is what the form shows.
      if (text === '' && allowed.length) return { value: allowed[0] };
      return allowed.includes(text) ? { value: text } : { value: text, error: 'Pick one of the choices' };
    }
  }
}

/** A row somebody added and never filled in is not content. Choices and switches always hold something, so they do not count. */
const isBlankRow = (list: ListField, row: Row) => list.fields.every((field) => field.type === 'select' || field.type === 'toggle' || row[field.name] === '');

/**
 * Rebuilds content from the definition. Fields the browser left out keep
 * their current value (`base`), so a one-field change by voice cannot blank
 * the rest of the section.
 */
export function validateContent(def: SectionDef, input: unknown, base: ContentData): { data: ContentData; errors: Record<string, string> } {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const data: ContentData = {};
  const errors: Record<string, string> = {};

  for (const field of def.fields as Field[]) {
    const raw = source[field.name];
    if (raw === undefined) {
      data[field.name] = base[field.name] ?? (field.type === 'list' ? [] : '');
      continue;
    }
    if (field.type !== 'list') {
      const { value, error } = cleanScalar(field, raw);
      data[field.name] = value;
      if (error) errors[field.name] = error;
      continue;
    }

    const rows: Row[] = [];
    for (const item of Array.isArray(raw) ? raw.slice(0, MAX_ROWS) : []) {
      const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      const row: Row = {};
      const rowErrors: [string, string][] = [];
      for (const sub of field.fields) {
        const { value, error } = cleanScalar(sub, record[sub.name]);
        row[sub.name] = value;
        if (error) rowErrors.push([sub.name, error]);
      }
      if (isBlankRow(field, row)) continue;
      for (const [name, error] of rowErrors) errors[`${field.name}.${rows.length}.${name}`] = error;
      rows.push(row);
    }
    if (field.max && rows.length > field.max) errors[field.name] = `At most ${field.max} here. Remove ${rows.length - field.max} to save.`;
    data[field.name] = rows;
  }

  if (source._hidden !== undefined) {
    if (source._hidden === '1') data._hidden = '1';
  } else if (base._hidden === '1') {
    data._hidden = '1';
  }
  return { data, errors };
}

/* ───────────── translated rows ───────────── */

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** The section cut down to the fields a translation may hold. */
const translatableDef = (def: SectionDef): SectionDef => ({ ...def, fields: (def.fields as Field[]).filter(isTranslatable) });

/** What a translated field holds when the editor has saved nothing: the built-in translation, or (lists) the English rows. */
function inherited(def: SectionDef, lang: ExtraLang, english: ContentData, field: Field): string | Row[] {
  const builtIn = (def.translations?.[lang] as ContentData | undefined)?.[field.name];
  if (field.type === 'list') return Array.isArray(builtIn) && builtIn.length ? builtIn : ((english[field.name] as Row[]) ?? []);
  return typeof builtIn === 'string' ? builtIn : '';
}

/** A stored translation row, kept to real overrides of the right shape. */
function cleanLayer(def: SectionDef, stored: unknown): ContentData {
  const source = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  const out: ContentData = {};
  for (const field of def.fields as Field[]) {
    const value = source[field.name];
    if (field.type === 'list') {
      if (Array.isArray(value) && value.length) out[field.name] = value as Row[];
    } else if (isTranslatable(field) && typeof value === 'string' && value.trim()) {
      out[field.name] = value;
    }
  }
  return out;
}

/** What the translation form shows: the saved wording, else what is inherited. An empty box means "as in English". */
function layerValues(def: SectionDef, lang: ExtraLang, english: ContentData, layer: ContentData): ContentData {
  const out: ContentData = {};
  for (const field of (def.fields as Field[]).filter(isTranslatable)) out[field.name] = layer[field.name] ?? inherited(def, lang, english, field);
  return out;
}

/** Form values → the overrides worth storing (what differs from the inherited wording). */
function toLayer(def: SectionDef, lang: ExtraLang, english: ContentData, values: ContentData): ContentData {
  const out: ContentData = {};
  for (const field of (def.fields as Field[]).filter(isTranslatable)) {
    const value = values[field.name];
    const base = inherited(def, lang, english, field);
    if (field.type === 'list') {
      if (Array.isArray(value) && value.length && !same(value, base)) out[field.name] = value;
    } else if (typeof value === 'string' && value && value !== base) {
      out[field.name] = value;
    }
  }
  return out;
}

/* ───────────── reading ───────────── */

/** The marker a voice draft carries until it is published. Not content. */
const VIA_KEY = '_via';

type Stored = { data: unknown; draft: unknown; updatedAt: Date };

async function loadRow(key: string): Promise<Stored | null> {
  const db = await getDb();
  const [row] = await db.select().from(siteContent).where(eq(siteContent.key, key)).limit(1);
  return row ?? null;
}

export type SectionState = {
  /** The row this is about: 'home.hero' or 'home.hero@bn'. */
  key: string;
  section: string;
  lang: Lang;
  /** What visitors see now. English: every field, defaults filled in. A translation: its wording fields only. */
  published: ContentData;
  /** What the editor has saved but not published. */
  draft: ContentData | null;
  hasDraft: boolean;
  /** The published English content, shown beside a translation as the reference. Null for English itself. */
  reference: ContentData | null;
  /** Hidden on the live site (a section is hidden in every language at once). */
  hidden: boolean;
  /** Hidden once the English draft is published. */
  hiddenInDraft: boolean;
  updatedAt: string | null;
};

function toState(target: RowTarget, row: Stored | null, englishRow: Stored | null): SectionState {
  const { def, lang } = target;
  const english = mergeContent(def, (englishRow?.data as ContentData) ?? null);
  const englishDraft = englishRow?.draft ? mergeContent(def, englishRow.draft as ContentData) : null;
  const common = {
    key: target.key,
    section: def.key,
    lang,
    hasDraft: Boolean(row?.draft),
    hidden: english._hidden === '1',
    hiddenInDraft: (englishDraft ?? english)._hidden === '1',
    updatedAt: row ? row.updatedAt.toISOString() : null,
  };
  if (lang === 'en') return { ...common, published: english, draft: englishDraft, reference: null };
  return {
    ...common,
    published: layerValues(def, lang, english, cleanLayer(def, row?.data)),
    draft: row?.draft ? layerValues(def, lang, english, cleanLayer(def, row.draft)) : null,
    reference: english,
  };
}

async function loadState(target: RowTarget): Promise<{ row: Stored | null; englishRow: Stored | null; state: SectionState }> {
  const row = await loadRow(target.key);
  const englishRow = target.lang === 'en' ? row : await loadRow(target.def.key);
  return { row, englishRow, state: toState(target, row, englishRow) };
}

export async function getSectionState(key: string): Promise<SectionState> {
  return (await loadState(targetOrFail(key))).state;
}

export type SectionOverview = SectionState & { /** Languages of this section with unpublished changes. */ draftLangs: Lang[] };

/** Every section in one language, with which of its languages have drafts waiting. */
export async function getAllStates(lang: Lang = 'en'): Promise<SectionOverview[]> {
  const db = await getDb();
  const rows = await db.select().from(siteContent);
  const byKey = new Map<string, Stored>(rows.map((row) => [row.key, row]));
  return (SECTIONS as SectionDef[]).map((def) => {
    const target: RowTarget = { def, lang, key: contentKey(def.key, lang) };
    const draftLangs = (['en', ...EXTRA_LANGS] as Lang[]).filter((code) => Boolean(byKey.get(contentKey(def.key, code))?.draft));
    return { ...toState(target, byKey.get(target.key) ?? null, byKey.get(def.key) ?? null), draftLangs };
  });
}

/* ───────────── drafts ───────────── */

async function writeDraft(actor: Actor, key: string, draft: Record<string, unknown> | null) {
  const db = await getDb();
  await db
    .insert(siteContent)
    .values({ key, data: {}, draft, updatedBy: actor.uid })
    .onConflictDoUpdate({ target: siteContent.key, set: { draft, updatedBy: actor.uid, updatedAt: new Date() } });
}

/** Saves the editor's work without touching the live site. `key` may name a language row. */
export async function saveDraft(actor: Actor, key: string, input: unknown, via: Via = 'panel'): Promise<SectionState> {
  const target = targetOrFail(key);
  const { def, lang } = target;
  const { row, englishRow, state } = await loadState(target);

  let next: ContentData;
  let unchanged: boolean;
  if (lang === 'en') {
    const { data, errors } = validateContent(def, input, state.draft ?? state.published);
    if (Object.keys(errors).length) throw new ApiError(422, 'Please check the marked fields', errors);
    // Put in the definition's order so "is this different from live?" is a fair comparison.
    next = mergeContent(def, data);
    unchanged = same(next, state.published);
  } else {
    // Only wording and lists; anything else the browser sends for a translation is ignored.
    const { data, errors } = validateContent(translatableDef(def), input, state.draft ?? state.published);
    if (Object.keys(errors).length) throw new ApiError(422, 'Please check the marked fields', errors);
    delete data._hidden;
    const english = mergeContent(def, (englishRow?.data as ContentData) ?? null);
    next = toLayer(def, lang, english, data);
    unchanged = same(next, cleanLayer(def, row?.data));
  }

  if (unchanged) {
    // Typed back to what is already live: there is nothing left to publish.
    if (row?.draft) await writeDraft(actor, target.key, null);
    return (await loadState(target)).state;
  }

  const wasVoice = (row?.draft as Record<string, unknown> | null)?.[VIA_KEY] === 'voice';
  const stored: Record<string, unknown> = { ...next };
  if (via === 'voice' || wasVoice) stored[VIA_KEY] = 'voice';
  await writeDraft(actor, target.key, stored);
  if (via === 'voice') {
    await audit(actor, 'website.draft', { entity: 'site_content', entityId: target.key, summary: `Changed "${labelOf(target)}" by voice (not yet published)`, meta: { via, lang } });
  }
  return (await loadState(target)).state;
}

export async function discardDraft(actor: Actor, key: string): Promise<SectionState> {
  const target = targetOrFail(key);
  const row = await loadRow(target.key);
  if (row?.draft) {
    await writeDraft(actor, target.key, null);
    await audit(actor, 'website.discard', { entity: 'site_content', entityId: target.key, summary: `Discarded unpublished changes to "${labelOf(target)}"` });
  }
  return (await loadState(target)).state;
}

/**
 * Puts the original wording into the draft, for the editor to look at and
 * publish. For a translation that is the built-in translation.
 */
export async function resetToDefault(actor: Actor, key: string): Promise<SectionState> {
  const target = targetOrFail(key);
  const { def, lang } = target;
  if (lang === 'en') return saveDraft(actor, key, { ...def.defaults, _hidden: '' });
  const english = mergeContent(def, ((await loadRow(def.key))?.data as ContentData) ?? null);
  return saveDraft(actor, key, layerValues(def, lang, english, {}));
}

/**
 * Switches a section off or on, in every language: the marker lives on the
 * English row. Like every other change it waits in the draft until published.
 */
export async function setHidden(actor: Actor, key: string, hidden: boolean, via: Via = 'panel'): Promise<SectionState> {
  const target = targetOrFail(key);
  await saveDraft(actor, target.def.key, { _hidden: hidden ? '1' : '' }, via);
  return (await loadState(target)).state;
}

/* ───────────── publishing ───────────── */

export type PublishResult = { key: string; label: string; revisionId: string };

/** Makes the draft live and keeps what was live before as a revision (under the same row key). */
export async function publishSection(actor: Actor, key: string, options: { via?: Via; summary?: string } = {}): Promise<PublishResult> {
  const target = targetOrFail(key);
  const { def, lang } = target;
  const label = labelOf(target);
  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(siteContent).where(eq(siteContent.key, target.key)).limit(1);
    if (!row?.draft) throw new ApiError(400, 'There are no unpublished changes here');
    const draftVia = (row.draft as Record<string, unknown>)[VIA_KEY] === 'voice' ? 'voice' : 'panel';
    const via: Via = options.via === 'voice' ? 'voice' : draftVia;
    const previous = lang === 'en' ? mergeContent(def, row.data as ContentData) : cleanLayer(def, row.data);
    const next = lang === 'en' ? mergeContent(def, row.draft as ContentData) : cleanLayer(def, row.draft);
    const [revision] = await tx
      .insert(contentRevisions)
      .values({ key: target.key, data: previous, via, summary: options.summary || `Published "${label}"`, createdBy: actor.uid, createdByName: actor.name })
      .returning({ id: contentRevisions.id });
    await tx.update(siteContent).set({ data: next, draft: null, updatedBy: actor.uid, updatedAt: new Date() }).where(eq(siteContent.key, target.key));
    return { revisionId: revision.id, via };
  });
  await audit(actor, 'website.publish', { entity: 'site_content', entityId: target.key, summary: `Published "${label}"${result.via === 'voice' ? ' by voice' : ''}`, meta: { via: result.via, lang } });
  return { key: target.key, label, revisionId: result.revisionId };
}

/** Row keys (every language) that have a draft and still belong to a section. */
export async function keysWithDraft(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select({ key: siteContent.key }).from(siteContent).where(isNotNull(siteContent.draft));
  return rows.map((row) => row.key).filter((key) => resolveKey(key) !== null);
}

/** Publishes every draft, in every language. */
export async function publishAll(actor: Actor, via: Via = 'panel'): Promise<PublishResult[]> {
  const published: PublishResult[] = [];
  for (const key of await keysWithDraft()) published.push(await publishSection(actor, key, { via }));
  return published;
}

export async function discardAll(actor: Actor): Promise<number> {
  const keys = await keysWithDraft();
  if (!keys.length) return 0;
  const db = await getDb();
  await db.update(siteContent).set({ draft: null, updatedBy: actor.uid, updatedAt: new Date() }).where(inArray(siteContent.key, keys));
  await audit(actor, 'website.discard', { entity: 'site_content', summary: `Discarded unpublished changes to ${keys.length} part${keys.length === 1 ? '' : 's'} of the website` });
  return keys.length;
}

/* ───────────── history ───────────── */

export type RevisionRow = {
  id: string;
  /** The row key, with the language suffix if any. */
  key: string;
  section: string;
  lang: Lang;
  label: string;
  page: string;
  via: string;
  summary: string;
  by: string;
  at: string;
};

export async function listRevisions(options: { key?: string; limit?: number; offset?: number } = {}): Promise<RevisionRow[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(contentRevisions)
    .where(options.key ? eq(contentRevisions.key, options.key) : undefined)
    .orderBy(desc(contentRevisions.createdAt), desc(contentRevisions.id))
    .limit(options.limit ?? 5)
    .offset(options.offset ?? 0);
  return rows.map((row) => {
    const target = resolveKey(row.key);
    return {
      id: row.id,
      key: row.key,
      section: target?.def.key ?? row.key,
      lang: target?.lang ?? 'en',
      label: target?.def.label ?? row.key,
      page: target?.def.page ?? '',
      via: row.via,
      summary: row.summary,
      by: row.createdByName,
      at: row.createdAt.toISOString(),
    };
  });
}

/**
 * Puts a kept version back on the live site. What it replaces is kept as a
 * new revision, so a restore can itself be undone.
 */
export async function restoreRevision(actor: Actor, revisionId: string, via: Via = 'panel'): Promise<PublishResult> {
  if (!/^[0-9a-f-]{36}$/i.test(revisionId)) throw new ApiError(404, 'That saved version was not found');
  const db = await getDb();
  const [revision] = await db.select().from(contentRevisions).where(eq(contentRevisions.id, revisionId)).limit(1);
  if (!revision) throw new ApiError(404, 'That saved version was not found');
  const target = targetOrFail(revision.key);
  const { def, lang } = target;
  const label = labelOf(target);
  // Old revisions may predate today's field list or limits: run them through the same checks.
  const restored =
    lang === 'en'
      ? mergeContent(def, validateContent(def, revision.data, def.defaults as ContentData).data)
      : cleanLayer(def, validateContent(translatableDef(def), revision.data, {}).data);

  const newId = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(siteContent).where(eq(siteContent.key, target.key)).limit(1);
    const previous = lang === 'en' ? mergeContent(def, (row?.data as ContentData) ?? null) : cleanLayer(def, row?.data);
    const [kept] = await tx
      .insert(contentRevisions)
      .values({ key: target.key, data: previous, via, summary: `Restored an earlier version of "${label}"`, createdBy: actor.uid, createdByName: actor.name })
      .returning({ id: contentRevisions.id });
    await tx
      .insert(siteContent)
      .values({ key: target.key, data: restored, updatedBy: actor.uid })
      .onConflictDoUpdate({ target: siteContent.key, set: { data: restored, updatedBy: actor.uid, updatedAt: new Date() } });
    return kept.id;
  });
  await audit(actor, 'website.restore', { entity: 'site_content', entityId: target.key, summary: `Restored an earlier version of "${label}"${via === 'voice' ? ' by voice' : ''}`, meta: { via, revisionId, lang } });
  return { key: target.key, label, revisionId: newId };
}

/** The most recent publish, for "undo" by voice. */
export async function latestRevision(): Promise<RevisionRow | null> {
  const [row] = await listRevisions({ limit: 1 });
  return row ?? null;
}
