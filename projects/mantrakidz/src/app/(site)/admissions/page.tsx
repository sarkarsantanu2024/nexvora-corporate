import { Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { admissionsFaq, admissionsForm, admissionsSteps, admissionsTop, siteContact, siteVisit } from '@/cms/sections';
import { Balloon, Blocks, Wave } from '@/components/site/art';
import { Steps } from '@/components/site/blocks';
import { Faq } from '@/components/site/faq';
import { AdmissionForm } from '@/components/site/forms';
import { WhatsAppIcon } from '@/components/site/icons';
import { getSite } from '@/components/site/i18n/server';
import { PageTop } from '@/components/site/page-top';
import { faqLd, pageMeta } from '@/components/site/seo';
import { Cta, JsonLd, Section, SectionHeading } from '@/components/site/ui';
import { Reveal } from '@/components/ui/motion';
import { todayIST } from '@/lib/date';
import { telLink, waLink } from '@/lib/wa';
import { getCentres, getProgrammes } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(admissionsTop)]);
  return pageMeta({ lang, title: t.pages.admissions, description: `${top.heading}. ${top.text}`, path: '/admissions' });
}

type Props = { searchParams: Promise<{ programme?: string; centre?: string }> };

export default async function AdmissionsPage({ searchParams }: Props) {
  const { lang, t } = await getSite();
  const [query, top, steps, form, faq, contact, visit, programmes, centres] = await Promise.all([
    searchParams,
    content(admissionsTop),
    content(admissionsSteps),
    content(admissionsForm),
    content(admissionsFaq),
    content(siteContact),
    content(siteVisit),
    getProgrammes(),
    getCentres(),
  ]);

  // "Enquire about this class" and "Enquire at this centre" arrive with the choice already made.
  const chosenProgramme = programmes.find((p) => p.slug === query.programme);
  const chosenCentre = centres.find((c) => c.slug === query.centre);
  const questions = faq.items.filter((item) => item.question && item.answer);
  const tel = telLink(contact.phone);
  const wa = waLink(contact.whatsapp, visit.whatsappMessage);

  return (
    <>
      {!isHidden(faq) && questions.length ? <JsonLd data={faqLd(lang, questions)} /> : null}
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} tone="coral" crumbs={[{ name: t.nav.admissions, path: '/admissions' }]}>
        <Cta href="#enquire" arrow>
          {form.heading}
        </Cta>
      </PageTop>

      {!isHidden(steps) && steps.items.length ? (
        <Section className="!pt-10 sm:!pt-14">
          <SectionHeading heading={steps.heading} mark={steps.highlight} />
          <div className="mt-12">
            <Steps items={steps.items} />
          </div>
        </Section>
      ) : null}

      {!isHidden(form) ? (
        <div className="balloon-sky relative bg-brand-50">
          <Wave flip className="absolute inset-x-0 top-0 -mt-px text-white" />
          <div aria-hidden className="balloon-track pointer-events-none absolute inset-y-0 left-[3%] hidden w-12 pt-32 xl:block">
            <div className="balloon-rise" style={{ ['--rise-duration' as string]: '42s' }}>
              <div><Balloon color="#ffc83d" /></div>
            </div>
          </div>
          {/* scroll-mt keeps the heading clear of the fixed header when a link jumps here */}
          <Section id="enquire" className="scroll-mt-10 !pb-24 !pt-28 sm:!pt-32 lg:!pb-32 lg:!pt-40">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:gap-10">
              <Reveal className="rounded-[2.25rem] bg-white p-6 shadow-lift sm:p-10">
                <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{form.heading}</h2>
                {form.text ? <p className="mt-2 text-lg text-ink-600">{form.text}</p> : null}
                <div className="mt-7">
                  <AdmissionForm
                    programmes={programmes.map((p) => ({ id: p.id, name: p.name, ageLabel: p.ageLabel }))}
                    centres={centres.map((c) => ({ id: c.id, name: c.name }))}
                    defaultProgrammeId={chosenProgramme?.id}
                    defaultCentreId={chosenCentre?.id}
                    copy={form}
                    whatsapp={contact.whatsapp}
                    today={todayIST()}
                  />
                </div>
              </Reveal>

              <Reveal delay={0.1} className="relative self-start overflow-hidden rounded-[2.25rem] bg-brand-700 p-7 text-white shadow-lift sm:p-9 lg:sticky lg:top-24">
                <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-600/70" />
                <div className="relative">
                  <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{form.sideHeading}</h2>
                  <p className="mt-2 leading-relaxed text-brand-100">{form.sideText}</p>
                  <div className="mt-6 space-y-3">
                    {tel ? (
                      <Cta href={tel} variant="white" icon={<Phone aria-hidden size={18} strokeWidth={2.4} className="relative" />} className="w-full">
                        <span className="tabular">{contact.phone}</span>
                      </Cta>
                    ) : null}
                    {wa ? (
                      <Cta href={wa} variant="whatsapp" icon={<WhatsAppIcon size={20} className="relative" />} className="w-full">
                        {visit.whatsappLabel}
                      </Cta>
                    ) : null}
                  </div>
                  {contact.hours ? <p className="mt-5 text-sm font-medium text-brand-200">{contact.hours}</p> : null}
                  <Blocks className="mt-6 w-24" />
                </div>
              </Reveal>
            </div>
          </Section>
          <Wave className="absolute inset-x-0 bottom-0 -mb-px text-white" variant={1} />
        </div>
      ) : null}

      {!isHidden(faq) && questions.length ? (
        <Section>
          <SectionHeading heading={faq.heading} mark={faq.highlight} tone="sun" />
          <Reveal className="mx-auto mt-10 max-w-3xl">
            <Faq items={questions} />
          </Reveal>
        </Section>
      ) : null}
    </>
  );
}
