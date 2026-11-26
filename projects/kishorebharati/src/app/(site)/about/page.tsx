import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { aboutChapters, aboutCommittee, aboutHistory, aboutMotto, aboutTop, aboutValues, homeMessage, siteBrand } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band, CardGrid, Head, InfoCard, Prose } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { SiteImage } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top, history] = await Promise.all([getSite(), content(aboutTop), content(aboutHistory)]);
  return pageMeta({ lang, title: t.pages.about, description: `${top.text} ${history.text}`, path: '/about', image: history.founderPhoto });
}

export default async function AboutPage() {
  const { t } = await getSite();
  const [top, history, chapters, motto, values, committee, message, brand] = await Promise.all([
    content(aboutTop),
    content(aboutHistory),
    content(aboutChapters),
    content(aboutMotto),
    content(aboutValues),
    content(aboutCommittee),
    content(homeMessage),
    content(siteBrand),
  ]);
  const members = committee.members.filter((m) => m.name);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.about, path: '/about' }]} />

      {/* the founder */}
      {!isHidden(history) ? (
        <Band tone="paper">
          <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <figure>
                <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-100">
                  <SiteImage src={history.founderPhoto} alt={history.founderName} sizes="(min-width: 1024px) 520px, 92vw" />
                </div>
                <figcaption className="mt-4 border-l-[3px] border-sun-400 pl-4">
                  <span className="block text-xl font-bold text-brand-950">{history.founderName}</span>
                  <span className="text-ink-600">{history.founderRole}</span>
                </figcaption>
              </figure>
            </Reveal>
            <div>
              <Head index={1} eyebrow={history.eyebrow} heading={history.heading} mark={history.highlight} />
              <Reveal delay={0.1}>
                <Prose text={history.text} className="mt-6 text-[19px] text-ink-800" />
                {history.text2 ? <Prose text={history.text2} className="mt-4 text-ink-800" /> : null}
              </Reveal>

              {/* the story as numbered chapters on a line */}
              {!isHidden(chapters) && chapters.items.length ? (
                <div className="mt-14">
                  <Head eyebrow={chapters.eyebrow} heading={chapters.heading} as="h3" />
                  <Stagger className="relative mt-8 space-y-8 border-l-2 border-brand-950/15 pl-6 sm:pl-8">
                    {chapters.items.map((item, i) => (
                      <StaggerItem key={`${item.title}-${i}`} className="relative">
                        <span aria-hidden className="absolute -left-[33px] top-1.5 h-4 w-4 rounded-full border-[3px] border-[#fbf7ec] bg-accent-600 sm:-left-[41px]" />
                        <p className="text-sm font-semibold text-accent-600">
                          {t.common.chapter.replace('{n}', String(i + 1).padStart(2, '0'))} · <span className="tabular">{item.year}</span>
                        </p>
                        <h4 className="mt-1 text-2xl font-bold text-brand-950">{item.title}</h4>
                        <p className="mt-2 text-[17px] leading-relaxed text-ink-700">{item.text}</p>
                        {item.image && item.image !== history.founderPhoto ? (
                          <div className="relative mt-4 aspect-[16/9] max-w-lg overflow-hidden rounded-lg bg-brand-100">
                            <SiteImage src={item.image} alt="" sizes="(min-width: 640px) 512px, 85vw" />
                          </div>
                        ) : null}
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              ) : null}
            </div>
          </div>
        </Band>
      ) : null}

      {/* the motto */}
      {!isHidden(motto) ? (
        <Band tone="night" className="overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -right-20 top-1/2 h-[520px] w-[520px] -translate-y-1/2 opacity-[0.08] invert">
            <SiteImage src={brand.logo} alt="" sizes="520px" className="!object-contain" />
          </div>
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <Head index={2} eyebrow={motto.eyebrow} heading={motto.heading} light />
              <Reveal delay={0.1}>
                <Prose text={motto.text} className="mt-6 text-brand-100" />
                {motto.source ? <p className="mt-4 text-sm font-semibold text-sun-300">{motto.source}</p> : null}
              </Reveal>
            </div>
            <Reveal delay={0.15} className="text-center lg:text-left">
              <p lang="sa" className="text-balance text-5xl font-bold leading-tight text-sun-300 sm:text-6xl">
                {motto.motto}
              </p>
              <p className="mt-4 text-xl italic text-white">{motto.meaning}</p>
              {motto.verse ? (
                <p lang="sa" className="mx-auto mt-8 max-w-lg border-t border-white/10 pt-6 text-lg leading-loose text-brand-200 lg:mx-0">
                  {motto.verse}
                </p>
              ) : null}
            </Reveal>
          </div>
        </Band>
      ) : null}

      {/* what the school works for */}
      {!isHidden(values) && values.items.length ? (
        <Band tone="paper">
          <Head index={3} eyebrow={values.eyebrow} heading={values.heading} text={values.text} />
          <CardGrid cols={4} className="mt-10">
            {values.items.map((item, i) => (
              <InfoCard key={i} title={item.title} text={item.text} icon={item.icon} />
            ))}
          </CardGrid>
        </Band>
      ) : null}

      {/* the headmaster's desk, repeated here because parents look for it on this page */}
      {!isHidden(message) ? (
        <Band tone="deep">
          <div className="mx-auto max-w-3xl">
            <Head eyebrow={message.eyebrow} heading={message.heading} />
            <Reveal delay={0.1}>
              <blockquote className="mt-6 border-l-[3px] border-sun-400 pl-6">
                <Prose text={message.message} className="text-ink-800" />
              </blockquote>
              <p className="mt-5 pl-6">
                <span className="block text-lg font-bold text-brand-950">{message.name}</span>
                <span className="text-ink-600">{message.role}</span>
              </p>
            </Reveal>
          </div>
        </Band>
      ) : null}

      {/* the managing committee: only once the school has added names */}
      {!isHidden(committee) && members.length ? (
        <Band tone="white">
          <Head index={4} eyebrow={committee.eyebrow} heading={committee.heading} />
          <Stagger className="mt-8 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => (
              <StaggerItem key={`${m.name}-${i}`} className="flex items-baseline justify-between gap-4 border-b border-brand-950/10 py-4">
                <span className="text-lg font-semibold text-brand-950">{m.name}</span>
                {m.role ? <span className="text-right text-sm text-ink-600">{m.role}</span> : null}
              </StaggerItem>
            ))}
          </Stagger>
        </Band>
      ) : null}
    </>
  );
}
