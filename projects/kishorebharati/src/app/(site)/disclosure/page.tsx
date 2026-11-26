import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { disclosureFacts, disclosureRti, disclosureTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band, FactTable, Head, Prose } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Reveal } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(disclosureTop)]);
  return pageMeta({ lang, title: t.nav.disclosure, description: `${top.heading}. ${top.text}`, path: '/disclosure' });
}

export default async function DisclosurePage() {
  const { t } = await getSite();
  const [top, facts, rti] = await Promise.all([content(disclosureTop), content(disclosureFacts), content(disclosureRti)]);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.disclosure, path: '/disclosure' }]} />
      <Band tone="paper">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {!isHidden(facts) ? (
            <div>
              <Head index={1} heading={facts.heading} />
              <Reveal delay={0.08}>
                <FactTable rows={facts.items} className="mt-8" />
              </Reveal>
            </div>
          ) : null}
          {!isHidden(rti) ? (
            <div className="self-start rounded-xl bg-brand-950 p-6 text-white sm:p-8 lg:sticky lg:top-28">
              <h2 className="text-2xl font-bold">{rti.heading}</h2>
              <Prose text={rti.text} className="mt-4 text-[17px] text-brand-100" />
              <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
                <div className="py-3">
                  <dt className="text-sm text-brand-200">{t.school.officer}</dt>
                  <dd className="font-semibold">
                    {rti.officer || t.school.noOfficer}
                    {rti.officer && rti.officerRole ? <span className="block text-sm font-normal text-brand-200">{rti.officerRole}</span> : null}
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="text-sm text-brand-200">{t.school.appellate}</dt>
                  <dd className="font-semibold">{rti.appellate || t.school.noOfficer}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </Band>
    </>
  );
}
