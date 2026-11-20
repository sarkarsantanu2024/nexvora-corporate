import { Cake, GraduationCap, MapPin, Quote, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import {
  homeCeo,
  homeFranchise,
  homeGallery,
  homeHero,
  homeIntro,
  homeMarquee,
  homeNotices,
  homeNumbers,
  homeProgrammes,
  homeTestimonials,
  homeWhy,
  siteBrand,
  siteContact,
  siteVisit,
} from '@/cms/sections';
import { Abacus, Balloon, Blob, Cloud, Dots, Rainbow, Scribble, Sparkle, Star, Wave } from '@/components/site/art';
import { PointGrid, ProgrammeGrid, VisitBand } from '@/components/site/blocks';
import { NumberTile } from '@/components/site/counter';
import { GalleryStrip } from '@/components/site/gallery';
import { HomeHero } from '@/components/site/hero';
import { fill } from '@/components/site/i18n';
import { getSite } from '@/components/site/i18n/server';
import { Drift, Marquee, Parallax } from '@/components/site/motion-kit';
import { NoticeCard } from '@/components/site/notices';
import { abs, absLocale, pageMeta, postalAddress } from '@/components/site/seo';
import { CONTAINER, TONES, type Tone } from '@/components/site/theme';
import { Cta, JsonLd, Paragraphs, Section, SectionHeading, SiteImage, Ticks } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { LANG_NAMES } from '@/lib/i18n';
import { getCentres, getGallery, getNotices, getProgrammes } from '@/server/site/queries';

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

/** 18 → "1.5", 66 → "5.5", 24 → "2" */
const years = (months: number) => (months % 12 === 0 ? String(months / 12) : (months / 12).toFixed(1));

const MARQUEE_TONES: Tone[] = ['sun', 'coral', 'mint', 'sky'];

export default async function HomePage() {
  const { lang, t } = await getSite();
  const [brand, contact, visit, hero, marquee, intro, numbers, progHead, why, galleryHead, testimonials, franchise, noticesHead, ceo, programmes, centres, photos, notices] =
    await Promise.all([
      content(siteBrand),
      content(siteContact),
      content(siteVisit),
      content(homeHero),
      content(homeMarquee),
      content(homeIntro),
      content(homeNumbers),
      content(homeProgrammes),
      content(homeWhy),
      content(homeGallery),
      content(homeTestimonials),
      content(homeFranchise),
      content(homeNotices),
      content(homeCeo),
      getProgrammes(),
      getCentres(),
      getGallery(),
      getNotices(),
    ]);

  // The real numbers: worked out from the programmes and centres in the database.
  const youngest = programmes.length ? Math.min(...programmes.map((p) => p.ageFromMonths)) : 18;
  const oldest = programmes.length ? Math.max(...programmes.map((p) => p.ageToMonths)) : 66;
  const ages = fill(t.common.range, { from: years(youngest), to: years(oldest) });
  const seats = programmes[0]?.seatsPerClass ?? 12;
  const openCentres = centres.filter((c) => c.status === 'active').length;
  const words = marquee.items.map((item) => item.text).filter(Boolean);
  const quotes = testimonials.items.filter((item) => item.quote && item.name);

  const preschool = {
    '@context': 'https://schema.org',
    '@type': 'Preschool',
    '@id': abs('/#school'),
    inLanguage: LANG_NAMES[lang].htmlLang,
    name: brand.name,
    slogan: brand.tagline,
    url: absLocale(lang, '/'),
    logo: abs(brand.logo || '/brand/logo.png'),
    image: abs(hero.image || '/images/hero.jpg'),
    ...(contact.phone ? { telephone: `+91${contact.phone.replace(/\D/g, '').slice(-10)}` } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.address ? { address: postalAddress(contact.address) } : {}),
    ...(contact.mapUrl ? { hasMap: contact.mapUrl } : {}),
    ...(brand.parent ? { parentOrganization: { '@type': 'Organization', name: brand.parent.replace(/^an? unit of\s+/i, '') } } : {}),
    sameAs: [contact.facebook, contact.instagram, contact.youtube].filter(Boolean),
  };

  return (
    <>
      <JsonLd data={preschool} />

      {isHidden(hero) ? <h1 className="sr-only">{brand.name}</h1> : <HomeHero hero={hero} ages={ages} seats={seats} />}

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
              <Drift className="absolute -right-2 -top-8 z-10 w-24 sm:w-32" bob={8} duration={7} scroll={20}>
                <Rainbow />
              </Drift>
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
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  {intro.buttonLabel ? (
                    <Cta href="/about" variant="indigo" arrow>
                      {intro.buttonLabel}
                    </Cta>
                  ) : null}
                  {brand.parent ? (
                    <p className="flex items-center gap-2.5 text-sm font-semibold text-ink-600">
                      <Abacus className="h-9 w-11 shrink-0" />
                      {brand.parent}
                    </p>
                  ) : null}
                </div>
              </Reveal>
            </div>
          </div>
        </Section>
      ) : null}

      {/* numbers */}
      {!isHidden(numbers) ? (
        <section aria-label={t.common.numbersAria} className="pb-16 sm:pb-20">
          <Stagger className={`${CONTAINER} grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4`}>
            <StaggerItem>
              <NumberTile tone="sun" text={ages} label={numbers.agesLabel} icon={<Cake aria-hidden size={24} />} />
            </StaggerItem>
            <StaggerItem>
              <NumberTile tone="mint" value={seats} label={numbers.seatsLabel} icon={<Users aria-hidden size={24} />} />
            </StaggerItem>
            <StaggerItem>
              <NumberTile tone="coral" value={programmes.length} label={numbers.programmesLabel} icon={<GraduationCap aria-hidden size={24} />} />
            </StaggerItem>
            {openCentres > 0 ? (
              <StaggerItem>
                <NumberTile tone="sky" value={openCentres} label={openCentres === 1 && lang === 'en' ? numbers.centresLabel.replace(/\bschools\b/, 'school') : numbers.centresLabel} icon={<MapPin aria-hidden size={24} />} />
              </StaggerItem>
            ) : null}
          </Stagger>
        </section>
      ) : null}

      {/* programmes */}
      {!isHidden(progHead) && programmes.length ? (
        <div className="balloon-sky relative bg-brand-50">
          <Wave flip className="absolute inset-x-0 top-0 -mt-px text-white" />
          <div aria-hidden className="balloon-track pointer-events-none absolute inset-y-0 left-[4%] hidden w-14 pt-24 lg:block">
            <div className="balloon-rise" style={{ ['--rise-duration' as string]: '38s' }}>
              <div><Balloon color="#ff7a59" /></div>
            </div>
          </div>
          <div aria-hidden className="balloon-track pointer-events-none absolute inset-y-0 right-[5%] hidden w-12 pt-28 lg:block">
            <div className="balloon-rise" style={{ ['--rise-duration' as string]: '46s', ['--rise-delay' as string]: '-20s' }}>
              <div><Balloon color="#38b6ff" /></div>
            </div>
          </div>
          <Section className="!pb-24 !pt-28 sm:!pt-32 lg:!pb-32 lg:!pt-40">
            <SectionHeading eyebrow={progHead.eyebrow} heading={progHead.heading} mark={progHead.highlight} text={progHead.text} tone="brand" />
            <div className="mt-12">
              <ProgrammeGrid programmes={programmes} />
            </div>
            {progHead.buttonLabel ? (
              <Reveal className="mt-10 text-center">
                <Cta href="/programmes" variant="indigo" arrow>
                  {progHead.buttonLabel}
                </Cta>
              </Reveal>
            ) : null}
          </Section>
          <Wave className="absolute inset-x-0 bottom-0 -mb-px text-white" variant={1} />
        </div>
      ) : null}

      {/* why */}
      {!isHidden(why) && why.items.length ? (
        <Section>
          <Drift className="absolute right-[6%] top-14 hidden w-20 text-sun-400 lg:block" rotate={8} duration={6} scroll={40}>
            <Scribble />
          </Drift>
          <SectionHeading eyebrow={why.eyebrow} heading={why.heading} mark={why.highlight} text={why.text} tone="coral" />
          <div className="mt-12">
            <PointGrid points={why.items} />
          </div>
        </Section>
      ) : null}

      {/* photos */}
      {!isHidden(galleryHead) && photos.length ? (
        <div className="relative bg-sun-50">
          <Wave flip className="absolute inset-x-0 top-0 -mt-px text-white" variant={1} />
          <Section className="!pb-24 !pt-28 sm:!pt-32 lg:!pb-32 lg:!pt-40">
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
          <Wave className="absolute inset-x-0 bottom-0 -mb-px text-white" />
        </div>
      ) : null}

      {/* kind words */}
      {!isHidden(testimonials) && quotes.length ? (
        <Section>
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

      {/* CEO speaks */}
      {!isHidden(ceo) && ceo.message ? (
        <div className="relative overflow-hidden bg-brand-50">
          <Wave flip className="absolute inset-x-0 top-0 -mt-px text-white" />
          <Section className="!pb-24 !pt-28 sm:!pt-32 lg:!pb-32 lg:!pt-40">
            <div className={`grid items-center gap-12 lg:gap-16 ${ceo.photo ? 'lg:grid-cols-[.8fr_1.2fr]' : ''}`}>
              {ceo.photo ? (
                <Reveal className="relative mx-auto w-full max-w-[460px]">
                  <div aria-hidden className="absolute -left-[10%] -top-[8%] w-[70%] text-sky-100">
                    <Blob variant={1} />
                  </div>
                  <Drift className="absolute -right-3 -top-6 z-10 w-10 text-sun-400" rotate={20} duration={5}>
                    <Sparkle />
                  </Drift>
                  <div aria-hidden className="absolute -bottom-6 -right-4 w-24 text-brand-200">
                    <Dots />
                  </div>
                  <Parallax amount={18}>
                    <div className="relative rotate-2 overflow-hidden rounded-[2.5rem] border-[8px] border-white bg-sky-100 shadow-lift">
                      <div className="relative aspect-square">
                        <SiteImage src={ceo.photo} alt={ceo.name} sizes="(min-width: 1024px) 460px, 92vw" />
                      </div>
                    </div>
                  </Parallax>
                </Reveal>
              ) : null}
              <div>
                <SectionHeading eyebrow={ceo.eyebrow} heading={ceo.heading} mark={ceo.highlight} align="left" tone="sky" />
                <Reveal delay={0.1}>
                  {ceo.quote ? (
                    <blockquote className="relative mt-6 rounded-[2rem] bg-white p-6 shadow-sm sm:p-8">
                      <Quote aria-hidden size={40} className="text-sky-400 opacity-50" fill="currentColor" strokeWidth={0} />
                      <p className="mt-2 text-pretty font-display text-2xl font-bold leading-snug text-brand-950 sm:text-[1.7rem]">{ceo.quote}</p>
                    </blockquote>
                  ) : null}
                  <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-700">
                    <Paragraphs text={ceo.message} />
                  </div>
                  <p className="mt-6 font-display text-xl font-bold text-brand-800">{ceo.name}</p>
                  {ceo.role ? <p className="text-ink-600">{ceo.role}</p> : null}
                </Reveal>
              </div>
            </div>
          </Section>
          <Wave className="absolute inset-x-0 bottom-0 -mb-px text-white" variant={1} />
        </div>
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

      {/* franchise */}
      {!isHidden(franchise) ? (
        <section className="relative pb-10 sm:pb-14">
          <div className={CONTAINER}>
            <Reveal className="relative overflow-hidden rounded-[2.25rem] bg-coral-50 px-6 py-10 sm:rounded-[3rem] sm:px-12 sm:py-14 lg:px-16">
              <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 text-coral-100">
                <Blob variant={2} />
              </div>
              <Drift className="absolute bottom-6 right-[30%] hidden w-6 text-coral-400 lg:block" rotate={20} duration={5}>
                <Sparkle />
              </Drift>
              <Drift className="absolute right-[6%] top-8 hidden w-28 text-white md:block" bob={8} duration={8}>
                <Cloud />
              </Drift>
              <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_.6fr]">
                <div>
                  {franchise.eyebrow ? (
                    <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 font-display text-sm font-bold uppercase tracking-wider text-coral-700">
                      <Sparkle className="h-3.5 w-3.5" />
                      {franchise.eyebrow}
                    </p>
                  ) : null}
                  <h2 className="mt-4 text-balance font-display text-[2rem] font-extrabold leading-tight text-brand-950 sm:text-[2.6rem]">{franchise.heading}</h2>
                  <p className="mt-3 max-w-2xl text-pretty text-lg leading-relaxed text-ink-700">{franchise.text}</p>
                </div>
                <div className="lg:text-right">
                  <Cta href="/franchise" variant="indigo" size="lg" arrow className="w-full sm:w-auto">
                    {franchise.buttonLabel}
                  </Cta>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      <div className="pt-6 sm:pt-10">
        <VisitBand visit={visit} whatsapp={contact.whatsapp} />
      </div>
    </>
  );
}
