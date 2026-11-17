'use client';

/**
 * The form for one section of the website, drawn from the section's field
 * list. Nothing here knows about any particular section.
 *
 * Save draft keeps the work without touching the live site; Publish makes it
 * live. The preview pane (wide screens) shows the saved draft on the real page.
 */
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, ExternalLink, Monitor, Plus, RotateCcw, Save, Send, Smartphone, Trash2, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ContentData, Field as FieldDef, ListField, ScalarField } from '@/cms/types';
import { Badge, Button, Card, Input, Notice, Select, Textarea } from '@/components/ui/core';
import { ConfirmButton, LoadingButton, useToast } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { rich } from '@/i18n/rich';
import type { ActionResult } from '@/lib/api';
import { cn } from '@/lib/cn';
import { LANGS, LANG_NAMES, localePath, type Lang } from '@/lib/i18n';
import { discardDraftAction, publishAction, resetToDefaultAction, saveDraftAction, setHiddenAction, setPreviewAction } from '@/server/cms/actions';
import type { RevisionRow, SectionState } from '@/server/cms/service';
import { ImageInput } from './image-input';
import { RevisionList } from './revision-list';
import { takeRow, useRegisterForm } from './voice-bridge';

export type FormSection = { key: string; page: string; label: string; description?: string; path?: string; fields: FieldDef[] };
type Row = Record<string, string>;
type Focus = { name: string; list?: string; row?: number };

/** Wording and lists differ by language; photos, links, phones and choices are shared from English. */
const isTranslatable = (field: FieldDef) => field.type === 'text' || field.type === 'textarea' || field.type === 'list';

/** The fields this form edits: all of them in English, the wording ones in a translation. */
const editableFields = (section: FormSection, lang: Lang) => (lang === 'en' ? section.fields : section.fields.filter(isTranslatable));

/** The editable values: what the form's fields hold, without the hidden marker. */
function fieldsOnly(fields: FieldDef[], data: ContentData): ContentData {
  const out: ContentData = {};
  for (const field of fields) out[field.name] = data[field.name] ?? (field.type === 'list' ? [] : '');
  return out;
}

/** Bengali and Hindi letters carry marks above and below the line: they need their own font and more room. */
const scriptStyle = (lang: Lang) => (lang === 'en' ? undefined : { fontFamily: `var(--font-body-${lang}), var(--font-body-latin)`, lineHeight: 1.7 });

// Ids for rows added after the screen opened. The rows a section starts with are
// named by their place instead, so the server and the browser agree on them.
let rowSeed = 0;
const newRowId = () => `row-${(rowSeed += 1)}`;

const count = (text: string) => [...text].length;

export function SectionForm({ section, state, revisions }: { section: FormSection; state: SectionState; revisions: RevisionRow[] }) {
  const t = useT();
  const lang = state.lang;
  const rowKey = state.key;
  const fields = useMemo(() => editableFields(section, lang), [section, lang]);
  const router = useRouter();
  const toast = useToast();
  const [server, setServer] = useState(state);
  const [values, setValues] = useState<ContentData>(() => fieldsOnly(fields, state.draft ?? state.published));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<'save' | 'publish' | 'hide' | null>(null);
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop');
  const [previewTick, setPreviewTick] = useState(0);
  // Rows need a name that survives reordering, for React and for "which rows are open".
  const [rowIds, setRowIds] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(fields.filter((field) => field.type === 'list').map((field) => [field.name, (((state.draft ?? state.published)[field.name] as Row[]) ?? []).map((_, index) => `${field.name}-start-${index}`)])),
  );
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const focus = useRef<Focus | null>(null);

  const baseline = useMemo(() => fieldsOnly(fields, server.draft ?? server.published), [fields, server]);
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(baseline), [values, baseline]);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const valuesRef = useRef(values);
  valuesRef.current = values;

  /** Takes what the server now holds as the truth for the form. */
  const adopt = useCallback(
    (next: SectionState) => {
      const data = fieldsOnly(fields, next.draft ?? next.published);
      setServer(next);
      setValues(data);
      setErrors({});
      setRowIds((current) =>
        Object.fromEntries(
          fields
            .filter((field) => field.type === 'list')
            .map((field) => {
              const rows = data[field.name] as Row[];
              const ids = current[field.name] ?? [];
              // The server drops empty rows; when the count still matches, keep the ids so open rows stay open.
              return [field.name, ids.length === rows.length ? ids : rows.map(newRowId)];
            }),
        ),
      );
      setPreviewTick((tick) => tick + 1);
    },
    [fields],
  );

  // The page was refreshed from the server (a voice change, a restore): follow it, unless there is unsaved typing.
  useEffect(() => {
    if (state.updatedAt !== server.updatedAt && !dirtyRef.current) adopt(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.updatedAt]);

  /* ───── leaving with unsaved changes ───── */
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    // Next has no "before route change" hook, so in-app links are caught at the click.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      if (!window.confirm(t('You have changes that are not saved. Leave without saving?'))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);

  /* ───── talking to the server ───── */
  const finish = useCallback(
    (result: ActionResult<SectionState>, done: string): boolean => {
      if (!result.ok) {
        setErrors(result.fields ?? {});
        // Open the rows that hold a problem, so it can be seen.
        const bad = Object.keys(result.fields ?? {}).map((key) => key.split('.'));
        setOpenRows((current) => {
          const next = new Set(current);
          for (const [list, index] of bad) if (index !== undefined) next.add(rowIds[list]?.[Number(index)] ?? '');
          return next;
        });
        toast.error(t(result.error));
        return false;
      }
      adopt(result.data);
      if (done) toast.success(done);
      router.refresh();
      return true;
    },
    [adopt, router, rowIds, toast],
  );

  const save = useCallback(
    async (next?: ContentData, via: 'panel' | 'voice' = 'panel', quiet = false) => {
      setBusy('save');
      const result = await saveDraftAction(rowKey, next ?? valuesRef.current, via);
      setBusy(null);
      finish(result, quiet ? '' : t('Draft saved. The live site has not changed.'));
      return result;
    },
    [finish, rowKey],
  );

  async function publish() {
    setBusy('publish');
    const result = await publishAction(rowKey, dirty ? values : null);
    setBusy(null);
    finish(result, t('Published. Visitors see it now.'));
  }

  const setHidden = useCallback(
    async (hidden: boolean, via: 'panel' | 'voice' = 'panel') => {
      setBusy('hide');
      const result = await setHiddenAction(rowKey, hidden, via);
      setBusy(null);
      if (result.ok) {
        // Only the hidden marker changed: keep whatever is typed and not saved.
        setServer(result.data);
        setPreviewTick((tick) => tick + 1);
        if (via === 'panel') toast.success(hidden ? t('Will be hidden once you publish') : t('Will show again once you publish'));
        router.refresh();
      } else toast.error(t(result.error));
      return result;
    },
    [router, rowKey, toast],
  );

  /* ───── editing ───── */
  const setField = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const rowsOf = (list: string) => (valuesRef.current[list] as Row[]) ?? [];
  const setRows = (list: string, rows: Row[], ids: string[]) => {
    setValues((current) => ({ ...current, [list]: rows }));
    setRowIds((current) => ({ ...current, [list]: ids }));
  };

  const appendRow = useCallback(
    (listName: string, item: Row) => {
      const list = fields.find((field) => field.name === listName && field.type === 'list') as ListField | undefined;
      if (!list) return;
      const rows = (valuesRef.current[listName] as Row[]) ?? [];
      if (list.max && rows.length >= list.max) {
        toast.error(t('There is room for {max} here. Remove one first.', { max: list.max }));
        return;
      }
      const id = newRowId();
      // A choice starts on its first option, as the dropdown shows it.
      const blank = Object.fromEntries(list.fields.map((field) => [field.name, item[field.name] ?? (field.type === 'select' ? (field.options?.[0]?.value ?? '') : '')]));
      setValues((current) => ({ ...current, [listName]: [...((current[listName] as Row[]) ?? []), blank] }));
      setRowIds((current) => ({ ...current, [listName]: [...(current[listName] ?? []), id] }));
      setOpenRows((current) => new Set(current).add(id));
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    },
    [fields, toast],
  );

  // A row dictated on another screen ("add a question …") is waiting for this form.
  useEffect(() => {
    const waiting = takeRow(rowKey);
    if (waiting) appendRow(waiting.list, waiting.item);
  }, [appendRow, rowKey]);

  const insertText = useCallback((text: string) => {
    const at = focus.current;
    if (!at) return false;
    const join = (before: string) => (before && !/\s$/.test(before) ? `${before} ${text}` : `${before}${text}`);
    setValues((current) => {
      if (!at.list) return { ...current, [at.name]: join(String(current[at.name] ?? '')) };
      const rows = [...((current[at.list] as Row[]) ?? [])];
      const row = rows[at.row ?? -1];
      if (!row) return current;
      rows[at.row as number] = { ...row, [at.name]: join(row[at.name] ?? '') };
      return { ...current, [at.list]: rows };
    });
    return true;
  }, []);

  useRegisterForm({
    key: rowKey,
    values: () => valuesRef.current,
    savedDraft: () => (server.draft ? fieldsOnly(fields, server.draft) : null),
    isDirty: () => dirtyRef.current,
    applyAndSave: (next) => save(next, 'voice', true),
    save: () => save(undefined, 'panel', true),
    setHidden: (hidden) => setHidden(hidden, 'voice'),
    appendRow,
    insertText,
  });

  /* ───── one field ───── */
  function scalar(field: ScalarField, value: string, onChange: (value: string) => void, errorKey: string, at: Focus, compact = false, english = '') {
    const wording = lang !== 'en' && (field.type === 'text' || field.type === 'textarea');
    const script = wording ? { lang, style: scriptStyle(lang) } : {};
    const error = errors[errorKey];
    const id = `f-${errorKey}`;
    const onFocus = () => {
      focus.current = at;
    };
    const length = count(value);
    const over = field.maxLength !== undefined && length > field.maxLength;

    let control;
    if (field.type === 'image') {
      control = <ImageInput value={value} onChange={onChange} label={t(field.label)} invalid={Boolean(error)} compact={compact} />;
    } else if (field.type === 'textarea') {
      control = <Textarea id={id} value={value} invalid={Boolean(error) || over} onFocus={onFocus} onChange={(event) => onChange(event.target.value)} rows={compact ? 3 : 4} placeholder={wording ? english : undefined} {...script} />;
    } else if (field.type === 'select') {
      control = (
        <Select id={id} value={value} invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)}>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </Select>
      );
    } else if (field.type === 'toggle') {
      control = (
        <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
          <input id={id} type="checkbox" checked={value === '1'} onChange={(event) => onChange(event.target.checked ? '1' : '')} className="peer sr-only" />
          <span className="relative h-7 w-12 shrink-0 rounded-full bg-ink-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
          <span className="text-[15px] font-medium text-ink-800">{value === '1' ? t('On') : t('Off')}</span>
        </label>
      );
    } else {
      const kind = { text: 'text', url: 'url', phone: 'tel', email: 'email' }[field.type];
      const mode = { text: undefined, url: 'url', phone: 'numeric', email: 'email' }[field.type] as 'url' | 'numeric' | 'email' | undefined;
      control = (
        <Input
          id={id}
          type={kind}
          inputMode={mode}
          value={value}
          invalid={Boolean(error) || over}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.type === 'url' ? 'https://' : field.type === 'phone' ? t('10 digit mobile number') : wording ? english : undefined}
          {...script}
        />
      );
    }

    return (
      <div key={errorKey}>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor={field.type === 'image' ? undefined : id} className="text-sm font-semibold text-ink-700">
            {t(field.label)}
          </label>
          {field.maxLength !== undefined && (field.type === 'text' || field.type === 'textarea') ? (
            <span className={cn('tabular shrink-0 text-xs font-medium', over ? 'text-accent-600' : length > field.maxLength * 0.9 ? 'text-sun-700' : 'text-ink-400')} aria-live={over ? 'polite' : undefined}>
              {length} / {field.maxLength}
            </span>
          ) : null}
        </div>
        {control}
        {error ? <p className="mt-1 text-sm font-medium text-accent-600">{t(error)}</p> : field.help && !wording ? <p className="mt-1 text-sm text-ink-500">{t(field.help)}</p> : null}
        {wording && !compact ? (
          <p className="mt-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-sm text-ink-600">
            <span className="font-semibold text-ink-500">{t('English:')} </span>
            {english ? <span className="whitespace-pre-line">{english}</span> : <span className="text-ink-400">{t('empty')}</span>}
            {!value ? <span className="mt-0.5 block text-ink-500">{t('Left empty, the website shows the English here.')}</span> : null}
          </p>
        ) : null}
      </div>
    );
  }

  /* ───── a repeating group ───── */
  function list(field: ListField) {
    const rows = (values[field.name] as Row[]) ?? [];
    const ids = rowIds[field.name] ?? [];
    const full = field.max !== undefined && rows.length >= field.max;
    const move = (from: number, to: number) => {
      const nextRows = [...rowsOf(field.name)];
      const nextIds = [...ids];
      nextRows.splice(to, 0, ...nextRows.splice(from, 1));
      nextIds.splice(to, 0, ...nextIds.splice(from, 1));
      setRows(field.name, nextRows, nextIds);
    };
    const toggle = (id: string) =>
      setOpenRows((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });

    return (
      <div key={field.name}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-ink-700">
            {t(field.label)}
            <span className="tabular ml-2 text-xs font-medium text-ink-400">
              {field.max ? t('{n} of {max}', { n: rows.length, max: field.max }) : rows.length}
            </span>
          </p>
          {rows.length > 1 ? (
            <button type="button" className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => setOpenRows((current) => (ids.every((id) => current.has(id)) ? new Set([...current].filter((id) => !ids.includes(id))) : new Set([...current, ...ids])))}>
              {ids.every((id) => openRows.has(id)) ? t('Close all') : t('Open all')}
            </button>
          ) : null}
        </div>
        {field.help ? <p className="-mt-1 mb-2 text-sm text-ink-500">{t(field.help)}</p> : null}
        {errors[field.name] ? <p className="mb-2 text-sm font-medium text-accent-600">{errors[field.name]}</p> : null}

        <ul className="space-y-2">
          {rows.map((row, index) => {
            const id = ids[index] ?? `${field.name}-${index}`;
            const open = openRows.has(id);
            const title = (field.titleField && row[field.titleField]) || Object.values(row).find((value) => value && !value.startsWith('/') && !value.startsWith('http')) || '';
            const hasError = Object.keys(errors).some((key) => key.startsWith(`${field.name}.${index}.`));
            return (
              <li key={id} id={id} className={cn('rounded-2xl border bg-white transition', hasError ? 'border-accent-300' : open ? 'border-brand-300 shadow-card' : 'border-ink-200')}>
                <div className="flex items-center gap-1 py-1.5 pl-2 pr-1.5">
                  <button type="button" onClick={() => toggle(id)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-ink-50">
                    <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">{index + 1}</span>
                    <span className={cn('min-w-0 flex-1 truncate text-[15px] font-semibold', title ? 'text-ink-900' : 'text-ink-400')}>{title || t('New {itemLabel}', { itemLabel: t(field.itemLabel) })}</span>
                    <ChevronDown size={18} className={cn('shrink-0 text-ink-400 transition', open && 'rotate-180')} />
                  </button>
                  <button type="button" aria-label={t('Move {itemLabel} {n} up', { itemLabel: t(field.itemLabel), n: index + 1 })} disabled={index === 0} onClick={() => move(index, index - 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-600 hover:bg-ink-100 disabled:opacity-30">
                    <ArrowUp size={18} />
                  </button>
                  <button type="button" aria-label={t('Move {itemLabel} {n} down', { itemLabel: t(field.itemLabel), n: index + 1 })} disabled={index === rows.length - 1} onClick={() => move(index, index + 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-600 hover:bg-ink-100 disabled:opacity-30">
                    <ArrowDown size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('Remove {itemLabel} {n}', { itemLabel: t(field.itemLabel), n: index + 1 })}
                    onClick={() => setRows(field.name, rows.filter((_, at) => at !== index), ids.filter((_, at) => at !== index))}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-accent-600 hover:bg-accent-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {open ? (
                  <div className="space-y-4 border-t border-ink-100 px-4 pb-4 pt-4">
                    {field.fields.map((sub) =>
                      scalar(
                        sub,
                        row[sub.name] ?? '',
                        (value) => setValues((current) => ({ ...current, [field.name]: ((current[field.name] as Row[]) ?? []).map((item, at) => (at === index ? { ...item, [sub.name]: value } : item)) })),
                        `${field.name}.${index}.${sub.name}`,
                        { name: sub.name, list: field.name, row: index },
                        true,
                      ),
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" disabled={full} onClick={() => appendRow(field.name, {})}>
            <Plus size={16} /> {t('Add {itemLabel}', { itemLabel: t(field.itemLabel) })}
          </Button>
          {full ? <span className="text-sm text-ink-500">{t('That is the most this section holds.')}</span> : null}
        </div>
      </div>
    );
  }

  const hiddenInDraft = server.hiddenInDraft;
  const canPublish = dirty || server.hasDraft;
  const shared = section.fields.filter((field): field is ScalarField => !isTranslatable(field));
  const sitePath = localePath(lang, section.path ?? '/');

  async function openOnSite() {
    // Opened at once (inside the click) so the browser does not treat it as a pop-up.
    const tab = window.open('', '_blank');
    await setPreviewAction(true);
    if (tab) tab.location.href = sitePath;
    else window.location.href = sitePath;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-sm font-semibold text-ink-600">{t('Language')}</p>
          <div className="flex rounded-xl border border-ink-200 bg-white p-1" role="group" aria-label={t('Language to edit')}>
            {LANGS.map((code) => (
              <Link
                key={code}
                href={code === 'en' ? `/admin/website/${section.key}` : `/admin/website/${section.key}?lang=${code}`}
                aria-current={code === lang ? 'true' : undefined}
                lang={code}
                className={cn('rounded-lg px-3.5 py-1.5 text-[15px] font-semibold transition', code === lang ? 'bg-brand-700 text-white shadow-sm' : 'text-ink-700 hover:bg-ink-100')}
              >
                {LANG_NAMES[code].own}
              </Link>
            ))}
          </div>
        </div>
        {lang !== 'en' ? (
          <Notice tone="blue">
            {t('You are editing the {language} wording. Each box shows the English under it. Leave a box empty to show the English there.', { language: t(LANG_NAMES[lang].english) })}
          </Notice>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? <Badge tone="amber">{t('Not saved yet')}</Badge> : server.hasDraft ? <Badge tone="blue">{t('Draft saved, not published')}</Badge> : <Badge tone="green">{t('Same as the live site')}</Badge>}
          {server.hidden ? <Badge tone="neutral"><EyeOff size={12} /> {t('Hidden on the site')}</Badge> : null}
          {hiddenInDraft !== server.hidden ? <Badge tone="amber">{hiddenInDraft ? t('Will be hidden when published') : t('Will show again when published')}</Badge> : null}
        </div>

        {Object.keys(errors).length ? <Notice tone="red">{t('Some fields need a look. They are marked in red below.')}</Notice> : null}

        <Card className="space-y-5 p-5">
          {fields.map((field) =>
            field.type === 'list' ? list(field) : scalar(field, String(values[field.name] ?? ''), (value) => setField(field.name, value), field.name, { name: field.name }, false, String(server.reference?.[field.name] ?? '')),
          )}
          {fields.length === 0 ? <p className="text-[15px] text-ink-600">{t('This section has no wording of its own: everything in it is the same in every language. Change it under English.')}</p> : null}
        </Card>

        {lang !== 'en' && shared.length ? (
          <Card className="p-5">
            <p className="text-sm font-bold text-ink-900">{t('Same in every language')}</p>
            <p className="mt-0.5 text-sm text-ink-500">
              {t('Photos, links, phone numbers and choices are shared.')}{' '}
              <Link href={`/admin/website/${section.key}`} className="font-semibold text-brand-700 hover:underline">
                {t('Change them under English')}
              </Link>
              .
            </p>
            <dl className="mt-3 divide-y divide-ink-100">
              {shared.map((field) => {
                const value = String(server.reference?.[field.name] ?? '');
                const option = field.type === 'select' ? field.options?.find((item) => item.value === value)?.label : undefined;
                return (
                  <div key={field.name} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-sm font-semibold text-ink-700">{t(field.label)}</dt>
                    <dd className="min-w-0 text-right text-sm text-ink-600">
                      {field.type === 'image' && value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={value} alt="" className="ml-auto h-12 w-20 rounded-lg bg-ink-100 object-cover" />
                      ) : (
                        <span className="break-all">{field.type === 'toggle' ? (value === '1' ? t('On') : t('Off')) : option || value || t('Empty')}</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Card>
        ) : null}

        {/* actions: stays in reach at the bottom of a phone screen */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="flex flex-wrap items-center gap-2 pr-16 sm:pr-0">
            <LoadingButton variant="secondary" loading={busy === 'save'} disabled={!dirty || busy !== null} onClick={() => void save()}>
              {busy === 'save' ? null : <Save size={18} />} {t('Save draft')}
            </LoadingButton>
            <ConfirmButton
              variant="primary"
              danger={false}
              disabled={!canPublish || busy !== null}
              title={lang === 'en' ? t('Publish "{label}"?', { label: t(section.label) }) : t('Publish "{label}" in {language}?', { label: t(section.label), language: t(LANG_NAMES[lang].english) })}
              text={t('Visitors will see these changes straight away. If it does not look right, you can go back to the earlier version from the list below.')}
              confirmLabel={t('Publish now')}
              onConfirm={publish}
            >
              <Send size={18} /> {t('Publish')}
            </ConfirmButton>
            {section.path ? (
              <Button variant="ghost" className="xl:hidden" onClick={() => void openOnSite()}>
                <ExternalLink size={18} /> {t('See it on the site')}
              </Button>
            ) : null}
          </div>
        </div>

        <Card className="p-5">
          <p className="text-sm font-bold text-ink-900">{t('More')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lang === 'en' ? (
              <LoadingButton variant="secondary" size="sm" loading={busy === 'hide'} disabled={busy !== null} onClick={() => void setHidden(!hiddenInDraft)}>
                {hiddenInDraft ? <Eye size={16} /> : <EyeOff size={16} />} {hiddenInDraft ? t('Show this section') : t('Hide this section')}
              </LoadingButton>
            ) : null}
            <ConfirmButton
              size="sm"
              variant="secondary"
              disabled={(!server.hasDraft && !dirty) || busy !== null}
              title={t('Discard the draft?')}
              text={t('Everything changed here since the last publish is thrown away. The live site stays as it is.')}
              confirmLabel={t('Discard draft')}
              onConfirm={async () => {
                finish(await discardDraftAction(rowKey), t('Draft discarded'));
              }}
            >
              <Undo2 size={16} /> {t('Discard draft')}
            </ConfirmButton>
            <ConfirmButton
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              title={lang === 'en' ? t('Put back the original wording?') : t('Put back the built-in {language} wording?', { language: t(LANG_NAMES[lang].english) })}
              text={t('The form is filled with the wording the website was built with, as a draft. Nothing goes live until you publish.')}
              confirmLabel={t('Reset to default')}
              danger={false}
              onConfirm={async () => {
                finish(await resetToDefaultAction(rowKey), t('Original wording put back as a draft'));
              }}
            >
              <RotateCcw size={16} /> {t('Reset to default')}
            </ConfirmButton>
          </div>
          <p className="mt-3 text-sm text-ink-500">
            {lang === 'en' ? t('Hiding takes the whole section off the page, in every language, without losing its content. Like every change, it goes live when you publish.') : t('To hide or show this section, switch to English: a section is hidden in every language at once.')}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-ink-900">{t('Earlier versions')}</p>
          <p className="mt-0.5 text-sm text-ink-500">{t('Every publish keeps what was live before it. Restore one to undo.')}</p>
          <RevisionList revisions={revisions} empty={t('Nothing has been published here yet.')} className="mt-3" />
        </Card>
      </div>

      {section.path ? (
        <aside className="hidden min-w-0 xl:block">
          <div className="sticky top-20">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink-900">
                {rich(t('Preview {rest}'), { rest: <span className="font-medium text-ink-500">{t('of your saved draft')}</span> })}
              </p>
              <div className="flex items-center gap-1">
                <div className="flex rounded-lg border border-ink-200 bg-white p-0.5" role="group" aria-label={t('Preview size')}>
                  {(['desktop', 'phone'] as const).map((kind) => (
                    <button key={kind} type="button" aria-pressed={device === kind} aria-label={kind === 'desktop' ? t('Computer') : t('Phone')} onClick={() => setDevice(kind)} className={cn('grid h-8 w-9 place-items-center rounded-md transition', device === kind ? 'bg-brand-700 text-white' : 'text-ink-500 hover:bg-ink-100')}>
                      {kind === 'desktop' ? <Monitor size={16} /> : <Smartphone size={16} />}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => void openOnSite()}>
                  <ExternalLink size={15} /> {t('Open')}
                </Button>
              </div>
            </div>
            <PreviewFrame path={sitePath} device={device} tick={previewTick} />
            {dirty ? <p className="mt-2 text-sm text-ink-500">{t('Save the draft to see your latest typing here.')}</p> : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

/**
 * The real page in a frame. Inside the edit panel a frame shows drafts
 * (see isPreview in src/cms/content.ts). The computer view is drawn at full
 * width and scaled down to fit, so it looks like the site, not like a phone.
 */
function PreviewFrame({ path, device, tick }: { path: string; device: 'desktop' | 'phone'; tick: number }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Reload in place after each save, which keeps the scroll position.
  useEffect(() => {
    if (tick === 0) return;
    try {
      frame.current?.contentWindow?.location.reload();
    } catch {
      if (frame.current) frame.current.src = path;
    }
  }, [tick, path]);

  const natural = device === 'desktop' ? 1280 : 390;
  const scale = width ? Math.min(1, width / natural) : 1;
  const height = 'calc(100dvh - 11rem)';

  return (
    <div ref={box} className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-100 shadow-card" style={{ height }}>
      <iframe
        ref={frame}
        src={path}
        title={t('Preview of the page')}
        className="origin-top-left border-0 bg-white"
        style={{ width: natural, height: `calc((100dvh - 11rem) / ${scale})`, transform: `scale(${scale})`, marginLeft: device === 'phone' && width > natural ? (width - natural) / 2 : 0 }}
      />
    </div>
  );
}
