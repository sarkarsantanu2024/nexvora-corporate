import type { Metadata } from 'next';
import { content } from '@/cms/content';
import { centresTop, siteContact, siteVisit } from '@/cms/sections';
import { Kite } from '@/components/site/art';
import { VisitBand } from '@/components/site/blocks';
import { CentreCard } from '@/components/site/centre-card';
import { Drift } from '@/components/site/motion-kit';
import { fill } from '@/components/site/i18n';
import { getSite } from '@/components/site/i18n/server';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Cta, Section } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { getCentres } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(centresTop)]);
  return pageMeta({ lang, title: t.centres.title, description: `${top.heading}. ${top.text}`, path: '/centres' });
}

export default async function CentresPage() {
  const { t } = await getSite();
  const [top, contact, visit, centres] = await Promise.all([content(centresTop), content(siteContact), content(siteVisit), getCentres()]);
  // One or two centres look lost in a three-column grid, so the grid narrows to fit.
  const grid = centres.length === 1 ? 'max-w-xl' : centres.length === 2 ? 'max-w-4xl md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} tone="sky" crumbs={[{ name: t.nav.centres, path: '/centres' }]} />

      <Section className="!pt-10 sm:!pt-14">
        {centres.length ? (
          <Stagger className={`mx-auto grid gap-6 ${grid}`}>
            {centres.map((centre, i) => (
              <StaggerItem key={centre.id} className="h-full">
                <CentreCard centre={centre} index={i} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <p className="mx-auto max-w-xl text-center text-lg text-ink-600">{fill(t.centres.empty, { phone: contact.phone })}</p>
        )}

        {top.franchiseHeading ? (
          <Reveal className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-[2.25rem] bg-sun-50 px-6 py-9 text-center sm:px-12 sm:py-11">
            <Drift className="absolute right-[5%] top-4 hidden w-14 sm:block" bob={10} rotate={6} duration={7}>
              <Kite />
            </Drift>
            <h2 className="font-display text-2xl font-extrabold text-brand-950 sm:text-3xl">{top.franchiseHeading}</h2>
            <p className="mx-auto mt-2 max-w-xl text-lg text-ink-700">{top.franchiseText}</p>
            <Cta href="/franchise" variant="indigo" arrow className="mt-6">
              {top.franchiseButton}
            </Cta>
          </Reveal>
        ) : null}
      </Section>

      <VisitBand visit={visit} whatsapp={contact.whatsapp} />
    </>
  );
}
