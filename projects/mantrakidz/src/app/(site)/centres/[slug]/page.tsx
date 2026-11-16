import { ArrowRight, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { content } from '@/cms/content';
import { siteBrand, siteVisit } from '@/cms/sections';
import { VisitBand } from '@/components/site/blocks';
import { CentreArt } from '@/components/site/centre-card';
import { fill } from '@/components/site/i18n';
import { SiteLink } from '@/components/site/i18n/client';
import { getSite } from '@/components/site/i18n/server';
import { WhatsAppIcon } from '@/components/site/icons';
import { NoticeCard } from '@/components/site/notices';
import { PageTop } from '@/components/site/page-top';
import { abs, absLocale, pageMeta } from '@/components/site/seo';
import { TONES, toneOf } from '@/components/site/theme';
import { Cta, JsonLd, Section, SiteImage } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { LANG_NAMES } from '@/lib/i18n';
import { telLink, waLink } from '@/lib/wa';
import { centreAddress, getCentre, getCentreProgrammeIds, getNotices, getProgrammes } from '@/server/site/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ lang, t }, centre] = await Promise.all([getSite(), getCentre(slug)]);
  if (!centre) return { title: t.centres.notFound };
  return pageMeta({
    lang,
    title: centre.name,
    description: fill(t.centres.meta, { name: centre.name, address: centreAddress(centre) }),
    path: `/centres/${centre.slug}`,
    image: centre.photo || undefined,
  });
}

export default async function CentrePage({ params }: Props) {
  const { slug } = await params;
  const centre = await getCentre(slug);
  if (!centre) notFound();
  const { lang, t } = await getSite();
  const c = t.centres;

  const [brand, visit, programmes, runningIds, notices] = await Promise.all([
    content(siteBrand),
    content(siteVisit),
    getProgrammes(),
    getCentreProgrammeIds(centre.id),
    getNotices(),
  ]);

  // A centre that has set up its classes shows those; one that has not yet shows the chain's full list.
  const running = programmes.filter((p) => runningIds.includes(p.id));
  const classes = running.length ? running : programmes;
  const address = centreAddress(centre);
  const tel = telLink(centre.phone);
  const wa = waLink(centre.whatsapp || centre.phone, fill(t.common.waAdmission, { name: centre.name }));
  const ownNotices = notices.filter((n) => n.centreId === centre.id);
  const opening = centre.status === 'onboarding';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Preschool',
    inLanguage: LANG_NAMES[lang].htmlLang,
    name: centre.name,
    url: absLocale(lang, `/centres/${centre.slug}`),
    image: abs(centre.photo || '/images/hero.jpg'),
    parentOrganization: { '@type': 'Preschool', name: brand.name, '@id': abs('/#school') },
    address: {
      '@type': 'PostalAddress',
      streetAddress: centre.address,
      ...(centre.city ? { addressLocality: centre.city } : {}),
      ...(centre.state ? { addressRegion: centre.state } : {}),
      ...(centre.pincode ? { postalCode: centre.pincode } : {}),
      addressCountry: 'IN',
    },
    ...(centre.phone ? { telephone: `+91${centre.phone.replace(/\D/g, '').slice(-10)}` } : {}),
    ...(centre.email ? { email: centre.email } : {}),
    ...(centre.mapUrl ? { hasMap: centre.mapUrl } : {}),
  };

  const row = 'flex items-start gap-4 rounded-2xl p-3 transition hover:bg-brand-50';
  const chip = 'grid h-12 w-12 shrink-0 place-items-center rounded-2xl';

  return (
    <>
      <JsonLd data={ld} />
      <PageTop
        eyebrow={opening ? t.common.openingSoon : centre.area || centre.city || c.ourCentre}
        heading={centre.name}
        text={address}
        tone="sky"
        crumbs={[
          { name: t.nav.centres, path: '/centres' },
          { name: centre.name, path: `/centres/${centre.slug}` },
        ]}
      />

      <Section className="!pt-10 sm:!pt-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-12">
          <Reveal className="relative overflow-hidden rounded-[2.5rem] border-[8px] border-white shadow-lift">
            <div className="relative aspect-[4/3] h-full min-h-[260px] w-full">
              {centre.photo ? <SiteImage src={centre.photo} alt={fill(c.photoAlt, { name: centre.name })} priority sizes="(min-width: 1024px) 680px, 92vw" /> : <CentreArt tone="sky" className="absolute inset-0" />}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="rounded-[2.5rem] border border-ink-100 bg-white p-5 shadow-card sm:p-7">
            <h2 className="px-3 font-display text-2xl font-extrabold text-brand-950">{c.reach}</h2>
            <ul className="mt-3 space-y-1">
              <li>
                {/* The map link appears only once the centre has saved one: we do not guess a pin. */}
                <div className={cn(row, 'hover:bg-transparent')}>
                  <span className={cn(chip, 'bg-sky-100 text-sky-700')}>
                    <MapPin aria-hidden size={22} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold uppercase tracking-wide text-ink-500">{c.address}</span>
                    <span className="block text-lg font-semibold text-ink-900">{address}</span>
                    {centre.mapUrl ? (
                      <a
                        href={centre.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-brand-50 px-4 text-[15px] font-bold text-brand-700 hover:bg-brand-100"
                      >
                        <Navigation aria-hidden size={15} />
                        {c.openMap}
                      </a>
                    ) : null}
                  </span>
                </div>
              </li>
              {tel ? (
                <li>
                  <a href={tel} className={row}>
                    <span className={cn(chip, 'bg-brand-100 text-brand-700')}>
                      <Phone aria-hidden size={22} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold uppercase tracking-wide text-ink-500">{c.phone}</span>
                      <span className="tabular block text-lg font-semibold text-ink-900">{centre.phone}</span>
                    </span>
                  </a>
                </li>
              ) : null}
              {wa ? (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className={row}>
                    <span className={cn(chip, 'bg-mint-100 text-mint-700')}>
                      <WhatsAppIcon size={24} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold uppercase tracking-wide text-ink-500">{c.whatsapp}</span>
                      <span className="block text-lg font-semibold text-ink-900">{c.sendMessage}</span>
                    </span>
                  </a>
                </li>
              ) : null}
              {centre.email ? (
                <li>
                  <a href={`mailto:${centre.email}`} className={row}>
                    <span className={cn(chip, 'bg-coral-100 text-coral-700')}>
                      <Mail aria-hidden size={22} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold uppercase tracking-wide text-ink-500">{c.email}</span>
                      <span className="block break-all text-lg font-semibold text-ink-900">{centre.email}</span>
                    </span>
                  </a>
                </li>
              ) : null}
            </ul>
            <div className="mt-4 px-3">
              <Cta href={`/admissions?centre=${centre.slug}#enquire`} arrow className="w-full">
                {c.enquire}
              </Cta>
            </div>
          </Reveal>
        </div>
      </Section>

      {classes.length ? (
        <Section className="!pt-0">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{c.classes}</h2>
          </Reveal>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {classes.map((p) => {
              const t = TONES[toneOf(p.color, programmes.indexOf(p))];
              return (
                <StaggerItem key={p.id} className="h-full">
                  <SiteLink
                    href={`/programmes/${p.slug}`}
                    className={cn('group flex h-full items-center justify-between gap-3 rounded-3xl border-2 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift', t.soft, t.border)}
                  >
                    <span>
                      <span className="block font-display text-2xl font-extrabold text-brand-950">{p.name}</span>
                      <span className={cn('text-[15px] font-semibold', t.text)}>{p.ageLabel}</span>
                    </span>
                    <span aria-hidden className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition-transform group-hover:translate-x-1', t.solid)}>
                      <ArrowRight size={18} strokeWidth={2.8} />
                    </span>
                  </SiteLink>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Section>
      ) : null}

      {ownNotices.length ? (
        <Section className="!pt-0">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{c.notices}</h2>
          </Reveal>
          <Stagger className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ownNotices.slice(0, 6).map((notice, i) => (
              <StaggerItem key={notice.id} className="h-full">
                <NoticeCard notice={notice} index={i} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      ) : null}

      <VisitBand visit={visit} whatsapp={centre.whatsapp || centre.phone} href={`/admissions?centre=${centre.slug}#enquire`} />
    </>
  );
}
