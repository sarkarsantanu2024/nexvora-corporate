import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { programmesFinder, programmesTop, siteContact, siteVisit } from '@/cms/sections';
import { ProgrammeGrid, VisitBand } from '@/components/site/blocks';
import { ClassFinder } from '@/components/site/class-finder';
import { getSite } from '@/components/site/i18n/server';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Section } from '@/components/site/ui';
import { Reveal } from '@/components/ui/motion';
import { todayIST } from '@/lib/date';
import { getProgrammes } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(programmesTop)]);
  return pageMeta({ lang, title: t.programmes.title, description: `${top.heading}. ${top.text}`, path: '/programmes' });
}

export default async function ProgrammesPage() {
  const { t } = await getSite();
  const [top, finder, contact, visit, programmes] = await Promise.all([
    content(programmesTop),
    content(programmesFinder),
    content(siteContact),
    content(siteVisit),
    getProgrammes(),
  ]);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} tone="sun" crumbs={[{ name: t.nav.programmes, path: '/programmes' }]} />

      <Section className="!pt-10 sm:!pt-14">
        <h2 className="sr-only">{t.programmes.listHeading}</h2>
        {programmes.length ? (
          <ProgrammeGrid programmes={programmes} />
        ) : (
          <p className="mx-auto max-w-xl text-center text-lg text-ink-600">{t.programmes.empty}</p>
        )}
      </Section>

      {!isHidden(finder) && programmes.length ? (
        <Section className="!pt-0">
          <Reveal>
            <ClassFinder
              today={todayIST()}
              copy={finder}
              programmes={programmes.map((p) => ({
                slug: p.slug,
                name: p.name,
                ageLabel: p.ageLabel,
                ageFromMonths: p.ageFromMonths,
                ageToMonths: p.ageToMonths,
                color: p.color,
              }))}
            />
          </Reveal>
        </Section>
      ) : null}

      <VisitBand visit={visit} whatsapp={contact.whatsapp} />
    </>
  );
}
