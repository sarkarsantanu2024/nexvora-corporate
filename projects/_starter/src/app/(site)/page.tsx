import { Quote } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { homeGallery, homeHero, homeIntro, homeMarquee, homeNotices, homeTestimonials, homeWhy, siteBrand, siteContact, siteCta } from '@/cms/sections';
import { Blob, Dots, Scribble, Star, Wave } from '@/components/site/art';
import { CtaBand, PointGrid } from '@/components/site/blocks';
import { GalleryStrip } from '@/components/site/gallery';
import { HomeHero } from '@/components/site/hero';
import { getSite } from '@/components/site/i18n/server';
import { Drift, Marquee, Parallax } from '@/components/site/motion-kit';
import { NoticeCard } from '@/components/site/notices';
import { abs, absLocale, pageMeta, postalAddress } from '@/components/site/seo';
import { TONES, type Tone } from '@/components/site/theme';
import { Cta, JsonLd, Section, SectionHeading, SiteImage, Ticks } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { BRAND } from '@/config/brand';
import { LANG_NAMES } from '@/lib/i18n';
import { getGallery, getNotices } from '@/server/site/queries';

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

const MARQUEE_TONES: Tone[] = ['sun', 'coral', 'mint', 'sky'];

export default async function HomePage() {
  const { lang } = await getSite();
  const [brand, contact, visit, hero, marquee, intro, why, galleryHead, testimonials, noticesHead, photos, notices] = await Promise.all([
    content(siteBrand),
    content(siteContact),
    content(siteCta),
    content(homeHero),
    content(homeMarquee),
    content(homeIntro),
    content(homeWhy),
    content(homeGallery),
    content(homeTestimonials),
    content(homeNotices),
    getGallery(),
    getNotices(),
  ]);

  const words = marquee.items.map((item) => item.text).filter(Boolean);
  const quotes = testimonials.items.filter((item) => item.quote && item.name);

  // What a search engine reads about the business. Change '@type' to a closer
  // one when the client's trade is known (Store, Restaurant, MedicalClinic ...).
  const business = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': abs('/#business'),
    inLanguage: LANG_NAMES[lang].htmlLang,
    name: brand.name,
    slogan: brand.tagline,
    url: absLocale(lang, '/'),
    logo: abs(brand.logo || BRAND.mark),
    image: abs(hero.image || '/images/hero.jpg'),
    ...(contact.phone ? { telephone: `+91${contact.phone.replace(/\D/g, '').slice(-10)}` } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.address ? { address: postalAddress(contact.address) } : {}),
    ...(contact.mapUrl ? { hasMap: contact.mapUrl } : {}),
    sameAs: [contact.facebook, contact.instagram, contact.youtube].filter(Boolean),
  };

  return (
    <>
      <JsonLd data={business} />

      {isHidden(hero) ? <h1 className="sr-only">{brand.name}</h1> : <HomeHero hero={hero} />}

      {/* moving strip */}
      {!isHidden(marquee) && words.length ? (
        <div className="relative bg-brand-700 py-4 sm:py-5">
          <Marquee>
            <ul className="flex items-center">
              {words.map((word, i) => (
                <li key={`${word}-${i}`} className="flex items-center whitespace-nowrap font-display text-2xl font-bold text-white sm:text-3xl">
                  <span className="px-5 sm:px-7">{word}</span>
                  <Star className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: TONES[MARQUEE_TONES[i % MARQUEE_TONES.length]].hex }} />
                </li>
              ))}
            </ul>
          </Marquee>
        </div>
      ) : null}

      {/* welcome */}
      {!isHidden(intro) ? (
        <Section className="overflow-hidden">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <Reveal className="relative mx-auto w-full max-w-[520px] lg:mx-0">
              <div aria-hidden className="absolute -left-[12%] -top-[10%] w-[70%] text-mint-100">
                <Blob variant={1} />
              </div>
              <div aria-hidden className="absolute -bottom-6 left-[4%] w-24 text-brand-200">
                <Dots />
              </div>
              <div className="relative w-[82%] overflow-hidden rounded-[2.5rem] border-[8px] border-white bg-mint-100 shadow-lift">
                <div className="relative aspect-[4/5]">
                  <SiteImage src={intro.image} alt={intro.imageAlt} sizes="(min-width: 1024px) 430px, 80vw" />
                </div>
              </div>
              {intro.image2 ? (
                <Parallax amount={26} className="absolute -bottom-8 right-0 w-[46%]">
                  <div className="rotate-3 overflow-hidden rounded-[2rem] border-[8px] border-white bg-sun-100 shadow-lift">
                    <div className="relative aspect-square">
                      <SiteImage src={intro.image2} alt={intro.image2Alt} sizes="(min-width: 1024px) 240px, 40vw" />
                    </div>
                  </div>
                </Parallax>
              ) : null}
            </Reveal>

            <div>
              <SectionHeading eyebrow={intro.eyebrow} heading={intro.heading} mark={intro.highlight} align="left" tone="mint" />
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-ink-700">{intro.text}</p>
                <Ticks items={intro.points.map((p) => p.text)} className="mt-6" />
                {intro.buttonLabel ? (
                  <div className="mt-8">
                    <Cta href="/about" variant="indigo" arrow>
                      {intro.buttonLabel}
                    </Cta>
                  </div>
                ) : null}
              </Reveal>
            </div>
          </div>
        </Section>
      ) : null}

      {/* why */}
      {!isHidden(why) && why.items.length ? (
        <div className="relative bg-brand-50">
          <Wave flip className="absolute inset-x-0 top-0 -mt-px text-white" />
          <Section className="!pb-24 !pt-28 sm:!pt-32 lg:!pb-32 lg:!pt-40">
            <Drift className="absolute right-[6%] top-24 hidden w-20 text-sun-400 lg:block" rotate={8} duration={6} scroll={40}>
              <Scribble />
            </Drift>
            <SectionHeading eyebrow={why.eyebrow} heading={why.heading} mark={why.highlight} text={why.text} tone="coral" />
            <div className="mt-12">
              <PointGrid points={why.items} />
            </div>
          </Section>
          <Wave className="absolute inset-x-0 bottom-0 -mb-px text-white" variant={1} />
        </div>
      ) : null}

      {/* photos */}
      {!isHidden(galleryHead) && photos.length ? (
        <Section>
          <SectionHeading eyebrow={galleryHead.eyebrow} heading={galleryHead.heading} mark={galleryHead.highlight} text={galleryHead.text} tone="sun" />
          <Reveal className="mt-12">
            <GalleryStrip photos={photos.slice(0, 6)} />
          </Reveal>
          {galleryHead.buttonLabel ? (
            <Reveal className="mt-12 text-center lg:mt-16">
              <Cta href="/gallery" variant="indigo" arrow>
                {galleryHead.buttonLabel}
              </Cta>
            </Reveal>
          ) : null}
        </Section>
      ) : null}

      {/* kind words: only once the client has added a real one */}
      {!isHidden(testimonials) && quotes.length ? (
        <Section className="!pt-0">
          <SectionHeading eyebrow={testimonials.eyebrow} heading={testimonials.heading} mark={testimonials.highlight} tone="sky" />
          <Stagger className={`mx-auto mt-12 grid gap-6 ${quotes.length === 1 ? 'max-w-xl' : quotes.length === 2 ? 'max-w-4xl md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {quotes.map((item, i) => {
              const t = TONES[(['sky', 'coral', 'mint', 'sun'] as Tone[])[i % 4]];
              return (
                <StaggerItem key={`${item.name}-${i}`} className="h-full">
                  <figure className={`relative flex h-full flex-col rounded-[2rem] p-7 transition duration-300 hover:-translate-y-1 sm:p-9 ${t.soft}`}>
                    <Quote aria-hidden size={44} className={`${t.text} opacity-40`} fill="currentColor" strokeWidth={0} />
                    <blockquote className="mt-4 flex-1 text-pretty font-display text-2xl font-bold leading-snug text-brand-950 sm:text-[1.7rem]">{item.quote}</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      {item.photo ? (
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                          <SiteImage src={item.photo} alt="" sizes="48px" />
                        </span>
                      ) : (
                        <span aria-hidden className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-xl font-extrabold text-white ${t.solid}`}>
                          {item.name.trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="leading-tight">
                        <span className="block font-bold text-ink-900">{item.name}</span>
                        {item.role ? <span className="text-sm text-ink-600">{item.role}</span> : null}
                      </span>
                    </figcaption>
                  </figure>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Section>
      ) : null}

      {/* notices: only when the board has something on it */}
      {!isHidden(noticesHead) && notices.length ? (
        <Section className="!pt-0">
          <SectionHeading eyebrow={noticesHead.eyebrow} heading={noticesHead.heading} tone="mint" />
          <Stagger className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notices.slice(0, 3).map((notice, i) => (
              <StaggerItem key={notice.id} className="h-full">
                <NoticeCard notice={notice} index={i} clamp />
              </StaggerItem>
            ))}
          </Stagger>
          {noticesHead.buttonLabel ? (
            <Reveal className="mt-8 text-center">
              <Cta href="/notices" variant="outline" arrow>
                {noticesHead.buttonLabel}
              </Cta>
            </Reveal>
          ) : null}
        </Section>
      ) : null}

      <div className="pt-6 sm:pt-10">
        <CtaBand visit={visit} whatsapp={contact.whatsapp} />
      </div>
    </>
  );
}
