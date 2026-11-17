/**
 * What the voice assistant can be asked to do, as data.
 *
 * Both ways of understanding a sentence (the built-in grammar and, when it is
 * switched on, Claude) produce this same shape, and the assistant treats them
 * identically: nothing is changed until the person confirms.
 */
import { z } from 'zod';

const target = z.object({ section: z.string(), field: z.string() });
export type Target = z.infer<typeof target>;

const base = { confidence: z.number().min(0).max(1) };
/** Set when the sentence fits more than one place, so the screen can ask which. */
const candidates = z.array(target).max(6).optional();

export const intentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('setField'), ...base, section: z.string(), field: z.string(), value: z.string().max(5000), candidates }),
  z.object({
    kind: z.literal('appendListItem'),
    ...base,
    section: z.string(),
    field: z.string(),
    /** The spoken parts placed into the row's fields. */
    item: z.record(z.string().max(5000)),
    /** Everything said after "add a …", untouched. */
    text: z.string().max(5000),
    /** True when the parts could not be placed with confidence: open the row for the person to finish. */
    needsEditor: z.boolean(),
    candidates,
  }),
  z.object({ kind: z.literal('pickImage'), ...base, section: z.string(), field: z.string(), camera: z.boolean(), candidates }),
  z.object({ kind: z.literal('addGalleryPhoto'), ...base, album: z.string().max(60), camera: z.boolean() }),
  z.object({ kind: z.literal('addNotice'), ...base, title: z.string().max(120), body: z.string().max(2000) }),
  z.object({ kind: z.literal('hideSection'), ...base, section: z.string(), candidates }),
  z.object({ kind: z.literal('showSection'), ...base, section: z.string(), candidates }),
  z.object({ kind: z.literal('navigate'), ...base, to: z.string().regex(/^\/admin\/website(\/|\?|$)/), label: z.string(), candidates }),
  z.object({ kind: z.literal('publish'), ...base, section: z.string().optional() }),
  z.object({ kind: z.literal('undo'), ...base }),
  z.object({ kind: z.literal('preview'), ...base }),
  z.object({ kind: z.literal('help'), ...base }),
  z.object({ kind: z.literal('stop'), ...base }),
  z.object({ kind: z.literal('confirm'), ...base }),
  z.object({ kind: z.literal('cancel'), ...base }),
  /** "the second one", answering "did you mean …?". Zero-based. */
  z.object({ kind: z.literal('choose'), ...base, index: z.number().int().min(0).max(5) }),
  /** "write …": type the words into the box the cursor is in. */
  z.object({ kind: z.literal('dictate'), ...base, text: z.string().max(5000) }),
  z.object({ kind: z.literal('dictation'), ...base, on: z.boolean() }),
  /** "edit Bengali": which language's wording the next changes go to. */
  z.object({ kind: z.literal('editLanguage'), ...base, lang: z.enum(['en', 'bn', 'hi']) }),
  z.object({
    kind: z.literal('unknown'),
    ...base,
    /** 'no-value': a field was named but not what to change it to. 'no-target': "hide it" with nothing in view. */
    reason: z.enum(['no-value', 'no-target', 'not-understood']).optional(),
    section: z.string().optional(),
    field: z.string().optional(),
  }),
]);

export type Intent = z.infer<typeof intentSchema>;
export type IntentKind = Intent['kind'];
export type IntentOf<K extends IntentKind> = Extract<Intent, { kind: K }>;

export const VOICE_LANGS = [
  { value: 'en-IN', label: 'English', short: 'EN' },
  { value: 'hi-IN', label: 'हिन्दी', short: 'हि' },
  { value: 'bn-IN', label: 'বাংলা', short: 'বা' },
] as const;
export type VoiceLang = (typeof VOICE_LANGS)[number]['value'];
