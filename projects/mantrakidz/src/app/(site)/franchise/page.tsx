import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { franchiseFaq, franchiseForm, franchiseSteps, franchiseTop, franchiseTopics, franchiseWho, franchiseWhy, siteContact } from '@/cms/sections';
import { Blob, Blocks, Cloud, Kite, Sparkle, Star, Wave } from '@/components/site/art';
import { PointGrid, Steps } from '@/components/site/blocks';
import { Faq } from '@/components/site/faq';
import { FranchiseForm } from '@/components/site/forms';
import { getSite } from '@/components/site/i18n/server';
import { Drift, Enter, PointerScene } from '@/components/site/motion-kit';
import { breadcrumbLd, faqLd, pageMeta } from '@/components/site/seo';
import { CONTAINER } from '@/components/site/theme';
import { Cta, JsonLd, Section, SectionHeading, SiteImage, Ticks } from '@/components/site/ui';
import { Reveal } from '@/components/ui/motion';
import { INVESTMENT_RANGES } from '@/server/site/enquiries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(franchiseTop)]);
  return pageMeta({ lang, title: t.pages.franchise, description: `${top.heading}. ${top.text}`, path: '/franchise', image: top.image });
}

export default async function FranchisePage() {
  const { lang, t } = await getSite();
  const [top, why, who, topics, steps, form, faq, contact] = await Promise.all([
    content(franchiseTop),
    content(franchiseWhy),
    content(franchiseWho),
    content(franchiseTopics),
    content(franchiseSteps),
    content(franchiseForm),
    content(franchiseFaq),
    content(siteContact),
  ]);
  const questions = faq.items.filter((item) => item.question && item.answer);

  return (
    <>
      <JsonLd
        data={breadcrumbLd(lang, [
          { name: t.nav.home, path: '/' },
          { name: t.nav.franchise, path: '/franchise' },
        ])}
      />
      {!isHidden(faq) && questions.length ? <JsonLd data={faqLd(lang, questions)} /> : null}

      {/* This page sells, so it gets a banner of its own instead of the plain page top. */}
      <header className="relative overflow-hidden bg-gradient-to-b from-coral-50 via-sun-50 to-white">
        <PointerScene>
          <Drift className="absolute left-[4%] top-12 hidden w-28 text-white lg:block" depth={10} bob={8} duration={9} scroll={30} fromTop>
            <Cloud />
          </Drift>
          <div className={`${CONTAINER} relative grid items-center gap-12 pb-24 pt-10 sm:pt-14 lg:grid-cols-[1.1fr_.9fr] lg:pb-32 lg:pt-16`}>
            <div className="text-center lg:text-left">
              {top.eyebrow ? (
                <Enter y={14}>
                  <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-coral-700 shadow-sm">
                    <Sparkle className="h-3.5 w-3.5" />
                    {top.eyebrow}
                  </p>
                </Enter>
              ) : null}
              <Enter delay={0.1}>
                <h1 className="mt-5 text-balance font-display text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-brand-950 sm:text-5xl xl:text-6xl">{top.heading}</h1>
              </Enter>
              <Enter delay={0.2}>
                <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-ink-700 sm:text-xl lg:mx-0">{top.text}</p>
              </Enter>
              <Enter delay={0.3}>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Cta href="#enquire" size="lg" arrow className="w-full sm:w-auto">
                    {top.primaryLabel}
                  </Cta>
                  {top.secondaryLabel && !isHidden(steps) ? (
                    <Cta href="#steps" variant="outline" size="lg" className="w-full sm:w-auto">
                      {top.secondaryLabel}
                    </Cta>
                  ) : null}
                </div>
              </Enter>
            </div>

            <Enter delay={0.25} y={40} scale={0.95} className="relative mx-auto w-full max-w-[420px] lg:max-w-[480px]">
              <Drift className="absolute -inset-[8%] text-coral-100" depth={-10} bob={0}>
                <Blob variant={2} />
              </Drift>
              <Drift className="absolute -right-[6%] -top-[6%] z-10 w-[20%]" depth={24} bob={12} rotate={6} duration={7}>
                <Kite />
              </Drift>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem] border-[10px] border-white bg-coral-100 shadow-lift">
                {top.image ? (
                  <SiteImage src={top.image} alt={top.imageAlt} priority sizes="(min-width: 1024px) 480px, 92vw" />
                ) : (
                  <div aria-hidden className="grid h-full place-items-center">
                    <Blocks className="w-1/2" />
                  </div>
                )}
              </div>
              <Drift className="absolute -bottom-[6%] -left-[8%] z-10 w-[30%]" depth={20} bob={7} duration={6}>
                <Blocks className="drop-shadow-[0_10px_14px_rgba(26,26,44,.18)]" />
              </Drift>
              <Drift className="absolute left-[4%] top-[8%] z-10 w-[8%] text-sun-400" depth={34} rotate={16} duration={5}>
                <Star />
              </Drift>
            </Enter>
          </div>
        </PointerScene>
        <Wave className="absolute inset-x-0 bottom-0 -mb-px text-white" />
      </header>

      {!isHidden(why) && why.items.length ? (
        <Section className="!pt-10 sm:!pt-14">
          <SectionHeading eyebrow={why.eyebrow} heading={why.heading} mark={why.highlight} tone="coral" />
          <div className="mt-12">
            <PointGrid points={why.items} columns={why.items.length === 4 ? 4 : 3} />
          </div>
        </Section>
      ) : null}

      {!isHidden(who) && who.items.length ? (
        <Section className="!pt-0">
          <Reveal className="relative overflow-hidden rounded-[2.25rem] bg-mint-50 p-7 sm:rounded-[3rem] sm:p-12 lg:p-16">
            <div aria-hidden className="absolute -bottom-20 -right-16 h-72 w-72 text-mint-100">
              <Blob variant={0} />
            </div>
            <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <SectionHeading heading={who.heading} mark={who.highlight} text={who.text} align="left" tone="mint" />
              <Ticks items={who.items.map((item) => item.text)} />
            </div>
          </Reveal>
        </Section>
      ) : null}

      {!isHidden(topics) && topics.items.length ? (
        <Section className="!pt-0">
          <SectionHeading eyebrow={topics.eyebrow} heading={topics.heading} mark={topics.highlight} text={topics.text} tone="sun" />
          <div className="mt-12">
            <PointGrid points={topics.items} />
          </div>
        </Section>
      ) : null}

      {!isHidden(steps) && steps.items.length ? (
        <div className="relative bg-brand-50">
          <Wave flip className="absolute inset-x-0 top-0 -mt-px text-white" variant={1} />
          <Section id="steps" className="scroll-mt-10 !pb-24 !pt-28 sm:!pt-32 lg:!pb-32 lg:!pt-40">
            <SectionHeading eyebrow={steps.eyebrow} heading={steps.heading} mark={steps.highlight} />
            <div className="mt-12">
              <Steps items={steps.items} />
            </div>
          </Section>
          <Wave className="absolute inset-x-0 bottom-0 -mb-px text-white" />
        </div>
      ) : null}

      {!isHidden(form) ? (
        <Section id="enquire" className="scroll-mt-16">
          <Reveal className="mx-auto max-w-4xl rounded-[2.25rem] border border-ink-100 bg-white p-6 shadow-lift sm:rounded-[3rem] sm:p-12">
            <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{form.heading}</h2>
            {form.text ? <p className="mt-2 text-lg text-ink-600">{form.text}</p> : null}
            <div className="mt-7">
              <FranchiseForm ranges={INVESTMENT_RANGES} copy={form} whatsapp={contact.whatsapp} whatsappMessage={form.whatsappMessage} />
            </div>
          </Reveal>
        </Section>
      ) : null}

      {!isHidden(faq) && questions.length ? (
        <Section className="!pt-0">
          <SectionHeading heading={faq.heading} mark={faq.highlight} tone="sky" />
          <Reveal className="mx-auto mt-10 max-w-3xl">
            <Faq items={questions} />
          </Reveal>
        </Section>
      ) : null}
    </>
  );
}
