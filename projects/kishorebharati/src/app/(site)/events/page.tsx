import type { Metadata } from 'next';
import { content } from '@/cms/content';
import { eventsTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band, Head, niceDate } from '@/components/site/kit';
import { EventRow } from '@/components/site/notices';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { getCalendar } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(eventsTop)]);
  return pageMeta({ lang, title: t.nav.events, description: `${top.heading}. ${top.text}`, path: '/events' });
}

export default async function EventsPage() {
  const { t } = await getSite();
  const [top, { upcoming, holidays, past }] = await Promise.all([content(eventsTop), getCalendar()]);
  const nothing = !upcoming.length && !holidays.length && !past.length;

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.events, path: '/events' }]} />
      <Band tone="paper">
        {nothing ? <p className="mx-auto max-w-xl rounded-xl border border-dashed border-brand-950/20 p-10 text-center text-lg text-ink-700">{top.emptyText}</p> : null}
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div className="space-y-14">
            {upcoming.length ? (
              <section>
                <Head index={1} heading={top.upcomingHeading} />
                <div className="mt-6 divide-y divide-brand-950/10 border-y border-brand-950/10">
                  {upcoming.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              </section>
            ) : null}
            {past.length ? (
              <section>
                <Head index={upcoming.length ? 2 : 1} heading={top.pastHeading} />
                <div className="mt-6 divide-y divide-brand-950/10 border-y border-brand-950/10 opacity-90">
                  {past.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          {holidays.length ? (
            <aside className="self-start rounded-xl bg-brand-950 p-6 text-white sm:p-8 lg:sticky lg:top-28">
              <h2 className="text-2xl font-bold">{top.holidaysHeading}</h2>
              <ul className="mt-4 divide-y divide-white/10">
                {holidays.map((h) => (
                  <li key={h.id} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="font-semibold">{h.title}</span>
                    <span className="tabular shrink-0 text-right text-sm text-sun-300">
                      {niceDate(h.startsOn, t.common.months)}
                      {h.endsOn && h.endsOn !== h.startsOn ? ` ${t.common.to} ${niceDate(h.endsOn, t.common.months)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </Band>
    </>
  );
}
