import { Eye, Target } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { aboutApproach, aboutOwner, aboutMission, aboutStory, aboutTop, homeWhy, siteContact, siteCta } from '@/cms/sections';
import { Blob, Dots, Wave } from '@/components/site/art';
import { PointGrid, CtaBand } from '@/components/site/blocks';
import { Drift, Parallax } from '@/components/site/motion-kit';
import { getSite } from '@/components/site/i18n/server';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Paragraphs, Section, SectionHeading, SiteImage } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(aboutTop)]);
  return pageMeta({ lang, title: t.pages.about, description: `${top.heading}. ${top.text}`, path: '/about' });
}

export default async function AboutPage() {
  const { t } = await getSite();
  const [top, story, approach, mission, director, why, contact, visit] = await Promise.all([
    content(aboutTop),
    content(aboutStory),
    content(aboutApproach),
    content(aboutMission),
    content(aboutOwner),
    content(homeWhy),
    content(siteContact),
    content(siteCta),
  ]);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} tone="mint" crumbs={[{ name: t.nav.about, path: '/about' }]} />

      {!isHidden(story) ? (
        <Section className="overflow-hidden !pt-10 sm:!pt-14">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading heading={story.heading} mark={story.highlight} align="left" />
              <Reveal delay={0.1} className="mt-5 space-y-4 text-lg leading-relaxed text-ink-700">
                <Paragraphs text={story.text} />
                <Paragraphs text={story.text2} />
              </Reveal>
            </div>
            <Reveal className="relative mx-auto w-full max-w-[560px]">
              <div aria-hidden className="absolute -right-[8%] -top-[12%] w-[60%] text-sun-100">
                <Blob variant={2} />
              </div>
              <div aria-hidden className="absolute -bottom-6 right-[6%] w-24 text-brand-200">
                <Dots />
              </div>
              <Parallax amount={18}>
                <div className="relative -rotate-2 overflow-hidden rounded-[2.5rem] border-[8px] border-white bg-sun-100 shadow-lift">
                  <div className="relative aspect-[4/3]">
                    <SiteImage src={story.image} alt={story.imageAlt} sizes="(min-width: 1024px) 560px, 92vw" />
                  </div>
                </div>
              </Parallax>
            </Reveal>
          </div>
        </Section>
      ) : null}

      {!isHidden(approach) && approach.items.length ? (
        <div className="relative bg-brand-50">
          <Wave flip className="absolute inset-x-0 top-0 -mt-px text-white" />
          <Section className="!pb-24 !pt-28 sm:!pt-32 lg:!pb-32 lg:!pt-40">
            <SectionHeading eyebrow={approach.eyebrow} heading={approach.heading} mark={approach.highlight} />
            <div className="mt-12">
              <PointGrid points={approach.items} columns={approach.items.length === 4 ? 4 : 3} />
            </div>
          </Section>
          <Wave className="absolute inset-x-0 bottom-0 -mb-px text-white" variant={1} />
        </div>
      ) : null}

      {!isHidden(mission) ? (
        <Section>
          <Stagger className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {[
              { heading: mission.missionHeading, text: mission.mission, icon: <Target aria-hidden size={28} />, bg: 'bg-coral-50', chip: 'bg-coral-400' },
              { heading: mission.visionHeading, text: mission.vision, icon: <Eye aria-hidden size={28} />, bg: 'bg-sky-50', chip: 'bg-sky-400' },
            ]
              .filter((card) => card.text)
              .map((card) => (
                <StaggerItem key={card.heading} className="h-full">
                  <div className={`h-full rounded-[2rem] p-7 transition duration-300 hover:-translate-y-1 sm:p-10 ${card.bg}`}>
                    <span className={`grid h-14 w-14 place-items-center rounded-2xl text-white ${card.chip}`}>{card.icon}</span>
                    <h2 className="mt-5 font-display text-3xl font-extrabold text-brand-950">{card.heading}</h2>
                    <p className="mt-3 text-pretty text-lg leading-relaxed text-ink-700">{card.text}</p>
                  </div>
                </StaggerItem>
              ))}
          </Stagger>
        </Section>
      ) : null}

      {/* Stays off until the client writes the message and switches the section on. */}
      {!isHidden(director) && director.message ? (
        <Section className="!pt-0">
          <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] bg-sun-50 p-7 sm:rounded-[3rem] sm:p-12">
            <div className={`grid items-center gap-8 ${director.photo ? 'md:grid-cols-[240px_1fr]' : ''}`}>
              {director.photo ? (
                <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-full border-[8px] border-white shadow-lift md:w-full">
                  <SiteImage src={director.photo} alt={director.name} sizes="240px" />
                </div>
              ) : null}
              <div>
                <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{director.heading}</h2>
                <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink-700">
                  <Paragraphs text={director.message} />
                </div>
                <p className="mt-6 font-display text-xl font-bold text-brand-800">{director.name}</p>
                {director.role ? <p className="text-ink-600">{director.role}</p> : null}
              </div>
            </div>
          </Reveal>
        </Section>
      ) : null}

      {!isHidden(why) && why.items.length ? (
        <Section className="!pt-0">
          <SectionHeading eyebrow={why.eyebrow} heading={why.heading} mark={why.highlight} tone="coral" />
          <div className="mt-12">
            <PointGrid points={why.items} />
          </div>
        </Section>
      ) : null}

      <CtaBand visit={visit} whatsapp={contact.whatsapp} />
    </>
  );
}
