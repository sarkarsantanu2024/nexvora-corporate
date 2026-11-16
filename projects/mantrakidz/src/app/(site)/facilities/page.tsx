import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { facilitiesList, facilitiesTop, siteContact, siteVisit } from '@/cms/sections';
import { Blob } from '@/components/site/art';
import { VisitBand } from '@/components/site/blocks';
import { PointIcon } from '@/components/site/icons';
import { Parallax } from '@/components/site/motion-kit';
import { getSite } from '@/components/site/i18n/server';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { TONES, toneOf } from '@/components/site/theme';
import { Section, SiteImage } from '@/components/site/ui';
import { Reveal } from '@/components/ui/motion';
import { cn } from '@/lib/cn';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(facilitiesTop)]);
  return pageMeta({ lang, title: t.pages.facilities, description: `${top.heading}. ${top.text}`, path: '/facilities', image: '/images/sensorial-play.webp' });
}

export default async function FacilitiesPage() {
  const { t: words } = await getSite();
  const [top, list, contact, visit] = await Promise.all([content(facilitiesTop), content(facilitiesList), content(siteContact), content(siteVisit)]);
  const items = list.items.filter((item) => item.title);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} tone="sky" crumbs={[{ name: words.nav.facilities, path: '/facilities' }]} />

      {!isHidden(list) && items.length ? (
        <Section className="overflow-hidden !pt-10 sm:!pt-14">
          <h2 className="sr-only">{words.pages.facilitiesHeading}</h2>
          <div className="space-y-16 sm:space-y-24">
            {items.map((item, i) => {
              const tone = toneOf(item.color, i);
              const t = TONES[tone];
              const flip = i % 2 === 1;
              return (
                // A zigzag: photo left then right, so the eye walks down the page.
                <div key={`${item.title}-${i}`} className="grid items-center gap-8 md:grid-cols-2 md:gap-14 lg:gap-20">
                  <Reveal className={cn('relative mx-auto w-full max-w-[540px]', flip && 'md:order-2')} y={32}>
                    <div aria-hidden className={cn('absolute -top-[10%] w-[55%] opacity-70', t.text, flip ? '-right-[8%]' : '-left-[8%]')}>
                      <Blob variant={(i % 3) as 0 | 1 | 2} />
                    </div>
                    {item.image ? (
                      <Parallax amount={14}>
                        <div className={cn('relative overflow-hidden rounded-[2.5rem] border-[8px] border-white shadow-lift', t.tint, flip ? 'rotate-2' : '-rotate-2')}>
                          <div className="relative aspect-[4/3]">
                            <SiteImage src={item.image} alt={item.imageAlt || item.title} sizes="(min-width: 768px) 540px, 92vw" />
                          </div>
                        </div>
                      </Parallax>
                    ) : (
                      <div className={cn('relative grid aspect-[4/3] place-items-center rounded-[2.5rem]', t.tint, t.text)}>
                        <PointIcon name={item.icon} size={96} />
                      </div>
                    )}
                  </Reveal>
                  <Reveal delay={0.1} className={cn(flip && 'md:order-1')}>
                    <span className={cn('grid h-14 w-14 place-items-center rounded-2xl text-white shadow-sm', t.solid)}>
                      <PointIcon name={item.icon} size={26} />
                    </span>
                    <h3 className="mt-5 font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{item.title}</h3>
                    <p className="mt-3 max-w-lg text-pretty text-lg leading-relaxed text-ink-700">{item.text}</p>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      <VisitBand visit={visit} whatsapp={contact.whatsapp} />
    </>
  );
}
