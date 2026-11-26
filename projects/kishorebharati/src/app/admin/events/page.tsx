import { ChevronLeft, ChevronRight, MapPin, MessageCircle, PartyPopper } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UrlSelect } from '@/components/ui/client';
import { Badge, Card, CardHeader, EmptyState, PageHeader, buttonClass, type Tone } from '@/components/ui/core';
import type { CalendarEvent, CalendarKind } from '@/db/schema';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { addMonths, currentPeriod, formatDate, periodLabel, periodRange, todayIST, weekday } from '@/lib/date';
import { getT } from '@/lib/t';
import { getSetting } from '@/server/admin/shared';
import { isMonth } from '@/server/daily/shared';
import { listEvents, upcomingEvents } from '@/server/events/service';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { KIND_WORDS } from '@/server/events/constants';
import { DeleteEvent, EventForm } from './event-tools';

export const metadata: Metadata = { title: 'Events and calendar' };

const KIND_TONE: Record<CalendarKind, Tone> = { holiday: 'red', exam: 'violet', event: 'green', meeting: 'blue' };
const DOT: Record<CalendarKind, string> = { holiday: 'bg-accent-500', exam: 'bg-brand-600', event: 'bg-mint-500', meeting: 'bg-sky-500' };
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const lastDay = (row: CalendarEvent) => row.endsOn ?? row.startsOn;
const dates = (row: CalendarEvent) => (row.endsOn ? `${formatDate(row.startsOn)} – ${formatDate(row.endsOn)}` : formatDate(row.startsOn));

export default async function EventsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const office = isOffice(session);
  const today = todayIST();
  const month = isMonth(params.month) ? params.month : currentPeriod();
  const { from, to } = periodRange(month);
  const kind = params.kind && params.kind in KIND_WORDS ? params.kind : '';
  const [rows, upcoming, school] = await Promise.all([listEvents(session, { from, to, kind }), upcomingEvents(session, 6), getSetting('school')]);

  // The month as weeks, Monday first, with blanks before the 1st.
  const lead = (weekday(from) + 6) % 7;
  const total = Number(to.slice(8));
  const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: total }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  while (cells.length % 7) cells.push(null);
  const on = (day: string) => rows.filter((row) => row.startsOn <= day && lastDay(row) >= day);

  const invite = (row: CalendarEvent) => {
    const text = [row.title, dates(row), row.venue, row.details, school.high.nameBn || school.high.name].filter(Boolean).join('\n');
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <PageHeader
        title={t('Events and calendar')}
        description={office ? t('Holidays, exams, events and meetings. Holidays close the register; entries marked for the website show there.') : t('Holidays, exams, events and meetings of the school.')}
        actions={office ? <EventForm defaultDay={month === currentPeriod() ? today : from} /> : undefined}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/events${query({ month: addMonths(month, -1), kind })}`} className={buttonClass('secondary', 'md', 'w-10 px-0')} aria-label={t('Previous month')} scroll={false}>
              <ChevronLeft size={18} />
            </Link>
            <h2 className="min-w-[8rem] text-center font-display text-lg font-bold text-ink-900">{periodLabel(month)}</h2>
            <Link href={`/admin/events${query({ month: addMonths(month, 1), kind })}`} className={buttonClass('secondary', 'md', 'w-10 px-0')} aria-label={t('Next month')} scroll={false}>
              <ChevronRight size={18} />
            </Link>
            {month !== currentPeriod() ? (
              <Link href={`/admin/events${query({ kind })}`} className={buttonClass('ghost', 'sm')} scroll={false}>
                {t('This month')}
              </Link>
            ) : null}
            <FilterBar>
              <UrlSelect param="kind" label={t('Kind')} options={[{ value: '', label: t('All kinds') }, ...(Object.keys(KIND_WORDS) as CalendarKind[]).map((key) => ({ value: key, label: t(KIND_WORDS[key]) }))]} />
            </FilterBar>
          </div>

          <Card className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-ink-200 bg-ink-50 text-center text-xs font-semibold text-ink-500">
              {WEEK.map((name) => (
                <div key={name} className="py-2">
                  {t(name)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, index) => {
                const here = day ? on(day) : [];
                const sunday = index % 7 === 6;
                return (
                  <div key={index} className={cn('min-h-[3.25rem] border-b border-r border-ink-100 p-1 sm:min-h-[5.5rem] sm:p-1.5', !day && 'bg-ink-50/50', sunday && day && 'bg-ink-50')}>
                    {day ? (
                      <>
                        <span className={cn('tabular inline-grid h-6 w-6 place-items-center rounded-full text-xs font-semibold', day === today ? 'bg-brand-700 text-white' : sunday ? 'text-accent-600' : 'text-ink-700')}>{Number(day.slice(8))}</span>
                        <div className="mt-0.5 flex flex-wrap gap-0.5 sm:hidden">
                          {here.map((row) => (
                            <span key={row.id} className={cn('h-1.5 w-1.5 rounded-full', DOT[row.kind])} />
                          ))}
                        </div>
                        <ul className="mt-0.5 hidden space-y-0.5 sm:block">
                          {here.slice(0, 3).map((row) => (
                            <li key={row.id} className="flex items-center gap-1 truncate text-[11px] leading-tight text-ink-700" title={row.title}>
                              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[row.kind])} />
                              <span className="truncate">{row.title}</span>
                            </li>
                          ))}
                          {here.length > 3 ? <li className="text-[11px] text-ink-400">{t('{n} more', { n: here.length - 3 })}</li> : null}
                        </ul>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('In {month}', { month: periodLabel(month) })} />
            {rows.length ? (
              <ul className="mt-3 divide-y divide-ink-100">
                {rows.map((row) => (
                  <li key={row.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={KIND_TONE[row.kind]}>{t(KIND_WORDS[row.kind])}</Badge>
                        <span className="tabular text-sm text-ink-500">{dates(row)}</span>
                        {office && !row.showOnWebsite ? <Badge tone="neutral">{t('Not on the website')}</Badge> : null}
                      </div>
                      <p className="mt-1 font-semibold text-ink-900">{row.title}</p>
                      {row.venue ? (
                        <p className="flex items-center gap-1 text-sm text-ink-500">
                          <MapPin size={14} /> {row.venue}
                        </p>
                      ) : null}
                      {row.details ? <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-ink-600">{row.details}</p> : null}
                    </div>
                    {office ? (
                      <div className="flex shrink-0 gap-1.5">
                        {row.kind !== 'holiday' ? (
                          <a href={invite(row)} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm', 'text-mint-700')} title={t('Send invite on WhatsApp')}>
                            <MessageCircle size={15} /> <span className="max-sm:hidden">{t('Invite')}</span>
                          </a>
                        ) : null}
                        <EventForm
                          defaultDay={row.startsOn}
                          entry={{ id: row.id, title: row.title, kind: row.kind, startsOn: row.startsOn, endsOn: row.endsOn ?? '', venue: row.venue, details: row.details, image: row.image, galleryAlbum: row.galleryAlbum, showOnWebsite: row.showOnWebsite }}
                        />
                        <DeleteEvent id={row.id} title={row.title} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<PartyPopper size={26} />} title={t('Nothing in the calendar this month')} text={office ? t('Add holidays, exam days, events and meetings, so teachers and parents know what is coming.') : undefined} />
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title={t('Coming up')} />
          {upcoming.length ? (
            <ul className="mt-3 divide-y divide-ink-100">
              {upcoming.map((row) => (
                <li key={row.id} className="px-5 py-3">
                  <Link href={`/admin/events?month=${row.startsOn.slice(0, 7)}`} className="font-semibold text-ink-900 hover:text-brand-700">
                    {row.title}
                  </Link>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
                    <Badge tone={KIND_TONE[row.kind]}>{t(KIND_WORDS[row.kind])}</Badge> {dates(row)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-500">{t('Nothing coming up in the calendar.')}</p>
          )}
        </Card>
      </div>
    </>
  );
}
