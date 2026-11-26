import { Award, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { achievementsList, resultsList, resultsTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band, Head } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { SiteImage } from '@/components/site/ui';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(resultsTop)]);
  return pageMeta({ lang, title: t.nav.results, description: `${top.heading}. ${top.text}`, path: '/results' });
}

export default async function ResultsPage() {
  const { t } = await getSite();
  const [top, results, achievements] = await Promise.all([content(resultsTop), content(resultsList), content(achievementsList)]);
  const rows = isHidden(results) ? [] : results.items.filter((r) => r.title);
  const wins = isHidden(achievements) ? [] : achievements.items.filter((a) => a.title);
  // Newest year first, Madhyamik before Higher Secondary within a year.
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => b.localeCompare(a));

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.results, path: '/results' }]} />

      {!rows.length && !wins.length ? (
        <Band tone="paper">
          <div className="mx-auto max-w-xl rounded-xl border border-dashed border-brand-950/20 p-10 text-center">
            <Award aria-hidden size={36} className="mx-auto text-sun-400" />
            <p className="mt-4 text-lg text-ink-700">{top.emptyText}</p>
          </div>
        </Band>
      ) : null}

      {rows.length ? (
        <Band tone="paper">
          <Head index={1} heading={results.heading} />
          <div className="mt-10 space-y-12">
            {years.map((year) => (
              <section key={year} aria-labelledby={`y-${year}`}>
                <h3 id={`y-${year}`} className="tabular flex items-center gap-4 text-3xl font-bold text-brand-950">
                  {year}
                  <span aria-hidden className="h-px flex-1 bg-brand-950/15" />
                </h3>
                <Stagger className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rows
                    .filter((r) => r.year === year)
                    .sort((a, b) => a.exam.localeCompare(b.exam) * -1)
                    .map((r, i) => (
                      <StaggerItem key={i} className="flex items-center gap-4 rounded-xl border border-brand-950/10 bg-white p-5">
                        {r.photo ? (
                          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-100">
                            <SiteImage src={r.photo} alt="" sizes="64px" />
                          </span>
                        ) : null}
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-accent-600">{r.exam === 'hs' ? t.results.hs : t.results.madhyamik}</span>
                          <span className="block text-lg font-bold text-brand-950">{r.title}</span>
                          {r.detail ? <span className="tabular block text-ink-700">{r.detail}</span> : null}
                        </span>
                      </StaggerItem>
                    ))}
                </Stagger>
              </section>
            ))}
          </div>
        </Band>
      ) : null}

      {wins.length ? (
        <Band tone="night">
          <Head index={2} heading={achievements.heading} light />
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
            {wins.map((a, i) => (
              <StaggerItem key={i} className="flex gap-5 rounded-xl border border-white/10 p-6">
                {a.photo ? (
                  <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-900">
                    <SiteImage src={a.photo} alt="" sizes="96px" />
                  </span>
                ) : (
                  <Trophy aria-hidden size={28} className="shrink-0 text-sun-300" />
                )}
                <span>
                  {a.year ? <span className="tabular block text-sm font-semibold text-sun-300">{a.year}</span> : null}
                  <span className="block text-xl font-bold text-white">{a.title}</span>
                  {a.text ? <span className="mt-1 block leading-relaxed text-brand-100">{a.text}</span> : null}
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </Band>
      ) : null}
    </>
  );
}
