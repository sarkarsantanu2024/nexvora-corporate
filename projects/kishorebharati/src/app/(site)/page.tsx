import { ArrowRight, MapPin, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { homeEvents, homeFacts, homeGallery, homeHero, homeIntro, homeMarquee, homeMessage, homeNotices, homeVisit, siteBrand, siteContact } from '@/cms/sections';
import { CountYear } from '@/components/site/count-year';
import { GalleryStrip } from '@/components/site/gallery';
import { buildSlides } from '@/components/site/hero';
import { getSite } from '@/components/site/i18n/server';
import { PointIcon } from '@/components/site/icons';
import { Band, Head, Prose } from '@/components/site/kit';
import { Marquee, Parallax } from '@/components/site/motion-kit';
import { EventRow, NoticeCard } from '@/components/site/notices';
import { HeroCarousel } from '@/components/site/hero-carousel';
import { IntroLoader } from '@/components/site/intro-loader';
import { pageMeta, schoolLd } from '@/components/site/seo';
import { CONTAINER } from '@/components/site/theme';
import { Cta, JsonLd, SiteImage } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { telLink } from '@/lib/wa';
import { getGallery, getNotices, getUpcoming } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang }, brand, hero] = await Promise.all([getSite(), content(siteBrand), content(homeHero)]);
  return pageMeta({
    lang,
    title: `${brand.name} | ${brand.tagline}`,
    description: hero.text,
    path: '/',
    image: hero.image,
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const { lang, t } = await getSite();
  const [brand, contact, hero, marquee, intro, facts, message, noticesHead, eventsHead, galleryHead, visit, photos, notices, upcoming] = await Promise.all([
    content(siteBrand),
    content(siteContact),
    content(homeHero),
    content(homeMarquee),
    content(homeIntro),
    content(homeFacts),
    content(homeMessage),
    content(homeNotices),
    content(homeEvents),
    content(homeGallery),
    content(homeVisit),
    getGallery(),
    getNotices(),
    getUpcoming(4),
  ]);

  const slides = buildSlides({ ...hero, highlight: '', badge: '', slides: hero.slides.map((s: Record<string, string>) => ({ ...s, text: hero.text, buttonLabel: hero.primaryLabel, buttonLink: '/admission' })) });
  const words = marquee.items.map((item) => item.text).filter(Boolean);
  const tel = telLink(contact.phone);
  let chapter = 0;
  const next = () => (chapter += 1);

  return (
    <>
      <JsonLd data={schoolLd(lang, { name: brand.name, logo: brand.logo, image: hero.image, contact })} />

      <IntroLoader photo="/images/school/headmaster.jpg" name={brand.name} motto={brand.tagline} />

      {isHidden(hero) ? <h1 className="sr-only">{brand.name}</h1> : <HeroCarousel words={hero} slides={slides} />}

      {/* activities, sliding past */}
      {!isHidden(marquee) && words.length ? (
        <div className="border-b border-brand-950/10 bg-[#fbf7ec] py-5" aria-label={words.join(', ')}>
          <Marquee>
            <ul aria-hidden className="flex items-center">
              {words.map((word, i) => (
                <li key={`${word}-${i}`} className="flex items-center whitespace-nowrap text-2xl font-bold text-brand-950 sm:text-4xl">
                  <span className="px-6 sm:px-9">{word}</span>
                  <span className="h-2.5 w-2.5 rotate-45 bg-sun-400" />
                </li>
              ))}
            </ul>
          </Marquee>
        </div>
      ) : null}

      {/* welcome: an editorial spread with the founding year as a watermark */}
      {!isHidden(intro) ? (
        <Band tone="paper" className="overflow-hidden">
          <span aria-hidden className="pointer-events-none absolute -left-6 top-6 select-none text-[9rem] font-bold leading-none text-brand-950/[0.04] sm:text-[16rem] lg:text-[22rem]">
            1965
          </span>
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
            <div>
              <Head index={next()} eyebrow={intro.eyebrow} heading={intro.heading} mark={intro.highlight} />
              <Reveal delay={0.08}>
                <Prose text={intro.text} className="mt-6 text-ink-800" />
                <ul className="mt-7 divide-y divide-brand-950/10 border-y border-brand-950/10">
                  {intro.points
                    .map((p) => p.text)
                    .filter(Boolean)
                    .map((point) => (
                      <li key={point} className="flex items-center gap-3 py-3 text-[17px] font-semibold text-brand-950">
                        <span aria-hidden className="h-2 w-2 shrink-0 rotate-45 bg-accent-600" />
                        {point}
                      </li>
                    ))}
                </ul>
                {intro.buttonLabel ? (
                  <Cta href="/about" variant="indigo" arrow className="mt-8 rounded-md">
                    {intro.buttonLabel}
                  </Cta>
                ) : null}
              </Reveal>
            </div>
            <Reveal className="relative mx-auto w-full max-w-[520px]">
              <div className="relative ml-auto w-[78%] overflow-hidden rounded-lg bg-brand-100 shadow-[0_40px_70px_-40px_rgba(22,26,58,.6)]">
                <div className="relative aspect-[9/14]">
                  <SiteImage src={intro.image} alt={intro.imageAlt} sizes="(min-width: 1024px) 400px, 75vw" />
                </div>
              </div>
              {intro.image2 ? (
                <Parallax amount={30} className="absolute -bottom-8 left-0 w-[52%]">
                  <div className="overflow-hidden rounded-lg border-[6px] border-[#fbf7ec] bg-brand-100 shadow-lift">
                    <div className="relative aspect-[4/3]">
                      <SiteImage src={intro.image2} alt={intro.image2Alt} sizes="(min-width: 1024px) 260px, 50vw" />
                    </div>
                  </div>
                </Parallax>
              ) : null}
              <span aria-hidden className="absolute -right-3 top-8 h-24 w-1.5 rounded-full bg-sun-400" />
            </Reveal>
          </div>
        </Band>
      ) : null}

      {/* at a glance */}
      {!isHidden(facts) && facts.items.length ? (
        <Band tone="night" className="overflow-hidden">
          <Head index={next()} eyebrow={facts.eyebrow} heading={facts.heading} light />
          <Stagger className="mt-12 grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {facts.items.map((item, i) => (
              <StaggerItem key={`${item.value}-${i}`} className="group relative border-b border-r border-white/10 p-6 transition-colors duration-500 hover:bg-white/[0.04] sm:p-8">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-white/5 text-sun-300 transition-transform duration-500 group-hover:-translate-y-1">
                  <PointIcon name={item.icon} size={20} />
                </span>
                <p className="mt-6 text-3xl font-bold leading-tight text-white sm:text-[2.1rem]">
                  <CountYear value={item.value} className="tabular" />
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-brand-200">{item.label}</p>
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-sun-400 transition-transform duration-500 group-hover:scale-x-100" />
              </StaggerItem>
            ))}
          </Stagger>
        </Band>
      ) : null}

      {/* the headmaster's desk */}
      {!isHidden(message) ? (
        <Band tone="deep">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-lg bg-brand-950">
                {message.photo ? (
                  <SiteImage src={message.photo} alt={message.name} sizes="360px" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center p-12">
                    <SiteImage src={brand.logo} alt={t.common.seal} width={300} height={300} sizes="260px" className="h-auto w-full rounded-full bg-white p-2" />
                  </div>
                )}
              </div>
            </Reveal>
            <div>
              <Head index={next()} eyebrow={message.eyebrow} heading={message.heading} />
              <Reveal delay={0.1}>
                <blockquote className="relative mt-6 border-l-[3px] border-sun-400 pl-6">
                  <Prose text={message.message} className="text-[19px] text-ink-800" />
                </blockquote>
                <p className="mt-6 pl-6">
                  <span className="block text-xl font-bold text-brand-950">{message.name}</span>
                  <span className="text-ink-600">{message.role}</span>
                </p>
              </Reveal>
            </div>
          </div>
        </Band>
      ) : null}

      {/* notice board and calendar, side by side */}
      {!isHidden(noticesHead) || !isHidden(eventsHead) ? (
        <Band tone="paper">
          <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
            {!isHidden(noticesHead) ? (
              <div>
                <Head
                  index={next()}
                  eyebrow={noticesHead.eyebrow}
                  heading={noticesHead.heading}
                  aside={
                    noticesHead.buttonLabel ? (
                      <Cta href="/notices" variant="outline" arrow size="sm" className="rounded-md">
                        {noticesHead.buttonLabel}
                      </Cta>
                    ) : null
                  }
                />
                {notices.length ? (
                  <Stagger className="mt-8 grid gap-4">
                    {notices.slice(0, 4).map((notice) => (
                      <StaggerItem key={notice.id}>
                        <NoticeCard notice={notice} clamp />
                      </StaggerItem>
                    ))}
                  </Stagger>
                ) : (
                  <p className="mt-8 rounded-xl border border-dashed border-brand-950/20 p-8 text-center text-lg text-ink-600">{noticesHead.emptyText}</p>
                )}
              </div>
            ) : null}
            {!isHidden(eventsHead) ? (
              <div className="rounded-xl bg-brand-950 p-6 text-white sm:p-8">
                <Head eyebrow={eventsHead.eyebrow} heading={eventsHead.heading} light className="[&_h2]:text-[1.8rem] [&_h2]:sm:text-[2.1rem]" />
                {upcoming.length ? (
                  <div className="mt-4 divide-y divide-white/10">
                    {upcoming.map((event) => (
                      <EventRow key={event.id} event={event} light />
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-brand-200">{eventsHead.emptyText}</p>
                )}
                {eventsHead.buttonLabel ? (
                  <Cta href="/events" variant="white" arrow size="sm" className="mt-6 rounded-md">
                    {eventsHead.buttonLabel}
                  </Cta>
                ) : null}
              </div>
            ) : null}
          </div>
        </Band>
      ) : null}

      {/* photos */}
      {!isHidden(galleryHead) && photos.length ? (
        <Band tone="white">
          <Head
            index={next()}
            eyebrow={galleryHead.eyebrow}
            heading={galleryHead.heading}
            mark={galleryHead.highlight}
            text={galleryHead.text}
            aside={
              galleryHead.buttonLabel ? (
                <Cta href="/gallery" variant="indigo" arrow className="rounded-md">
                  {galleryHead.buttonLabel}
                </Cta>
              ) : null
            }
          />
          <Reveal className="mt-10">
            <GalleryStrip photos={photos.slice(0, 6)} />
          </Reveal>
        </Band>
      ) : null}

      {/* find the school */}
      {!isHidden(visit) ? (
        <section className="relative overflow-hidden bg-brand-950 text-white">
          <div className={`${CONTAINER} grid items-stretch gap-0 lg:grid-cols-2`}>
            <div className="py-14 pr-0 sm:py-20 lg:pr-16">
              <Head eyebrow={visit.eyebrow} heading={visit.heading} text={visit.text} light />
              <Reveal delay={0.1}>
                {contact.address ? (
                  <p className="mt-6 flex gap-3 text-lg text-brand-50">
                    <MapPin aria-hidden size={22} className="mt-1 shrink-0 text-sun-300" />
                    <span className="whitespace-pre-line">{contact.address}</span>
                  </p>
                ) : null}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {contact.mapUrl ? (
                    <Cta href={contact.mapUrl} variant="red" icon={<Navigation aria-hidden size={18} className="relative" />} className="rounded-md">
                      {visit.mapButton}
                    </Cta>
                  ) : null}
                  {tel ? (
                    <Cta href={tel} variant="white" icon={<Phone aria-hidden size={18} className="relative" />} className="rounded-md">
                      <span className="tabular">{contact.phone}</span>
                    </Cta>
                  ) : null}
                </div>
              </Reveal>
            </div>
            {visit.image ? (
              <div className="relative -mx-4 min-h-[260px] sm:-mx-8 lg:mx-0 lg:-mr-12 2xl:-mr-16">
                <SiteImage src={visit.image} alt={visit.imageAlt} sizes="(min-width: 1024px) 50vw, 100vw" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/20 to-transparent lg:via-transparent" />
              </div>
            ) : null}
          </div>
          <SiteLinkStrip label={t.nav.contact} />
        </section>
      ) : null}
    </>
  );
}

/** A thin closing line under the address band that leads to the full contact page. */
function SiteLinkStrip({ label }: { label: string }) {
  return (
    <div className="border-t border-white/10">
      <div className={`${CONTAINER} flex justify-end py-3`}>
        <Cta href="/contact" variant="ghost" size="sm" className="rounded-md !text-sun-300 hover:!bg-white/5">
          {label}
          <ArrowRight aria-hidden size={16} className="relative" />
        </Cta>
      </div>
    </div>
  );
}
