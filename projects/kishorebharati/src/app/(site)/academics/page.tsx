import { Clock } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { academicsActivities, academicsClasses, academicsExams, academicsStreams, academicsSubjects, academicsTimings, academicsTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band, Head, Prose } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { SiteImage } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(academicsTop)]);
  return pageMeta({ lang, title: t.nav.academics, description: `${top.heading}. ${top.text}`, path: '/academics' });
}

export default async function AcademicsPage() {
  const { t } = await getSite();
  const [top, classes, subjects, streams, timings, exams, activities] = await Promise.all([
    content(academicsTop),
    content(academicsClasses),
    content(academicsSubjects),
    content(academicsStreams),
    content(academicsTimings),
    content(academicsExams),
    content(academicsActivities),
  ]);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.academics, path: '/academics' }]} />

      {!isHidden(classes) && classes.items.length ? (
        <Band tone="paper">
          <Head index={1} heading={classes.heading} />
          <Stagger className="mt-10 grid gap-px overflow-hidden rounded-xl border border-brand-950/10 bg-brand-950/10 md:grid-cols-3">
            {classes.items.map((item, i) => (
              <StaggerItem key={i} className="bg-white p-7">
                <span className="tabular text-5xl font-bold text-sun-400">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-4 text-2xl font-bold text-brand-950">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-700">{item.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Band>
      ) : null}

      <Band tone="white">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          {!isHidden(subjects) && subjects.items.length ? (
            <div>
              <Head index={2} heading={subjects.heading} text={subjects.text} />
              <Stagger className="mt-8 flex flex-wrap gap-2.5">
                {subjects.items.map((s, i) => (
                  <StaggerItem key={i} className="rounded-md border border-brand-950/15 bg-[#fbf7ec] px-4 py-2.5">
                    <span className="text-[17px] font-semibold text-brand-950">{s.name}</span>
                    {s.note ? <span className="ml-2 text-sm text-ink-600">({s.note})</span> : null}
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          ) : null}

          {!isHidden(streams) ? (
            <div>
              <Head index={3} heading={streams.heading} text={streams.text} />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { title: streams.scienceHeading, list: streams.science },
                  { title: streams.artsHeading, list: streams.arts },
                ].map((stream, i) => (
                  <Reveal key={i} delay={i * 0.08} className={cn('rounded-xl p-6', i === 0 ? 'bg-brand-950 text-white' : 'bg-[#f2e9d3] text-brand-950')}>
                    <h3 className="text-2xl font-bold">{stream.title}</h3>
                    <ul className={cn('mt-4 divide-y', i === 0 ? 'divide-white/10' : 'divide-brand-950/10')}>
                      {stream.list
                        .filter((s) => s.name)
                        .map((s) => (
                          <li key={s.name} className="py-2.5 text-[17px]">
                            {s.name}
                          </li>
                        ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
              {streams.note ? <p className="mt-4 text-ink-600">{streams.note}</p> : null}
            </div>
          ) : null}
        </div>
      </Band>

      <Band tone="deep">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          {!isHidden(timings) && timings.rows.length ? (
            <div>
              <Head index={4} heading={timings.heading} />
              <Reveal delay={0.08}>
                <table className="mt-8 w-full border-collapse overflow-hidden rounded-xl bg-white text-left">
                  <tbody>
                    {timings.rows.map((row, i) => (
                      <tr key={i} className="border-b border-brand-950/10 last:border-0">
                        <th scope="row" className="p-4 align-top text-[16px] font-semibold text-brand-950 sm:p-5">
                          {row.who}
                        </th>
                        <td className="tabular p-4 text-[16px] text-ink-800 sm:p-5">
                          <span className="inline-flex items-center gap-2">
                            <Clock aria-hidden size={16} className="shrink-0 text-accent-600" />
                            {row.time}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {timings.note ? <p className="mt-3 text-ink-600">{timings.note}</p> : null}
              </Reveal>
            </div>
          ) : null}
          {!isHidden(exams) ? (
            <div>
              <Head index={5} heading={exams.heading} />
              <Reveal delay={0.08}>
                <Prose text={exams.text} className="mt-8 text-ink-800" />
              </Reveal>
            </div>
          ) : null}
        </div>
      </Band>

      {!isHidden(activities) && activities.items.length ? (
        <Band tone="night">
          <Head index={6} heading={activities.heading} text={activities.text} light />
          <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {activities.items.map((item, i) => (
              <StaggerItem key={i} className="group">
                <figure className="relative aspect-[4/3] overflow-hidden rounded-lg bg-brand-900">
                  {item.image ? (
                    <SiteImage src={item.image} alt={item.title} sizes="(min-width: 640px) 33vw, 48vw" className="transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
                  ) : null}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/10 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-3 text-[15px] font-semibold leading-snug text-white sm:p-4 sm:text-base">{item.title}</figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </Band>
      ) : null}
    </>
  );
}
