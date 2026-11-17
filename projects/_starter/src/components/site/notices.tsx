/** One notice from the public notice board. */
import { CalendarDays, Pin } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SiteNotice } from '@/server/site/queries';
import { getSite } from './i18n/server';
import { SiteImage } from './ui';
import { TONES, type Tone } from './theme';

const ROTATION: Tone[] = ['sun', 'mint', 'sky', 'coral'];

export async function NoticeCard({ notice, index, clamp }: { notice: SiteNotice; index: number; clamp?: boolean }) {
  const { t: words } = await getSite();
  const t = TONES[ROTATION[index % ROTATION.length]];
  // An event shows the day it happens; a plain notice shows the day it was put up.
  const day = notice.eventDate ?? notice.publishOn;
  const [, month, date] = day.split('-');
  // '2026-11-16' becomes '16 Nov 2026', with the month in the visitor's language.
  const nice = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${Number(d)} ${words.common.months[Number(m) - 1]} ${y}`;
  };
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-ink-100 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      {notice.image ? (
        <div className="relative aspect-[16/9] overflow-hidden">
          <SiteImage src={notice.image} alt="" sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 92vw" className="transition-transform duration-700 group-hover:scale-105" />
        </div>
      ) : null}
      <div className="flex flex-1 gap-4 p-5 sm:p-6">
        <div className={cn('grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-center leading-none', t.tint, t.text)}>
          <span>
            <span className="tabular block font-display text-2xl font-extrabold">{Number(date)}</span>
            <span className="mt-0.5 block text-xs font-bold uppercase tracking-wide">{words.common.months[Number(month) - 1]}</span>
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-500">
            {notice.pinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-0.5 text-accent-700">
                <Pin aria-hidden size={13} strokeWidth={2.6} />
                {words.common.important}
              </span>
            ) : null}
            {notice.eventDate ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays aria-hidden size={15} />
                <time dateTime={notice.eventDate}>{nice(notice.eventDate)}</time>
              </span>
            ) : (
              <time dateTime={notice.publishOn}>{nice(notice.publishOn)}</time>
            )}
          </div>
          <h3 className="mt-1.5 font-display text-xl font-bold leading-snug text-brand-950">{notice.title}</h3>
          {notice.body ? <p className={cn('mt-1.5 whitespace-pre-line leading-relaxed text-ink-600', clamp && 'line-clamp-3')}>{notice.body}</p> : null}
        </div>
      </div>
    </article>
  );
}
