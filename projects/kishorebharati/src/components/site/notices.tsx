/** A notice from the public notice board, and an event from the school calendar. Server components. */
import { CalendarDays, MapPin, Paperclip, Pin } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SiteEvent, SiteNotice } from '@/server/site/queries';
import { getSite } from './i18n/server';
import { DateBlock, niceDate } from './kit';
import { SiteImage } from './ui';

export async function NoticeCard({ notice, clamp, compact }: { notice: SiteNotice; index?: number; clamp?: boolean; compact?: boolean }) {
  const { t } = await getSite();
  // An event shows the day it happens; a plain notice shows the day it was put up.
  const day = notice.eventDate ?? notice.publishOn;
  return (
    <article className={cn('group relative flex h-full gap-4 rounded-xl border bg-white p-5 transition duration-300 hover:border-brand-950/25 sm:gap-5 sm:p-6', notice.pinned ? 'border-accent-600/40' : 'border-brand-950/10')}>
      <DateBlock iso={day} months={t.common.months} className={notice.pinned ? 'bg-accent-600' : undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-ink-600">
          {notice.pinned ? (
            <span className="inline-flex items-center gap-1 text-accent-700">
              <Pin aria-hidden size={13} />
              {t.common.important}
            </span>
          ) : null}
          {notice.eventDate ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden size={14} />
              <time dateTime={notice.eventDate}>{niceDate(notice.eventDate, t.common.months)}</time>
            </span>
          ) : (
            <time dateTime={notice.publishOn}>{niceDate(notice.publishOn, t.common.months)}</time>
          )}
        </div>
        <h3 className="mt-1 text-lg font-bold leading-snug text-brand-950 sm:text-xl">{notice.title}</h3>
        {notice.body && !compact ? <p className={cn('mt-1.5 whitespace-pre-line leading-relaxed text-ink-700', clamp && 'line-clamp-3')}>{notice.body}</p> : null}
        {notice.image && !compact ? (
          <div className="relative mt-4 aspect-[16/9] max-w-md overflow-hidden rounded-lg bg-brand-50">
            <SiteImage src={notice.image} alt="" sizes="(min-width: 640px) 448px, 80vw" />
          </div>
        ) : null}
        {notice.attachment ? (
          <a href={notice.attachment} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-brand-700 underline decoration-sun-400 decoration-2 underline-offset-4 hover:text-brand-950">
            <Paperclip aria-hidden size={16} />
            {t.notices.attachment}
          </a>
        ) : null}
      </div>
    </article>
  );
}

const KIND_STYLE: Record<string, string> = {
  holiday: 'bg-sun-100 text-sun-700',
  exam: 'bg-accent-50 text-accent-700',
  event: 'bg-brand-100 text-brand-800',
  meeting: 'bg-mint-100 text-mint-700',
};

export async function EventRow({ event, light }: { event: SiteEvent; light?: boolean }) {
  const { t } = await getSite();
  const span = event.endsOn && event.endsOn !== event.startsOn ? `${niceDate(event.startsOn, t.common.months)} ${t.common.to} ${niceDate(event.endsOn, t.common.months)}` : niceDate(event.startsOn, t.common.months);
  return (
    <article className={cn('flex gap-4 py-4', light ? 'text-brand-50' : '')}>
      <DateBlock iso={event.startsOn} months={t.common.months} className={light ? 'bg-white/10' : undefined} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className={cn('rounded px-2 py-0.5 text-xs font-bold', KIND_STYLE[event.kind] ?? KIND_STYLE.event)}>{t.events.kinds[event.kind] ?? event.kind}</span>
          <time dateTime={event.startsOn} className={light ? 'text-brand-200' : 'text-ink-600'}>
            {span}
          </time>
        </p>
        <h3 className={cn('mt-1 text-lg font-bold leading-snug', light ? 'text-white' : 'text-brand-950')}>{event.title}</h3>
        {event.venue ? (
          <p className={cn('mt-0.5 inline-flex items-center gap-1 text-sm', light ? 'text-brand-200' : 'text-ink-600')}>
            <MapPin aria-hidden size={14} />
            {event.venue}
          </p>
        ) : null}
        {event.details ? <p className={cn('mt-1 whitespace-pre-line leading-relaxed', light ? 'text-brand-100' : 'text-ink-700')}>{event.details}</p> : null}
      </div>
    </article>
  );
}
