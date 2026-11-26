import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { lifeClubs, lifeRules, lifeSafety, lifeTop, lifeUniform } from '@/cms/sections';
import { GrievanceForm } from '@/components/site/forms';
import { getSite } from '@/components/site/i18n/server';
import { Band, CardGrid, Head, InfoCard, Prose, RuledList } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { SiteImage } from '@/components/site/ui';
import { Reveal } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(lifeTop)]);
  return pageMeta({ lang, title: t.nav.life, description: `${top.heading}. ${top.text}`, path: '/student-life' });
}

export default async function StudentLifePage() {
  const { t } = await getSite();
  const [top, clubs, rules, uniform, safety] = await Promise.all([content(lifeTop), content(lifeClubs), content(lifeRules), content(lifeUniform), content(lifeSafety)]);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.life, path: '/student-life' }]} />

      {!isHidden(clubs) && clubs.items.length ? (
        <Band tone="paper">
          <Head index={1} heading={clubs.heading} text={clubs.text} />
          <CardGrid cols={3} className="mt-10">
            {clubs.items.map((c, i) => (
              <InfoCard key={i} title={c.title} text={c.text} icon={c.icon} image={c.image} />
            ))}
          </CardGrid>
        </Band>
      ) : null}

      <Band tone="white">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_.8fr] lg:gap-16">
          {!isHidden(rules) && rules.items.length ? (
            <div>
              <Head index={2} heading={rules.heading} />
              <RuledList items={rules.items.map((r) => r.text)} className="mt-8" />
            </div>
          ) : null}
          {!isHidden(uniform) ? (
            <div>
              <Head index={3} heading={uniform.heading} />
              <Reveal delay={0.08}>
                <Prose text={uniform.text} className="mt-8 text-ink-800" />
                {uniform.image ? (
                  <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-lg bg-brand-100">
                    <SiteImage src={uniform.image} alt={uniform.heading} sizes="(min-width: 1024px) 480px, 92vw" />
                  </div>
                ) : null}
              </Reveal>
            </div>
          ) : null}
        </div>
      </Band>

      {!isHidden(safety) ? (
        <Band tone="night" id="safety" className="scroll-mt-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Head index={4} heading={safety.heading} light />
              <Reveal delay={0.08}>
                <Prose text={safety.text} className="mt-6 text-brand-100" />
                <ul className="mt-6 space-y-3">
                  {safety.items
                    .map((s) => s.text)
                    .filter(Boolean)
                    .map((s) => (
                      <li key={s} className="flex gap-3 text-[17px] text-brand-50">
                        <ShieldCheck aria-hidden size={20} className="mt-0.5 shrink-0 text-sun-300" />
                        {s}
                      </li>
                    ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.12} className="rounded-xl bg-white p-6 text-ink-800 sm:p-8">
              <h3 className="text-2xl font-bold text-brand-950">{safety.formHeading}</h3>
              {safety.formText ? <p className="mt-1 text-ink-600">{safety.formText}</p> : null}
              <div className="mt-6">
                <GrievanceForm copy={{ buttonLabel: t.pages.sendMessage, successHeading: safety.formHeading, successText: safety.successText }} />
              </div>
            </Reveal>
          </div>
        </Band>
      ) : null}
    </>
  );
}
