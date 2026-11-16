import { Cake, Clock, IndianRupee, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { content } from '@/cms/content';
import { programmesDetail, siteContact, siteVisit } from '@/cms/sections';
import { Blob, Dots, Star } from '@/components/site/art';
import { ProgrammeCard, programmePhoto, VisitBand } from '@/components/site/blocks';
import { fill } from '@/components/site/i18n';
import { getSite } from '@/components/site/i18n/server';
import { Drift, Parallax } from '@/components/site/motion-kit';
import { PageTop } from '@/components/site/page-top';
import { abs, absLocale, pageMeta } from '@/components/site/seo';
import { TONES, toneOf } from '@/components/site/theme';
import { Cta, JsonLd, Paragraphs, Section, SiteImage } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { LANG_NAMES } from '@/lib/i18n';
import { getProgramme, getProgrammes } from '@/server/site/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ lang, t }, programme] = await Promise.all([getSite(), getProgramme(slug)]);
  if (!programme) return { title: t.programmes.notFound };
  return pageMeta({
    lang,
    title: `${programme.name}${programme.ageLabel ? ` (${programme.ageLabel})` : ''}`,
    description: programme.description || fill(t.programmes.metaFallback, { name: programme.name, age: programme.ageLabel }),
    path: `/programmes/${programme.slug}`,
    image: programmePhoto(programme, t).src,
  });
}

export default async function ProgrammePage({ params }: Props) {
  const { slug } = await params;
  const { lang, t: words } = await getSite();
  const [programmes, detail, contact, visit] = await Promise.all([getProgrammes(), content(programmesDetail), content(siteContact), content(siteVisit)]);
  const index = programmes.findIndex((p) => p.slug === slug);
  const programme = programmes[index];
  if (!programme) notFound();

  const tone = toneOf(programme.color, index);
  const t = TONES[tone];
  const photo = programmePhoto(programme, words, index);
  const others = programmes.filter((p) => p.id !== programme.id);
  const facts = [
    programme.ageLabel ? { icon: <Cake aria-hidden size={22} />, label: words.programmes.age, value: programme.ageLabel } : null,
    { icon: <Users aria-hidden size={22} />, label: words.programmes.classSize, value: fill(words.common.seats, { n: programme.seatsPerClass }), note: detail.seatsText },
    programme.timing ? { icon: <Clock aria-hidden size={22} />, label: words.programmes.timing, value: programme.timing } : null,
    detail.feeText ? { icon: <IndianRupee aria-hidden size={22} />, label: detail.feeHeading, note: detail.feeText } : null,
  ].filter((fact) => fact !== null);

  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    inLanguage: LANG_NAMES[lang].htmlLang,
    name: programme.name,
    description: programme.description,
    url: absLocale(lang, `/programmes/${programme.slug}`),
    provider: { '@type': 'Preschool', name: 'Mantra Kidz', '@id': abs('/#school') },
    ...(programme.ageLabel ? { typicalAgeRange: programme.ageLabel } : {}),
  };

  return (
    <>
      <JsonLd data={course} />
      <PageTop
        eyebrow={programme.ageLabel}
        heading={programme.name}
        text={programme.tagline}
        tone={tone}
        crumbs={[
          { name: words.nav.programmes, path: '/programmes' },
          { name: programme.name, path: `/programmes/${programme.slug}` },
        ]}
      />

      <Section className="overflow-hidden !pt-10 sm:!pt-14">
        <div className="grid items-start gap-12 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
          <Reveal className="relative mx-auto w-full max-w-[520px] lg:sticky lg:top-28">
            <div aria-hidden className={cn('absolute -left-[10%] -top-[8%] w-[65%] opacity-60', t.text)}>
              <Blob variant={1} />
            </div>
            <div aria-hidden className="absolute -bottom-6 right-[4%] w-24 text-brand-200">
              <Dots />
            </div>
            <Drift className={cn('absolute -right-3 -top-6 z-10 w-12', t.text)} rotate={14} duration={6}>
              <Star />
            </Drift>
            <Parallax amount={14}>
              <div className={cn('relative rotate-2 overflow-hidden rounded-[2.5rem] border-[8px] border-white shadow-lift', t.tint)}>
                <div className="relative aspect-[4/5]">
                  <SiteImage src={photo.src} alt={photo.alt} priority sizes="(min-width: 1024px) 520px, 92vw" />
                </div>
              </div>
            </Parallax>
          </Reveal>

          <div>
            <Reveal className="space-y-4 text-pretty text-xl leading-relaxed text-ink-700">
              <Paragraphs text={programme.description} />
            </Reveal>

            {programme.highlights.length ? (
              <div className="mt-10">
                <Reveal>
                  <h2 className="font-display text-3xl font-extrabold text-brand-950">{detail.highlightsHeading}</h2>
                </Reveal>
                <Stagger className="mt-5 grid gap-3 sm:grid-cols-2">
                  {programme.highlights.map((item, i) => (
                    <StaggerItem key={item}>
                      <div className={cn('flex h-full items-center gap-3 rounded-2xl px-4 py-4 text-[17px] font-semibold text-ink-800', t.soft)}>
                        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-base font-extrabold text-white', t.solid)}>{i + 1}</span>
                        {item}
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            ) : null}

            <Stagger className="mt-10 grid gap-4 sm:grid-cols-2">
              {facts.map((fact) => (
                <StaggerItem key={fact.label}>
                  <div className="h-full rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
                    <div className="flex items-center gap-3">
                      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', t.chip)}>{fact.icon}</span>
                      <div className="leading-tight">
                        <p className="text-sm font-bold uppercase tracking-wide text-ink-500">{fact.label}</p>
                        {'value' in fact && fact.value ? <p className="tabular font-display text-xl font-extrabold text-brand-950">{fact.value}</p> : null}
                      </div>
                    </div>
                    {'note' in fact && fact.note ? <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{fact.note}</p> : null}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="mt-10">
              <Cta href={`/admissions?programme=${programme.slug}#enquire`} size="lg" arrow className="w-full sm:w-auto">
                {detail.buttonLabel}
              </Cta>
            </Reveal>
          </div>
        </div>
      </Section>

      {others.length ? (
        <Section className="!pt-0">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{detail.othersHeading}</h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((p) => (
              <StaggerItem key={p.id} className="h-full">
                <ProgrammeCard programme={p} index={programmes.indexOf(p)} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      ) : null}

      <VisitBand visit={visit} whatsapp={contact.whatsapp} href={`/admissions?programme=${programme.slug}#enquire`} />
    </>
  );
}
