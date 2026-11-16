/**
 * Larger pieces shared by several pages: the programme card, the point card,
 * numbered steps and the "come and visit" band. Server-safe.
 */
import { ArrowRight, Users } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { waLink } from '@/lib/wa';
import type { SiteProgramme } from '@/server/site/queries';
import { Cloud, Kite, Sparkle, Star, SunFace } from './art';
import { fill, type Dict } from './i18n';
import { SiteLink } from './i18n/client';
import { getSite } from './i18n/server';
import { PointIcon, WhatsAppIcon } from './icons';
import { Drift, Tilt } from './motion-kit';
import { Cta, SiteImage } from './ui';
import { CONTAINER, TONES, toneOf, type Tone } from './theme';

/* ───────────── programmes ───────────── */

// Used until a programme is given its own photo in the dashboard. Stock photos: see docs/CONTENT_TO_CONFIRM.md.
const PROGRAMME_PHOTOS: Record<string, { src: string; alt: keyof Dict['photos'] }> = {
  'play-group': { src: '/images/slide.webp', alt: 'playGroup' },
  nursery: { src: '/images/choosing-colours.webp', alt: 'nursery' },
  lkg: { src: '/images/table-activity.webp', alt: 'lkg' },
  ukg: { src: '/images/map-lesson.webp', alt: 'ukg' },
};
const FALLBACK_PHOTOS = Object.values(PROGRAMME_PHOTOS);

export function programmePhoto(p: Pick<SiteProgramme, 'slug' | 'image' | 'name'>, words: Dict, index = 0) {
  if (p.image) return { src: p.image, alt: fill(words.photos.classOf, { name: p.name }) };
  const stock = PROGRAMME_PHOTOS[p.slug] ?? FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length];
  return { src: stock.src, alt: words.photos[stock.alt] };
}

export async function ProgrammeCard({ programme, index }: { programme: SiteProgramme; index: number }) {
  const { t: words } = await getSite();
  const tone = toneOf(programme.color, index);
  const t = TONES[tone];
  const photo = programmePhoto(programme, words, index);
  return (
    <Tilt className="h-full">
      <SiteLink
        href={`/programmes/${programme.slug}`}
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-[2rem] border-2 bg-white p-3 shadow-card transition-shadow duration-300 hover:shadow-lift',
          t.border,
        )}
      >
        <div className={cn('relative aspect-[4/3] overflow-hidden rounded-[1.4rem]', t.tint)}>
          <SiteImage
            src={photo.src}
            alt={photo.alt}
            sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 92vw"
            className="transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <span className={cn('absolute left-3 top-3 rounded-full px-3 py-1 font-display text-sm font-bold text-white shadow-sm')} style={{ backgroundColor: t.deep }}>
            {programme.ageLabel}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
          <h3 className="font-display text-[1.7rem] font-extrabold leading-none text-brand-950">{programme.name}</h3>
          {programme.tagline ? <p className={cn('mt-2 font-display text-lg font-semibold', t.text)}>{programme.tagline}</p> : null}
          <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-600">{programme.description}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold', t.chip)}>
              <Users aria-hidden size={15} strokeWidth={2.6} />
              {fill(words.common.seats, { n: programme.seatsPerClass })}
            </span>
            <span
              aria-hidden
              className={cn('grid h-11 w-11 place-items-center rounded-full text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-[-8deg]', t.solid)}
            >
              <ArrowRight size={20} strokeWidth={2.8} />
            </span>
          </div>
        </div>
      </SiteLink>
    </Tilt>
  );
}

export function ProgrammeGrid({ programmes }: { programmes: SiteProgramme[] }) {
  return (
    <Stagger className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4" gap={0.1}>
      {programmes.map((p, i) => (
        <StaggerItem key={p.id} className="h-full">
          <ProgrammeCard programme={p} index={i} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/* ───────────── point cards ───────────── */

export type Point = { title?: string; text?: string; icon?: string; color?: string };

/** A soft card with a round icon, a title and a line or two. */
export function PointCard({ point, index, className }: { point: Point; index: number; className?: string }) {
  const tone = toneOf(point.color, index);
  const t = TONES[tone];
  return (
    <div
      className={cn(
        'group relative h-full overflow-hidden rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:p-7',
        className,
      )}
    >
      <span aria-hidden className={cn('absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-150', t.tint)} />
      <span
        className={cn('relative grid h-14 w-14 place-items-center rounded-2xl text-white shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110', t.solid)}
      >
        <PointIcon name={point.icon} size={26} />
      </span>
      <h3 className="relative mt-5 font-display text-[1.35rem] font-bold leading-tight text-brand-950">{point.title}</h3>
      {point.text ? <p className="relative mt-2 leading-relaxed text-ink-600">{point.text}</p> : null}
    </div>
  );
}

export function PointGrid({ points, columns = 3 }: { points: Point[]; columns?: 2 | 3 | 4 }) {
  // Flex, not grid, so that a last row with fewer cards sits in the middle and leaves no hole.
  const width =
    columns === 2
      ? 'sm:w-[calc(50%-0.75rem)]'
      : columns === 4
        ? 'sm:w-[calc(50%-0.75rem)] xl:w-[calc(25%-1.125rem)]'
        : 'sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]';
  return (
    <Stagger className="flex flex-wrap justify-center gap-5 sm:gap-6">
      {points.map((point, i) => (
        <StaggerItem key={`${point.title}-${i}`} className={cn('w-full', width)}>
          <PointCard point={point} index={i} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/* ───────────── numbered steps ───────────── */

const STEP_TONES: Tone[] = ['coral', 'sun', 'mint', 'sky', 'brand'];

/** Steps joined by a dotted path: a row on a wide screen, a column on a phone. */
export function Steps({ items }: { items: { title?: string; text?: string }[] }) {
  const wide = items.length <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
  return (
    <Stagger className={cn('relative grid gap-x-6 gap-y-10 sm:grid-cols-2', wide)} gap={0.12}>
      {items.map((step, i) => {
        const t = TONES[STEP_TONES[i % STEP_TONES.length]];
        return (
          <StaggerItem key={`${step.title}-${i}`} className="relative">
            {/* The dotted line to the next step; hidden on the last one and wherever the row wraps on small screens. */}
            {i < items.length - 1 ? (
              <span aria-hidden className="absolute left-[4.5rem] right-[-1.5rem] top-8 hidden border-t-[3px] border-dotted border-ink-300 lg:block" />
            ) : null}
            <div className="relative flex gap-4 lg:block">
              <span
                className={cn('relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-full font-display text-2xl font-extrabold text-white shadow-lift ring-8 ring-white', t.solid)}
              >
                {i + 1}
              </span>
              <div className="lg:mt-5">
                <h3 className="font-display text-xl font-bold text-brand-950">{step.title}</h3>
                {step.text ? <p className="mt-1.5 leading-relaxed text-ink-600">{step.text}</p> : null}
              </div>
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

/* ───────────── visit band ───────────── */

export type VisitContent = { heading: string; text: string; primaryLabel: string; whatsappLabel: string; whatsappMessage: string; _hidden?: string };

/** The indigo card near the foot of most pages that invites a parent to visit. */
export function VisitBand({ visit, whatsapp, href = '/admissions#enquire' }: { visit: VisitContent; whatsapp: string; href?: string }) {
  if (visit._hidden === '1') return null;
  const wa = waLink(whatsapp, visit.whatsappMessage);
  return (
    <section className="relative pb-20 pt-4 sm:pb-24">
      <div className={CONTAINER}>
        <Reveal className="relative overflow-hidden rounded-[2.25rem] bg-brand-700 px-6 py-12 text-center shadow-lift sm:rounded-[3rem] sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-brand-600/70" />
          <div aria-hidden className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-brand-800/80" />
          <Drift className="absolute left-[5%] top-8 w-20 sm:w-28" bob={8} duration={8} scroll={20}>
            <SunFace className="animate-[spin_40s_linear_infinite]" />
          </Drift>
          <Drift className="absolute right-[7%] top-6 hidden w-16 sm:block lg:w-20" bob={14} rotate={6} duration={7} scroll={30}>
            <Kite />
          </Drift>
          <Drift className="absolute bottom-6 left-[12%] hidden w-28 text-white/15 md:block" bob={6} duration={10}>
            <Cloud />
          </Drift>
          <Drift className="absolute bottom-10 right-[18%] w-6 text-sun-300" rotate={20} duration={5}>
            <Sparkle />
          </Drift>
          <Drift className="absolute left-[24%] top-10 hidden w-5 text-coral-300 lg:block" rotate={20} duration={6} delay={1}>
            <Star />
          </Drift>

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-display text-[2rem] font-extrabold leading-tight text-white sm:text-5xl">{visit.heading}</h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-brand-100">{visit.text}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Cta href={href} variant="red" size="lg" arrow className="w-full sm:w-auto">
                {visit.primaryLabel}
              </Cta>
              {wa ? (
                <Cta href={wa} variant="white" size="lg" icon={<WhatsAppIcon size={22} className="relative text-[#128c7e]" />} className="w-full sm:w-auto">
                  {visit.whatsappLabel}
                </Cta>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
