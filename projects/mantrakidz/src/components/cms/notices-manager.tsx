'use client';

/** Public notices and events shown on the website: write, schedule, pin, take down. */
import { CalendarDays, Megaphone, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, FormGrid, Input, Textarea } from '@/components/ui/core';
import { ConfirmButton, Drawer, LoadingButton, useToast } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';
import { createNoticeAction, deleteNoticeAction, updateNoticeAction } from '@/server/cms/actions';
import { ImageInput } from './image-input';

export type NoticeRow = {
  id: string;
  title: string;
  body: string;
  image: string;
  pinned: boolean;
  eventDate: string | null;
  publishOn: string;
  expiresOn: string | null;
  status: 'scheduled' | 'live' | 'expired';
};

const STATUS: Record<NoticeRow['status'], { label: string; tone: 'green' | 'blue' | 'neutral' }> = {
  live: { label: 'On the website', tone: 'green' },
  scheduled: { label: 'Scheduled', tone: 'blue' },
  expired: { label: 'Expired', tone: 'neutral' },
};

type Draft = { id: string | null; title: string; body: string; image: string; pinned: boolean; eventDate: string; publishOn: string; expiresOn: string };

export function NoticesManager({ notices, today }: { notices: NoticeRow[]; today: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | NoticeRow['status']>('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const blank = (): Draft => ({ id: null, title: '', body: '', image: '', pinned: false, eventDate: '', publishOn: today, expiresOn: '' });
  const edit = (notice: NoticeRow): Draft => ({ id: notice.id, title: notice.title, body: notice.body, image: notice.image, pinned: notice.pinned, eventDate: notice.eventDate ?? '', publishOn: notice.publishOn, expiresOn: notice.expiresOn ?? '' });
  const open = (next: Draft) => {
    setErrors({});
    setDraft(next);
  };
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => (current ? { ...current, [key]: value } : current));

  async function save() {
    if (!draft) return;
    setSaving(true);
    const { id, ...input } = draft;
    const result = id ? await updateNoticeAction(id, input) : await createNoticeAction(input);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast.error(t(result.error));
      return;
    }
    toast.success(id ? t('Notice saved') : draft.publishOn > today ? t('Notice scheduled for {publishOn}', { publishOn: formatDate(draft.publishOn) }) : t('Notice is on the website'));
    setDraft(null);
    router.refresh();
  }

  const counts = { all: notices.length, live: 0, scheduled: 0, expired: 0 };
  for (const notice of notices) counts[notice.status] += 1;
  const shown = filter === 'all' ? notices : notices.filter((notice) => notice.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-1">
          {(['all', 'live', 'scheduled', 'expired'] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition', filter === key ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300')}
            >
              {key === 'all' ? t('All') : t(STATUS[key].label)} <span className={cn('tabular text-xs', filter === key ? 'text-brand-100' : 'text-ink-400')}>{counts[key]}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => open(blank())}>
          <Plus size={18} /> {t('New notice')}
        </Button>
      </div>

      {notices.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Megaphone size={26} />}
            title={t('No notices yet')}
            text={t('Tell parents and visitors about holidays, admissions and events. A notice shows on the website from the day you choose until it expires.')}
            action={<Button onClick={() => open(blank())}>{t('Write the first notice')}</Button>}
          />
        </Card>
      ) : shown.length === 0 ? (
        <Card>
          <EmptyState title={t('None in this list')} text={t('Choose another list above.')} />
        </Card>
      ) : (
        <ul className="space-y-3">
          {shown.map((notice) => (
            <li key={notice.id}>
              <Card className={cn('flex gap-4 p-4', notice.status === 'expired' && 'opacity-70')}>
                {notice.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={notice.image} alt="" className="hidden h-20 w-28 shrink-0 rounded-xl object-cover sm:block" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={STATUS[notice.status].tone}>{t(STATUS[notice.status].label)}</Badge>
                    {notice.pinned ? (
                      <Badge tone="amber">
                        <Pin size={12} /> {t('Pinned')}
                      </Badge>
                    ) : null}
                    {notice.eventDate ? (
                      <Badge tone="violet">
                        <CalendarDays size={12} /> {t('Event on {eventDate}', { eventDate: formatDate(notice.eventDate) })}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-base font-bold text-ink-900">{notice.title}</p>
                  {notice.body ? <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-sm text-ink-600">{notice.body}</p> : null}
                  <p className="mt-1.5 text-sm text-ink-500">
                    {notice.status === 'scheduled' ? t('Goes up on {date}', { date: formatDate(notice.publishOn) }) : t('Up since {date}', { date: formatDate(notice.publishOn) })}
                    {notice.expiresOn ? (notice.status === 'expired' ? t(', came down after {date}', { date: formatDate(notice.expiresOn) }) : t(', comes down after {date}', { date: formatDate(notice.expiresOn) })) : t(', until you take it down')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start">
                  <Button variant="secondary" size="sm" onClick={() => open(edit(notice))} aria-label={t('Edit {title}', { title: notice.title })}>
                    <Pencil size={16} /> <span className="hidden sm:inline">{t('Edit')}</span>
                  </Button>
                  <ConfirmButton
                    size="sm"
                    title={t('Delete this notice?')}
                    text={t('"{title}" is removed from the website for good.', { title: notice.title })}
                    confirmLabel={t('Delete notice')}
                    aria-label={t('Delete {title}', { title: notice.title })}
                    onConfirm={async () => {
                      const result = await deleteNoticeAction(notice.id);
                      if (!result.ok) toast.error(t(result.error));
                      else toast.success(t('Notice deleted'));
                      router.refresh();
                    }}
                  >
                    <Trash2 size={16} />
                  </ConfirmButton>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={draft !== null}
        onClose={() => !saving && setDraft(null)}
        title={draft?.id ? t('Edit notice') : t('New notice')}
        description={t('Shown on the public website.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={saving} onClick={() => void save()}>
              {draft?.id ? t('Save notice') : draft && draft.publishOn > today ? t('Schedule notice') : t('Put it on the website')}
            </LoadingButton>
          </>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <Field label={t('Title')} required error={errors.title && t(errors.title)}>
              <Input value={draft.title} maxLength={120} invalid={Boolean(errors.title)} onChange={(event) => set('title', event.target.value)} placeholder={t('School closed on Friday for Kali Puja')} />
            </Field>
            <Field label={t('Details')} hint={t('Optional. Timings, what to bring, who to call.')} error={errors.body && t(errors.body)}>
              <Textarea value={draft.body} rows={4} maxLength={2000} onChange={(event) => set('body', event.target.value)} />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Photo')}</p>
              <ImageInput value={draft.image} onChange={(url) => set('image', url)} folder="notices" label={t('photo')} compact invalid={Boolean(errors.image)} />
              {errors.image ? <p className="mt-1 text-sm font-medium text-accent-600">{t(errors.image)}</p> : null}
            </div>
            <FormGrid>
              <Field label={t('Show from')} error={errors.publishOn && t(errors.publishOn)} hint={t('A later date schedules it.')}>
                <Input type="date" value={draft.publishOn} onChange={(event) => set('publishOn', event.target.value)} />
              </Field>
              <Field label={t('Take down after')} error={errors.expiresOn && t(errors.expiresOn)} hint={t('Leave empty to keep it up.')}>
                <Input type="date" value={draft.expiresOn} min={draft.publishOn} invalid={Boolean(errors.expiresOn)} onChange={(event) => set('expiresOn', event.target.value)} />
              </Field>
              <Field label={t('Event date')} error={errors.eventDate && t(errors.eventDate)} hint={t('Only for an event: the day it happens.')}>
                <Input type="date" value={draft.eventDate} onChange={(event) => set('eventDate', event.target.value)} />
              </Field>
            </FormGrid>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 px-4 py-3">
              <input type="checkbox" checked={draft.pinned} onChange={(event) => set('pinned', event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-ink-300 text-brand-700 accent-brand-700" />
              <span>
                <span className="block text-[15px] font-semibold text-ink-800">{t('Pin to the top')}</span>
                <span className="block text-sm text-ink-500">{t('Stays above the other notices.')}</span>
              </span>
            </label>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
