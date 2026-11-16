'use client';

/**
 * The voice assistant on every website-editing screen.
 *
 * A sentence (spoken, or typed into the box for noisy rooms) is read by the
 * grammar; if the grammar cannot place it and free-form understanding is
 * switched on, Claude is asked. Either way the result is the same kind of
 * Intent and goes down the same road:
 *
 *   understood  →  a card showing exactly what will change  →  "yes" or Apply
 *
 * Nothing is saved, published or restored without that last step. Going to a
 * screen, showing help and switching preview on change nothing, so they
 * happen at once.
 */
import { Camera, Check, ExternalLink, FolderOpen, HelpCircle, Keyboard, Loader2, Mic, MicOff, SendHorizontal, Sparkles, UploadCloud, Volume2, VolumeX, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContentData } from '@/cms/types';
import { Button } from '@/components/ui/core';
import { LoadingButton } from '@/components/ui/client';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/date';
import { LANGS, LANG_NAMES, contentKey, isLang, type Lang } from '@/lib/i18n';
import {
  addGalleryPhotosAction,
  createNoticeAction,
  latestRevisionAction,
  publishAction,
  publishAllAction,
  restoreDraftAction,
  restoreRevisionAction,
  saveDraftAction,
  setHiddenAction,
  setPreviewAction,
} from '@/server/cms/actions';
import { findField, findSection, targetLabel, type Catalogue } from '@/voice/catalogue';
import { cueDone } from '@/voice/cue';
import { UNSUPPORTED, VOICE_ERRORS } from '@/voice/errors';
import { parseCommand } from '@/voice/grammar';
import { intentSchema, VOICE_LANGS, type Intent, type IntentOf, type Target, type VoiceLang } from '@/voice/intent';
import { EXAMPLES, REPLIES } from '@/voice/phrases';
import { speak, useVoice } from '@/voice/useVoice';
import { MediaPicker } from './media-library';
import { imagesFrom, uploadMany, type Uploaded } from './upload';
import { announceChange, stashRow, useVoiceBridge } from './voice-bridge';

type Row = Record<string, string>;
type Entry = { id: number; who: 'you' | 'app'; text: string; tone?: 'ok' | 'warn' | 'guess'; href?: string };
type Line = { label: string; before?: string; after: string };
type Outcome = { ok: true; done: string } | { ok: false; error: string };
type Pending = {
  id: number;
  title: string;
  lines: Line[];
  photos?: { before?: string; after: string[] };
  /** Lets the album be typed or corrected on the card before applying. */
  album?: boolean;
  warn?: string;
  guess?: boolean;
  confirmLabel: string;
  run: (album: string) => Promise<Outcome>;
};
type Choice = { intent: Intent; candidates: Target[] };
type Picker = { kind: 'field'; section: string; field: string; camera: boolean; guess?: boolean } | { kind: 'gallery'; album: string; camera: boolean };
type SectionSnapshot = { key: string; values: ContentData; hasDraft: boolean; hidden: boolean };
type Snapshots = { sections: Map<string, SectionSnapshot>; /** Row keys, in any language, with drafts waiting. */ drafts: string[] };
type Undo = { key: string; previous: ContentData | null };

const SCREENS = new Set(['gallery', 'notices', 'media', 'history']);
const LANG_KEY = 'mk_voice_lang';
const SOUND_KEY = 'mk_voice_sound';

/** 'home.hero@bn' → the section and the language. */
function splitRow(rowKey: string): { section: string; lang: Lang } {
  const at = rowKey.lastIndexOf('@');
  const suffix = at > 0 ? rowKey.slice(at + 1) : '';
  return at > 0 && isLang(suffix) ? { section: rowKey.slice(0, at), lang: suffix } : { section: rowKey, lang: 'en' };
}

const sectionHref = (section: string, lang: Lang) => (lang === 'en' ? `/hq/website/${section}` : `/hq/website/${section}?lang=${lang}`);

let seq = 0;
const nextId = () => (seq += 1);

const shown = (value: unknown, type?: string): string => {
  if (type === 'toggle') return value === '1' ? 'On' : 'Off';
  return typeof value === 'string' && value ? value : 'Empty';
};

export function VoiceAssistant({ catalogue, freeForm }: { catalogue: Catalogue; freeForm: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const bridge = useVoiceBridge();

  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<VoiceLang>('en-IN');
  /** Which language's wording spoken changes go to. Not the language spoken in. */
  const [editLang, setEditLang] = useState<Lang>('en');
  const [sound, setSound] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [library, setLibrary] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [album, setAlbum] = useState('');
  const [help, setHelp] = useState(false);
  const [dictation, setDictation] = useState(false);
  const [typed, setTyped] = useState('');
  const [working, setWorking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(0);

  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const undo = useRef<Undo[]>([]);
  const lastSection = useRef<string | null>(null);
  const hidden = useRef<string[]>([]);
  // The recogniser calls back long after render: it must see today's state, not the state it was created with.
  const live = useRef({ pending, choice, picker, dictation, lang, sound, album, applying, editLang });
  live.current = { pending, choice, picker, dictation, lang, sound, album, applying, editLang };

  const segment = pathname.split('/')[3] ?? '';
  const currentSection = segment && !SCREENS.has(segment) ? decodeURIComponent(segment) : null;
  const currentRef = useRef(currentSection);
  currentRef.current = currentSection;

  // The section editor's language switch leads: open the Bengali form and spoken changes go to Bengali.
  const formLang = search.get('lang');
  useEffect(() => {
    if (currentSection) setEditLang(isLang(formLang) ? formLang : 'en');
  }, [currentSection, formLang]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (VOICE_LANGS.some((item) => item.value === saved)) setLang(saved as VoiceLang);
      if (window.localStorage.getItem(SOUND_KEY) === 'off') setSound(false);
    } catch {
      /* private mode: defaults are fine */
    }
  }, []);
  const remember = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* not remembered, nothing else lost */
    }
  };

  const handleRef = useRef<(alternatives: string[]) => void>(() => undefined);
  const voice = useVoice({
    lang,
    // Reading a confirmation card takes longer than the usual pause between commands.
    idleStopMs: pending || choice || picker ? 30_000 : 10_000,
    onPhrase: (alternatives) => handleRef.current(alternatives),
  });
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  // The tick on the mic is a moment, not a state.
  useEffect(() => {
    if (!applied) return;
    const timer = window.setTimeout(() => setApplied(0), 2600);
    return () => window.clearTimeout(timer);
  }, [applied]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [entries, pending, choice, picker, help]);

  /* ───────────── saying things ───────────── */

  const note = useCallback((text: string, extra: Partial<Entry> = {}) => {
    setEntries((list) => [...list.slice(-30), { id: nextId(), who: 'app', text, ...extra }]);
  }, []);

  /** Writes a line in the panel and, when sound is on, says the short version aloud. */
  const say = useCallback(
    (text: string, spoken: string, extra: Partial<Entry> = {}) => {
      note(text, extra);
      if (!live.current.sound) return;
      // Mic off while the app talks, or it hears itself and answers its own question.
      voiceRef.current.pause();
      speak(spoken, live.current.lang, () => voiceRef.current.resume());
    },
    [note],
  );

  const clearCards = useCallback(() => {
    setPending(null);
    setChoice(null);
    setPicker(null);
    setUploading(null);
  }, []);

  /* ───────────── reading and writing content ───────────── */

  const fetchStates = useCallback(async (language: Lang = 'en'): Promise<Snapshots> => {
    const response = await fetch(`/api/cms/state?lang=${language}`, { cache: 'no-store' });
    const result = (await response.json()) as { ok: boolean; data?: { sections: SectionSnapshot[]; drafts: string[] }; error?: string };
    if (!result.ok || !result.data) throw new Error(result.error || 'Could not read the website content');
    hidden.current = result.data.sections.filter((item) => item.hidden).map((item) => item.key);
    return { sections: new Map(result.data.sections.map((item) => [item.key, item])), drafts: result.data.drafts };
  }, []);

  /** The row a change to this field belongs in: wording goes to the language being edited, everything else is shared from English. */
  const rowFor = useCallback(
    (section: string, field?: string): string => {
      const type = field ? findField(catalogue, section, field)?.type : undefined;
      const wording = type === 'text' || type === 'textarea' || type === 'list';
      return contentKey(section, wording ? live.current.editLang : 'en');
    },
    [catalogue],
  );

  /** "Home › Top banner", with the language when it is not English. */
  const rowLabel = useCallback(
    (rowKey: string, field?: string) => {
      const { section, lang: language } = splitRow(rowKey);
      const label = targetLabel(catalogue, section, field);
      return language === 'en' ? label : `${label}, ${LANG_NAMES[language].english}`;
    },
    [catalogue],
  );

  /** The line on a card that says which language is about to change. */
  const languageLine = (rowKey: string): Line => ({ label: 'Language', after: LANG_NAMES[splitRow(rowKey).lang].own });

  // So "show testimonials" can tell a hidden section from a visible one on the very first command.
  useEffect(() => {
    if (open) void fetchStates().catch(() => undefined);
  }, [open, fetchStates]);

  const formFor = useCallback((key: string) => (bridge?.form()?.key === key ? (bridge.form() ?? null) : null), [bridge]);

  /** What a section holds right now: from the open form if it is that section, else from the server. */
  const snapshot = useCallback(
    async (key: string): Promise<{ values: ContentData; previous: ContentData | null }> => {
      const form = formFor(key);
      if (form) return { values: form.values(), previous: form.savedDraft() };
      const row = splitRow(key);
      const state = (await fetchStates(row.lang)).sections.get(row.section);
      if (!state) throw new Error('That part of the website was not found');
      const { _hidden, ...values } = state.values as ContentData & { _hidden?: string };
      void _hidden;
      return { values, previous: state.hasDraft ? values : null };
    },
    [fetchStates, formFor],
  );

  /** Saves a change to one section as a draft, through the open form when there is one. */
  const saveChange = useCallback(
    async (key: string, change: ContentData, previous: ContentData | null): Promise<Outcome> => {
      const form = formFor(key);
      const result = form ? await form.applyAndSave({ ...form.values(), ...change }) : await saveDraftAction(key, change, 'voice');
      if (!result.ok) return { ok: false, error: Object.values(result.fields ?? {})[0] ?? result.error };
      undo.current.push({ key, previous });
      lastSection.current = splitRow(key).section;
      return { ok: true, done: 'Saved as a draft. Say "publish" when you are ready for visitors to see it.' };
    },
    [formFor],
  );

  /* ───────────── one card per kind of change ───────────── */

  const ask = useCallback(
    (card: Omit<Pending, 'id'>, spokenWhat: string) => {
      setChoice(null);
      setPicker(null);
      setPending({ ...card, id: nextId() });
      voiceRef.current.touch();
      if (live.current.sound) {
        voiceRef.current.pause();
        speak(REPLIES[live.current.lang].ask(spokenWhat), live.current.lang, () => voiceRef.current.resume());
      }
    },
    [],
  );

  const proposeSet = useCallback(
    async (intent: IntentOf<'setField'>, guess = false) => {
      const field = findField(catalogue, intent.section, intent.field);
      if (!field) return note('That field is not on the website any more.', { tone: 'warn' });
      const row = rowFor(intent.section, intent.field);
      const { values, previous } = await snapshot(row);
      const limit = field.maxLength;
      const length = [...intent.value].length;
      const sharedField = live.current.editLang !== 'en' && splitRow(row).lang === 'en';
      ask(
        {
          title: `Change ${targetLabel(catalogue, intent.section, intent.field)}`,
          lines: [sharedField ? { label: 'Language', after: 'Same in every language' } : languageLine(row), { label: field.label, before: shown(values[field.name], field.type), after: shown(intent.value, field.type) }],
          warn: limit && length > limit ? `This is ${length} characters. The limit here is ${limit}, so shorten it or it will not save.` : undefined,
          guess,
          confirmLabel: 'Apply',
          run: () => saveChange(row, { [field.name]: intent.value }, previous),
        },
        `${field.label}: ${intent.value}`,
      );
    },
    [ask, catalogue, note, rowFor, saveChange, snapshot],
  );

  const proposeRow = useCallback(
    async (intent: IntentOf<'appendListItem'>, guess = false) => {
      const section = findSection(catalogue, intent.section);
      const list = findField(catalogue, intent.section, intent.field);
      if (!section || !list || list.type !== 'list') return note('That list is not on the website any more.', { tone: 'warn' });
      const row = rowFor(intent.section, intent.field);
      const { values, previous } = await snapshot(row);
      const rows = (values[list.name] as Row[] | undefined) ?? [];
      if (list.max && rows.length >= list.max) return say(`There is room for ${list.max} here and all are used. Remove one first.`, REPLIES[live.current.lang].again, { tone: 'warn' });
      const lines: Line[] = [languageLine(row), ...(list.fields ?? []).filter((field) => intent.item[field.name]).map((field) => ({ label: field.label, after: intent.item[field.name] }))];
      const what = list.itemLabel ?? 'row';

      if (intent.needsEditor) {
        ask(
          {
            title: `Start a new ${what} in ${section.label}`,
            lines,
            guess,
            confirmLabel: 'Open the row',
            run: async () => {
              const form = formFor(row);
              if (form) form.appendRow(list.name, intent.item);
              else {
                stashRow({ key: row, list: list.name, item: intent.item });
                router.push(sectionHref(intent.section, splitRow(row).lang));
              }
              lastSection.current = intent.section;
              return { ok: true, done: `The new ${what} is open in the form. Fill in the rest, then save.` };
            },
          },
          `New ${what}`,
        );
        return;
      }
      const added = Object.fromEntries((list.fields ?? []).map((field) => [field.name, intent.item[field.name] ?? '']));
      ask(
        { title: `Add a ${what} to ${section.label}`, lines, guess, confirmLabel: 'Add it', run: () => saveChange(row, { [list.name]: [...rows, added] }, previous) },
        `New ${what}: ${Object.values(intent.item).join(', ')}`,
      );
    },
    [ask, catalogue, formFor, note, rowFor, router, saveChange, say, snapshot],
  );

  const proposePhoto = useCallback(
    async (target: Target, url: string, guess = false) => {
      const field = findField(catalogue, target.section, target.field);
      if (!field) return;
      const { values, previous } = await snapshot(target.section);
      ask(
        {
          title: `Change ${targetLabel(catalogue, target.section, target.field)}`,
          lines: [],
          photos: { before: String(values[field.name] ?? ''), after: [url] },
          guess,
          confirmLabel: 'Use this photo',
          run: () => saveChange(target.section, { [field.name]: url }, previous),
        },
        `New ${field.label.toLowerCase()}`,
      );
    },
    [ask, catalogue, saveChange, snapshot],
  );

  const proposeGallery = useCallback(
    (photos: Uploaded[], startAlbum: string) => {
      setAlbum(startAlbum);
      ask(
        {
          title: photos.length === 1 ? 'Add this photo to the gallery' : `Add ${photos.length} photos to the gallery`,
          lines: [],
          photos: { after: photos.map((photo) => photo.url) },
          album: true,
          confirmLabel: 'Add to gallery',
          run: async (name) => {
            const result = await addGalleryPhotosAction({ album: name, photos: photos.map((photo) => ({ url: photo.url, width: photo.width, height: photo.height })) }, 'voice');
            if (!result.ok) return { ok: false, error: result.fields?.album ?? result.error };
            return { ok: true, done: `Added to the album "${name.trim() || 'General'}". It is on the Gallery page now.` };
          },
        },
        photos.length === 1 ? 'Add this photo to the gallery' : `Add ${photos.length} photos to the gallery`,
      );
    },
    [ask],
  );

  const proposeVisibility = useCallback(
    async (intent: IntentOf<'hideSection'> | IntentOf<'showSection'>, guess = false) => {
      const section = findSection(catalogue, intent.section);
      if (!section) return note('That section is not on the website any more.', { tone: 'warn' });
      const hide = intent.kind === 'hideSection';
      const { previous } = await snapshot(intent.section);
      ask(
        {
          title: `${hide ? 'Hide' : 'Show'} ${section.page} › ${section.label}`,
          lines: [{ label: 'On the website', before: hide ? 'Shown' : 'Hidden', after: hide ? 'Hidden' : 'Shown' }],
          guess,
          confirmLabel: hide ? 'Hide it' : 'Show it',
          run: async () => {
            const form = formFor(intent.section);
            const result = form ? await form.setHidden(hide) : await setHiddenAction(intent.section, hide, 'voice');
            if (!result.ok) return { ok: false, error: result.error };
            undo.current.push({ key: intent.section, previous });
            lastSection.current = intent.section;
            return { ok: true, done: `Saved as a draft: ${section.label} will be ${hide ? 'hidden' : 'shown'} once you publish.` };
          },
        },
        `${hide ? 'Hide' : 'Show'} ${section.label}`,
      );
    },
    [ask, catalogue, formFor, note, snapshot],
  );

  const proposeNotice = useCallback(
    (intent: IntentOf<'addNotice'>, guess = false) => {
      ask(
        {
          title: 'Put up a public notice from today',
          lines: [{ label: 'Title', after: intent.title }, ...(intent.body ? [{ label: 'Details', after: intent.body }] : [])],
          guess,
          confirmLabel: 'Put it up',
          run: async () => {
            const result = await createNoticeAction({ title: intent.title, body: intent.body }, 'voice');
            if (!result.ok) return { ok: false, error: Object.values(result.fields ?? {})[0] ?? result.error };
            return { ok: true, done: 'The notice is on the website. Open Notices to add a photo or an end date.' };
          },
        },
        `Notice: ${intent.title}`,
      );
    },
    [ask],
  );

  const proposePublish = useCallback(
    async (intent: IntentOf<'publish'>) => {
      const { drafts } = await fetchStates();
      const form = bridge?.form() ?? null;
      const unsaved = form && form.isDirty() && (!intent.section || intent.section === splitRow(form.key).section) ? form : null;
      // Every language of the section (or of the whole site) that has a draft waiting.
      const keys = new Set(drafts.filter((key) => !intent.section || splitRow(key).section === intent.section));
      if (unsaved) keys.add(unsaved.key);
      if (!keys.size) return say('There is nothing waiting to be published.', REPLIES[live.current.lang].nothing);
      const labels = [...keys].map((key) => rowLabel(key));
      ask(
        {
          title: keys.size === 1 ? 'Publish 1 change' : `Publish ${keys.size} changes`,
          lines: labels.map((label) => ({ label: 'Goes live', after: label })),
          warn: 'Visitors will see this straight away.',
          confirmLabel: 'Publish now',
          run: async () => {
            if (unsaved) {
              const saved = await unsaved.save();
              if (!saved.ok) return { ok: false, error: saved.error };
            }
            if (intent.section) {
              for (const key of keys) {
                const result = await publishAction(key, null, 'voice');
                if (!result.ok) return { ok: false, error: result.error };
              }
            } else {
              const result = await publishAllAction('voice');
              if (!result.ok) return { ok: false, error: result.error };
            }
            undo.current = [];
            return { ok: true, done: `Published: ${labels.join(', ')}. Visitors see it now.` };
          },
        },
        keys.size === 1 ? `Publish ${labels[0]}` : `Publish ${keys.size} changes`,
      );
    },
    [ask, bridge, fetchStates, rowLabel, say],
  );

  const proposeUndo = useCallback(async () => {
    const last = undo.current[undo.current.length - 1];
    if (last) {
      ask(
        {
          title: 'Undo the last spoken change',
          lines: [{ label: 'Put back', after: rowLabel(last.key) }],
          confirmLabel: 'Undo it',
          run: async () => {
            const result = await restoreDraftAction(last.key, last.previous);
            if (!result.ok) return { ok: false, error: result.error };
            undo.current.pop();
            return { ok: true, done: `${rowLabel(last.key)} is back to how it was.` };
          },
        },
        'Undo the last change',
      );
      return;
    }
    const result = await latestRevisionAction();
    if (!result.ok || !result.data) return say('There is nothing to undo.', REPLIES[live.current.lang].nothing);
    const revision = result.data;
    ask(
      {
        title: 'Undo the last publish',
        lines: [{ label: 'Goes back to before', after: `${rowLabel(revision.key)}, published ${formatDateTime(revision.at)}${revision.by ? ` by ${revision.by}` : ''}` }],
        warn: 'This changes the live site straight away.',
        confirmLabel: 'Restore it',
        run: async () => {
          const restored = await restoreRevisionAction(revision.id, 'voice');
          if (!restored.ok) return { ok: false, error: restored.error };
          return { ok: true, done: `${revision.label} is back to the earlier version. Visitors see it now.` };
        },
      },
      `Undo the last publish of ${revision.label}`,
    );
  }, [ask, rowLabel, say]);

  /* ───────────── photos ───────────── */

  const openPicker = useCallback(
    (next: Picker) => {
      setPending(null);
      setChoice(null);
      setPicker(next);
      voiceRef.current.touch();
      say(next.kind === 'gallery' ? 'Choose the photos for the gallery.' : `Choose the new photo for ${targetLabel(catalogue, next.section, next.field)}.`, REPLIES[live.current.lang].photo);
      // Works when the command was typed or tapped. After a spoken command the
      // browser wants a tap first, which is what the buttons on the card are for.
      window.setTimeout(() => {
        try {
          (next.camera ? cameraInput.current : fileInput.current)?.click();
        } catch {
          /* the card's buttons are there */
        }
      }, 50);
    },
    [catalogue, say],
  );

  async function onFiles(list: FileList | null) {
    const target = live.current.picker;
    const files = imagesFrom(list);
    if (!target || !files.length) return;
    const chosen = target.kind === 'gallery' ? files.slice(0, 30) : files.slice(0, 1);
    setUploading(0);
    const fractions = chosen.map(() => 0);
    const { done, failed } = await uploadMany(chosen, target.kind === 'gallery' ? 'gallery' : 'website', (index, fraction) => {
      fractions[index] = Math.max(0, fraction);
      setUploading(fractions.reduce((sum, value) => sum + value, 0) / fractions.length);
    });
    setUploading(null);
    if (failed.length) note(failed[0].error, { tone: 'warn' });
    if (!done.length) return;
    try {
      if (target.kind === 'gallery') proposeGallery(done, target.album);
      else await proposePhoto(target, done[0].url, target.guess);
    } catch (error) {
      note(error instanceof Error ? error.message : 'Something went wrong. Try again.', { tone: 'warn' });
    }
  }

  /* ───────────── carrying an intent out ───────────── */

  const runPending = useCallback(async () => {
    const card = live.current.pending;
    if (!card || live.current.applying) return;
    setApplying(true);
    let outcome: Outcome;
    try {
      outcome = await card.run(live.current.album);
    } catch (error) {
      outcome = { ok: false, error: error instanceof Error ? error.message : 'Something went wrong. Try again.' };
    }
    setApplying(false);
    if (!outcome.ok) {
      // The card stays, so the wording can be said again or cancelled.
      say(outcome.error, REPLIES[live.current.lang].again, { tone: 'warn' });
      return;
    }
    setPending(null);
    setApplied(nextId());
    cueDone();
    const replies = REPLIES[live.current.lang];
    say(outcome.done, card.confirmLabel === 'Publish now' ? replies.published : card.title.startsWith('Undo') ? replies.undone : replies.saved, { tone: 'ok' });
    announceChange();
    router.refresh();
    void fetchStates().catch(() => undefined);
  }, [fetchStates, router, say]);

  const dispatch = useCallback(
    async (intent: Intent, guess = false): Promise<void> => {
      const replies = REPLIES[live.current.lang];
      const candidates = 'candidates' in intent ? (intent.candidates ?? []) : [];
      if (candidates.length > 1) {
        setPending(null);
        setPicker(null);
        setChoice({ intent, candidates });
        voiceRef.current.touch();
        say('That could be more than one place. Which did you mean?', replies.which);
        return;
      }

      switch (intent.kind) {
        case 'confirm':
          if (live.current.pending) return runPending();
          return say('There is nothing waiting for a yes.', replies.nothing);
        case 'cancel':
          if (!live.current.pending && !live.current.choice && !live.current.picker) return say('There is nothing to cancel.', replies.nothing);
          clearCards();
          return say('Cancelled. Nothing was changed.', replies.cancelled);
        case 'choose': {
          const waiting = live.current.choice;
          const picked = waiting?.candidates[intent.index];
          if (!waiting || !picked) return say('There is no list to choose from just now.', replies.nothing);
          setChoice(null);
          return dispatch(resolveChoice(waiting.intent, picked, catalogue), guess);
        }
        case 'setField':
          return proposeSet(intent, guess);
        case 'appendListItem':
          return proposeRow(intent, guess);
        case 'pickImage':
          return openPicker({ kind: 'field', section: intent.section, field: intent.field, camera: intent.camera, guess });
        case 'addGalleryPhoto':
          return openPicker({ kind: 'gallery', album: intent.album, camera: intent.camera });
        case 'addNotice':
          return proposeNotice(intent, guess);
        case 'hideSection':
        case 'showSection':
          return proposeVisibility(intent, guess);
        case 'publish':
          return proposePublish(intent);
        case 'undo':
          return proposeUndo();
        case 'navigate': {
          clearCards();
          // Going to a section keeps the language being edited.
          const key = intent.to.startsWith('/hq/website/') ? decodeURIComponent(intent.to.slice('/hq/website/'.length)) : '';
          router.push(key && findSection(catalogue, key) ? sectionHref(key, live.current.editLang) : intent.to);
          return say(`Opening ${intent.label}.`, replies.opening(intent.label));
        }
        case 'editLanguage': {
          clearCards();
          setEditLang(intent.lang);
          if (currentRef.current) router.push(sectionHref(currentRef.current, intent.lang));
          return note(intent.lang === 'en' ? 'Now editing the English wording.' : `Now editing the ${LANG_NAMES[intent.lang].english} wording. Photos, links and phone numbers stay shared with English.`);
        }
        case 'preview': {
          const result = await setPreviewAction(true);
          if (!result.ok) return note(result.error, { tone: 'warn' });
          const path = (currentRef.current && findSection(catalogue, currentRef.current)?.path) || '/';
          window.open(path, '_blank');
          return note('Preview is on in this browser: the website shows your drafts. Visitors still see the published site.', { href: path });
        }
        case 'help':
          setHelp(true);
          return;
        case 'stop':
          voiceRef.current.stop();
          return note('Stopped listening. Tap the mic to start again.');
        case 'dictation':
          setDictation(intent.on);
          return note(intent.on ? 'Dictation is on: click into a box and speak. Say "stop dictation" to finish.' : 'Dictation is off.');
        case 'dictate': {
          const form = bridge?.form();
          if (form?.insertText(intent.text)) return note(`Typed: ${intent.text}`, { tone: 'ok' });
          return say('Open a section and click into a text box first, then say "write" and your words.', replies.again, { tone: 'warn' });
        }
        case 'unknown':
          if (intent.reason === 'no-value' && intent.section && intent.field) {
            return say(`What should ${targetLabel(catalogue, intent.section, intent.field)} say? Try: "change it to …" with the new words.`, replies.again, { tone: 'warn' });
          }
          if (intent.reason === 'no-target') return say('Which section? Say its name, like "hide the testimonials section".', replies.again, { tone: 'warn' });
          return say('I did not catch that as a command. Try: "Change the home banner heading to Admissions open". Say "help" for more.', replies.again, { tone: 'warn' });
      }
    },
    [bridge, catalogue, clearCards, note, openPicker, proposeNotice, proposePublish, proposeRow, proposeSet, proposeUndo, proposeVisibility, router, runPending, say],
  );

  /** Every sentence arrives here, whether it was spoken or typed. */
  const handle = useCallback(
    async (alternatives: string[]) => {
      const heard = alternatives.map((line) => line.trim()).filter(Boolean);
      if (!heard.length) return;
      setHelp(false);
      setEntries((list) => [...list.slice(-30), { id: nextId(), who: 'you', text: heard[0] }]);

      const intent = parseCommand(heard, catalogue, { currentSection: currentRef.current, lastSection: lastSection.current, hiddenSections: hidden.current });

      // With dictation on, everything that is not an instruction to the assistant itself is typed.
      if (live.current.dictation && !['dictation', 'stop', 'confirm', 'cancel', 'help'].includes(intent.kind)) {
        if (bridge?.form()?.insertText(heard[0])) return;
        return note('Click into a text box first, then speak.', { tone: 'warn' });
      }

      setWorking(true);
      try {
        if (intent.kind === 'unknown' && (intent.reason ?? 'not-understood') === 'not-understood') {
          if (!freeForm) {
            note('Free-form understanding is off, so I only follow set commands.', { tone: 'warn' });
            return await dispatch(intent);
          }
          const response = await fetch('/api/voice/interpret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alternatives: heard.slice(0, 3) }) });
          const result = (await response.json()) as { ok: boolean; data?: { enabled: boolean; intent: unknown; problem: string | null }; error?: string };
          if (!result.ok) return note(result.error || 'Could not work that out. Try the set commands.', { tone: 'warn' });
          // Checked again here: what comes over the network is never taken on trust.
          const guessed = result.data?.intent ? intentSchema.safeParse(result.data.intent) : null;
          if (guessed?.success) return await dispatch(guessed.data, true);
          if (result.data?.problem === 'slow') note('That took too long to work out.', { tone: 'warn' });
          return await dispatch(intent);
        }
        await dispatch(intent);
      } catch (error) {
        note(error instanceof Error ? error.message : 'Something went wrong. Try again.', { tone: 'warn' });
      } finally {
        setWorking(false);
      }
    },
    [bridge, catalogue, dispatch, freeForm, note],
  );
  handleRef.current = (alternatives) => void handle(alternatives);

  /* ───────────── the screen ───────────── */

  const supported = voice.supported;
  const listening = voice.listening;
  const problem = supported === false ? UNSUPPORTED : voice.errorCode ? VOICE_ERRORS[voice.errorCode] : '';

  function toggleMic() {
    if (!open) setOpen(true);
    if (supported) voice.toggle();
  }

  function close() {
    voice.stop();
    window.speechSynthesis?.cancel();
    setOpen(false);
  }

  const groups = EXAMPLES[lang];

  return (
    <>
      {/* Bars that rise and fall while the mic is on. Local, because the shared Tailwind config is not ours to extend. */}
      <style>{'@keyframes mk-voice-bar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}@keyframes mk-voice-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}'}</style>

      {open ? (
        <section
          aria-label="Voice assistant"
          className="no-print fixed inset-x-0 bottom-0 z-40 flex max-h-[82dvh] flex-col rounded-t-3xl border border-ink-200 bg-white shadow-lift sm:inset-x-auto sm:bottom-24 sm:right-6 sm:max-h-[min(640px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-3xl"
          style={{ animation: 'mk-voice-in .28s cubic-bezier(.2,.7,.2,1) both' }}
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-ink-100 px-4 py-3">
            <p className="min-w-0 flex-1 truncate font-display text-lg font-bold text-ink-900">Voice</p>
            <div className="flex rounded-lg border border-ink-200 p-0.5" role="group" aria-label="Language you speak in">
              {VOICE_LANGS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={lang === item.value}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => {
                    setLang(item.value);
                    remember(LANG_KEY, item.value);
                  }}
                  className={cn('h-8 min-w-9 rounded-md px-1.5 text-sm font-bold transition', lang === item.value ? 'bg-brand-700 text-white' : 'text-ink-600 hover:bg-ink-100')}
                >
                  {item.short}
                </button>
              ))}
            </div>
            <IconButton
              label={sound ? 'Spoken replies are on' : 'Spoken replies are off'}
              onClick={() => {
                setSound(!sound);
                remember(SOUND_KEY, sound ? 'off' : 'on');
                if (sound) window.speechSynthesis?.cancel();
              }}
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </IconButton>
            <IconButton label="Examples of what to say" onClick={() => setHelp((value) => !value)}>
              <HelpCircle size={18} />
            </IconButton>
            <IconButton label="Close" onClick={close}>
              <X size={19} />
            </IconButton>
          </header>

          <label className="flex shrink-0 items-center gap-2 border-b border-ink-100 px-4 py-2 text-sm">
            <span className="font-semibold text-ink-600">Changes go to</span>
            <select
              value={editLang}
              aria-label="Which language of the website to change"
              onChange={(event) => {
                const next = event.target.value as Lang;
                setEditLang(next);
                if (currentRef.current) router.push(sectionHref(currentRef.current, next));
              }}
              className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-sm font-semibold text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
            >
              {LANGS.map((code) => (
                <option key={code} value={code}>
                  {LANG_NAMES[code].own}
                  {code === 'en' ? '' : ` (${LANG_NAMES[code].english})`}
                </option>
              ))}
            </select>
            <span className="min-w-0 flex-1 truncate text-ink-500">{editLang === 'en' ? 'the English site' : 'wording only'}</span>
          </label>

          {/* what the mic is doing */}
          <div className={cn('flex min-h-[52px] shrink-0 items-center gap-3 px-4 py-2.5 text-sm', listening ? 'bg-accent-50' : 'bg-ink-50')} aria-live="polite">
            {listening ? (
              <>
                <span className="flex h-6 items-center gap-[3px]" aria-hidden>
                  {[0, 1, 2, 3, 4].map((bar) => (
                    <span key={bar} className="h-6 w-1 origin-center rounded-full bg-accent-500" style={{ animation: `mk-voice-bar ${voice.interim ? 0.45 : 0.9}s ease-in-out ${bar * 0.11}s infinite` }} />
                  ))}
                </span>
                <span className={cn('min-w-0 flex-1', voice.interim ? 'font-medium text-ink-900' : 'text-accent-700')}>{voice.interim || `${REPLIES[lang].listening}…`}</span>
              </>
            ) : problem ? (
              <>
                <MicOff size={18} className="shrink-0 text-ink-400" />
                <span className="min-w-0 flex-1 text-ink-700">{problem}</span>
              </>
            ) : (
              <>
                <Mic size={18} className="shrink-0 text-ink-400" />
                <span className="min-w-0 flex-1 text-ink-600">{supported === null ? 'Getting ready' : 'Tap the mic and say what to change.'}</span>
              </>
            )}
            {dictation ? <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800">Dictation</span> : null}
          </div>

          <div ref={log} className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {entries.length === 0 && !help ? (
              <div className="py-2 text-sm text-ink-600">
                <p className="font-semibold text-ink-800">Try saying</p>
                <ul className="mt-1.5 space-y-1.5">
                  {groups.slice(0, 3).map((group) => (
                    <li key={group.title}>
                      <button type="button" onClick={() => setTyped(group.lines[0])} className="rounded-xl bg-brand-50 px-3 py-2 text-left font-medium text-brand-800 hover:bg-brand-100">
                        “{group.lines[0]}”
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-ink-500">Every change is shown to you first. Nothing happens until you say yes.</p>
              </div>
            ) : null}

            {entries.map((entry) => (
              <div key={entry.id} className={cn('flex animate-fade-up', entry.who === 'you' ? 'justify-end' : 'justify-start')}>
                <p
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3.5 py-2 text-sm',
                    entry.who === 'you' ? 'rounded-br-md bg-brand-700 text-white' : entry.tone === 'ok' ? 'rounded-bl-md bg-mint-50 text-mint-700' : entry.tone === 'warn' ? 'rounded-bl-md bg-sun-50 text-sun-700' : 'rounded-bl-md bg-ink-100 text-ink-800',
                  )}
                >
                  {entry.tone === 'ok' ? <Check size={15} className="-mt-0.5 mr-1 inline" /> : null}
                  {entry.text}
                  {entry.href ? (
                    <a href={entry.href} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 font-semibold underline">
                      <ExternalLink size={14} /> Open the website
                    </a>
                  ) : null}
                </p>
              </div>
            ))}

            {working ? (
              <p className="flex items-center gap-2 text-sm text-ink-500">
                <Loader2 size={15} className="animate-spin" /> Working it out
              </p>
            ) : null}

            {help ? (
              <div className="animate-fade-up rounded-2xl border border-ink-200 p-3 text-sm">
                <p className="font-bold text-ink-900">Things you can say</p>
                {groups.map((group) => (
                  <div key={group.title} className="mt-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{group.title}</p>
                    <ul className="mt-1 space-y-1">
                      {group.lines.map((line) => (
                        <li key={line}>
                          <button type="button" onClick={() => { setTyped(line); setHelp(false); }} className="text-left text-ink-700 hover:text-brand-700 hover:underline">
                            {line}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {choice ? (
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3" style={{ animation: 'mk-voice-in .28s cubic-bezier(.2,.7,.2,1) both' }}>
                <p className="text-sm font-bold text-brand-900">Did you mean</p>
                <ul className="mt-2 space-y-1.5">
                  {choice.candidates.map((candidate, index) => (
                    <li key={`${candidate.section}.${candidate.field}`}>
                      <button
                        type="button"
                        onClick={() => {
                          const waiting = choice;
                          setChoice(null);
                          void dispatch(resolveChoice(waiting.intent, candidate, catalogue)).catch((error: unknown) => note(error instanceof Error ? error.message : 'Something went wrong.', { tone: 'warn' }));
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-left text-sm font-semibold text-ink-800 shadow-sm hover:bg-brand-100"
                      >
                        <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-700 text-xs text-white">{index + 1}</span>
                        {targetLabel(catalogue, candidate.section, candidate.field || undefined)}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-brand-800">Tap one, or say “the first one”.</p>
              </div>
            ) : null}

            {picker ? (
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3" style={{ animation: 'mk-voice-in .28s cubic-bezier(.2,.7,.2,1) both' }}>
                <p className="text-sm font-bold text-brand-900">{picker.kind === 'gallery' ? `Photos for the gallery${picker.album ? `, album ${picker.album}` : ''}` : `New photo for ${targetLabel(catalogue, picker.section, picker.field)}`}</p>
                {uploading !== null ? (
                  <div className="mt-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-brand-900">
                      <Loader2 size={15} className="animate-spin" /> Uploading {Math.round(uploading * 100)}%
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${Math.max(4, uploading * 100)}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => fileInput.current?.click()}>
                      <UploadCloud size={16} /> {picker.kind === 'gallery' ? 'Choose photos' : 'Choose a photo'}
                    </Button>
                    <Button size="sm" variant="secondary" className="hidden [@media(pointer:coarse)]:inline-flex" onClick={() => cameraInput.current?.click()}>
                      <Camera size={16} /> Take a photo
                    </Button>
                    {picker.kind === 'field' ? (
                      <Button size="sm" variant="secondary" onClick={() => setLibrary(true)}>
                        <FolderOpen size={16} /> From library
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => setPicker(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {pending ? (
              <div key={pending.id} className="rounded-2xl border border-brand-300 bg-white p-3.5 shadow-card ring-4 ring-brand-50" style={{ animation: 'mk-voice-in .28s cubic-bezier(.2,.7,.2,1) both' }}>
                <p className="flex items-start gap-2 text-[15px] font-bold text-ink-900">
                  <span className="min-w-0 flex-1">{pending.title}</span>
                  {pending.guess ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 text-xs font-bold text-sun-700">
                      <Sparkles size={12} /> Best guess
                    </span>
                  ) : null}
                </p>
                {pending.lines.map((line, index) => (
                  <div key={`${line.label}-${index}`} className="mt-2.5 text-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{line.label}</p>
                    {line.before !== undefined ? <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-ink-500 line-through decoration-ink-300">{line.before}</p> : null}
                    <p className="mt-0.5 line-clamp-6 whitespace-pre-line break-words font-semibold text-ink-900">{line.after}</p>
                  </div>
                ))}
                {pending.photos ? (
                  <div className="mt-2.5 flex items-center gap-2 overflow-x-auto">
                    {pending.photos.before ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pending.photos.before} alt="Current photo" className="h-20 w-20 shrink-0 rounded-xl bg-ink-100 object-cover opacity-50" />
                        <span className="shrink-0 text-ink-400" aria-hidden>
                          →
                        </span>
                      </>
                    ) : null}
                    {pending.photos.after.slice(0, 6).map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="New photo" className="h-20 w-20 shrink-0 rounded-xl bg-ink-100 object-cover ring-2 ring-brand-400" />
                    ))}
                    {pending.photos.after.length > 6 ? <span className="shrink-0 text-sm font-semibold text-ink-500">+{pending.photos.after.length - 6}</span> : null}
                  </div>
                ) : null}
                {pending.album ? (
                  <label className="mt-2.5 block text-sm">
                    <span className="text-xs font-bold uppercase tracking-wide text-ink-400">Album</span>
                    <input value={album} onChange={(event) => setAlbum(event.target.value)} maxLength={60} placeholder="General" className="control mt-1" />
                  </label>
                ) : null}
                {pending.warn ? <p className="mt-2.5 rounded-lg bg-sun-50 px-2.5 py-1.5 text-sm font-medium text-sun-700">{pending.warn}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <LoadingButton size="sm" loading={applying} onClick={() => void runPending()}>
                    {applying ? null : <Check size={16} />} {pending.confirmLabel}
                  </LoadingButton>
                  <Button size="sm" variant="secondary" disabled={applying} onClick={() => { setPending(null); note('Cancelled. Nothing was changed.'); }}>
                    Cancel
                  </Button>
                  <span className="text-xs text-ink-500">or say “yes” / “no”</span>
                </div>
              </div>
            ) : null}
          </div>

          <form
            className="flex shrink-0 items-center gap-2 border-t border-ink-100 px-3 py-2.5 pr-[5.25rem] sm:pr-3"
            onSubmit={(event) => {
              event.preventDefault();
              const text = typed.trim();
              if (!text) return;
              setTyped('');
              void handle([text]);
            }}
          >
            <Keyboard size={18} className="shrink-0 text-ink-400" aria-hidden />
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder="Or type a command"
              aria-label="Type a command instead of speaking"
              className="h-10 min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
            <button type="submit" disabled={!typed.trim() || working} aria-label="Send the command" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-700 text-white transition hover:bg-brand-800 disabled:opacity-40">
              <SendHorizontal size={18} />
            </button>
          </form>
        </section>
      ) : null}

      {/* the mic */}
      <div className="no-print fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        {listening ? (
          <>
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent-400" aria-hidden />
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent-400 [animation-delay:.7s]" aria-hidden />
          </>
        ) : null}
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={listening}
          aria-label={listening ? 'Stop listening' : supported === false ? 'Voice assistant (type commands: voice is not available in this browser)' : 'Voice assistant: tap and speak'}
          title={listening ? 'Stop listening' : supported === false ? UNSUPPORTED : 'Tap and say what to change'}
          className={cn(
            'relative grid h-16 w-16 place-items-center rounded-full text-white shadow-lift transition active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2',
            listening ? 'bg-accent-500 focus-visible:outline-accent-300' : supported === false ? 'bg-ink-400 focus-visible:outline-ink-300' : 'bg-brand-700 hover:bg-brand-800 focus-visible:outline-brand-300',
          )}
        >
          {supported === false ? <MicOff size={26} /> : <Mic size={28} />}
          {applied ? (
            <span key={applied} className="pointer-events-none absolute -right-0.5 -top-0.5 grid h-6 w-6 animate-scale-in place-items-center rounded-full bg-mint-500 text-white ring-2 ring-white" aria-hidden>
              <Check size={14} strokeWidth={3} />
            </span>
          ) : null}
        </button>
      </div>

      <input ref={fileInput} type="file" accept="image/*" multiple={picker?.kind === 'gallery'} className="hidden" onChange={(event) => { const list = event.target.files; void onFiles(list).finally(() => { event.target.value = ''; }); }} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { const list = event.target.files; void onFiles(list).finally(() => { event.target.value = ''; }); }} />
      <MediaPicker
        open={library}
        onClose={() => setLibrary(false)}
        onPick={(item) => {
          setLibrary(false);
          const target = live.current.picker;
          if (target?.kind === 'field') void proposePhoto(target, item.url, target.guess).catch((error: unknown) => note(error instanceof Error ? error.message : 'Something went wrong.', { tone: 'warn' }));
        }}
      />
    </>
  );
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-600 transition hover:bg-ink-100">
      {children}
    </button>
  );
}

/** "The second one": the same request, now pointed at the place that was picked. */
function resolveChoice(intent: Intent, picked: Target, catalogue: Catalogue): Intent {
  switch (intent.kind) {
    case 'setField':
    case 'appendListItem':
    case 'pickImage':
      return { ...intent, section: picked.section, field: picked.field, candidates: undefined };
    case 'hideSection':
    case 'showSection':
      return { ...intent, section: picked.section, candidates: undefined };
    case 'navigate': {
      const section = findSection(catalogue, picked.section);
      return { ...intent, to: `/hq/website/${picked.section}`, label: section ? `${section.page} › ${section.label}` : picked.section, candidates: undefined };
    }
    default:
      return intent;
  }
}
