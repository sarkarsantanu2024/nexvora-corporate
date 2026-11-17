'use client';

/** The edit panel's front page: every section of the website, grouped by page. */
import { ChevronRight, EyeOff, ExternalLink, History, Search, Send, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, LinkButton } from '@/components/ui/core';
import { ConfirmButton, useToast } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { LANG_NAMES, type Lang } from '@/lib/i18n';
import { discardAllAction, publishAllAction, setPreviewAction } from '@/server/cms/actions';

export type IndexSection = { key: string; page: string; label: string; description: string; aliases: string[]; fieldLabels: string[]; hasDraft: boolean; /** Languages with unpublished changes. */ draftLangs: Lang[]; hidden: boolean; hiddenInDraft: boolean };

export function SectionsIndex({ sections, previewOn }: { sections: IndexSection[]; previewOn: boolean }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [preview, setPreview] = useState(previewOn);
  // "Open home" by voice lands here with ?q=Home while the screen is already up.
  const asked = params.get('q') ?? '';
  useEffect(() => {
    if (asked) setQuery(asked);
  }, [asked]);
  const [switching, setSwitching] = useState(false);

  const drafts = sections.filter((section) => section.hasDraft);
  /** "Top banner (English, Bengali)": which languages of a section are waiting. */
  const waiting = (section: IndexSection) => (section.draftLangs.length === 1 && section.draftLangs[0] === 'en' ? t(section.label) : `${t(section.label)} (${section.draftLangs.map((code) => t(LANG_NAMES[code].english)).join(', ')})`);
  const groups = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const match = (section: IndexSection) => {
      const hay = [section.page, section.label, section.description, t(section.page), t(section.label), t(section.description), ...section.aliases, ...section.fieldLabels].join(' ').toLowerCase();
      return words.every((word) => hay.includes(word));
    };
    const out = new Map<string, IndexSection[]>();
    for (const section of sections) {
      if (!match(section)) continue;
      out.set(section.page, [...(out.get(section.page) ?? []), section]);
    }
    return [...out.entries()];
  }, [sections, query, t]);

  async function togglePreview(on: boolean, open: boolean) {
    // Opened inside the click, before the wait, or the browser calls it a pop-up.
    const tab = open ? window.open('', '_blank') : null;
    setSwitching(true);
    const result = await setPreviewAction(on);
    setSwitching(false);
    if (!result.ok) {
      tab?.close();
      toast.error(t(result.error));
      return;
    }
    setPreview(on);
    if (tab) tab.location.href = '/';
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* drafts waiting */}
      <Card className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 p-4', drafts.length ? 'border-sun-300 bg-sun-50' : '')}>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink-900">
            {drafts.length === 0 ? t('Everything is published') : drafts.length === 1 ? t('1 section has changes that are not published') : t('{n} sections have changes that are not published', { n: drafts.length })}
          </p>
          <p className="mt-0.5 text-sm text-ink-600">
            {drafts.length ? drafts.map(waiting).join(', ') : t('Visitors see the latest version of every section, in every language.')}
          </p>
        </div>
        {drafts.length ? (
          <div className="flex flex-wrap gap-2">
            <ConfirmButton
              variant="secondary"
              title={t('Discard all drafts?')}
              text={t('The saved changes to {sections} are thrown away. The live site stays as it is.', { sections: drafts.map(waiting).join(', ') })}
              confirmLabel={t('Discard all')}
              onConfirm={async () => {
                const result = await discardAllAction();
                if (!result.ok) toast.error(t(result.error));
                else toast.success(t('Drafts discarded'));
                router.refresh();
              }}
            >
              <Undo2 size={18} /> {t('Discard all')}
            </ConfirmButton>
            <ConfirmButton
              variant="primary"
              danger={false}
              title={drafts.length === 1 ? t('Publish 1 section?') : t('Publish {n} sections?', { n: drafts.length })}
              text={
                <>
                  {t('These go live for visitors straight away:')}
                  <span className="mt-2 block font-semibold text-ink-800">{drafts.map((section) => `${t(section.page)} › ${waiting(section)}`).join(', ')}</span>
                </>
              }
              confirmLabel={t('Publish all')}
              onConfirm={async () => {
                const result = await publishAllAction();
                if (!result.ok) toast.error(t(result.error));
                else toast.success(result.data.length === 1 ? t('Published 1 change') : t('Published {n} changes', { n: result.data.length }));
                router.refresh();
              }}
            >
              <Send size={18} /> {t('Publish all')}
            </ConfirmButton>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Find a section: phone, banner, address')} aria-label={t('Find a section')} className="control pl-10" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {preview ? (
            <>
              <Button variant="secondary" disabled={switching} onClick={() => void togglePreview(true, true)}>
                <ExternalLink size={18} /> {t('Open the preview')}
              </Button>
              <Button variant="ghost" disabled={switching} onClick={() => void togglePreview(false, false)}>
                {t('Switch preview off')}
              </Button>
            </>
          ) : (
            <Button variant="secondary" disabled={switching} onClick={() => void togglePreview(true, true)}>
              <ExternalLink size={18} /> {t('Preview the site')}
            </Button>
          )}
          <LinkButton href="/admin/website/history" variant="ghost">
            <History size={18} /> {t('Change history')}
          </LinkButton>
        </div>
      </div>

      {preview ? (
        <p className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
          {t('Preview is on in this browser: when you open the website you see your drafts. Visitors still see the published site.')}
        </p>
      ) : null}

      {groups.length === 0 ? (
        <Card>
          <EmptyState icon={<Search size={26} />} title={t('No section matches that')} text={t('Try a simpler word, like phone, banner or address.')} action={<Button variant="secondary" onClick={() => setQuery('')}>{t('Show all sections')}</Button>} />
        </Card>
      ) : (
        groups.map(([page, list]) => (
          <section key={page} aria-labelledby={`page-${page}`}>
            <h2 id={`page-${page}`} className="mb-2 font-display text-lg font-bold text-ink-900">
              {t(page)}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((section) => (
                <li key={section.key}>
                  <Link
                    href={`/admin/website/${section.key}`}
                    className={cn(
                      'group flex h-full items-start gap-3 rounded-2xl border bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift',
                      section.hasDraft ? 'border-sun-300' : 'border-ink-200/70',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-[15px] font-bold', section.hidden ? 'text-ink-500' : 'text-ink-900')}>{t(section.label)}</p>
                      {section.description ? <p className="mt-0.5 line-clamp-2 text-sm text-ink-500">{t(section.description)}</p> : null}
                      {section.hasDraft || section.hidden || section.hiddenInDraft ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {section.hasDraft ? (
                            <Badge tone="amber">
                              {t('Changes not published')}{section.draftLangs.length > 1 || section.draftLangs[0] !== 'en' ? `: ${section.draftLangs.map((code) => LANG_NAMES[code].own).join(', ')}` : ''}
                            </Badge>
                          ) : null}
                          {section.hidden ? (
                            <Badge tone="neutral">
                              <EyeOff size={12} /> {t('Hidden')}
                            </Badge>
                          ) : section.hiddenInDraft ? (
                            <Badge tone="neutral">
                              <EyeOff size={12} /> {t('Hidden when published')}
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <ChevronRight size={18} className="mt-0.5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
