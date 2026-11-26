/**
 * Larger pieces shared by several pages: the point card and the
 * "get in touch" band. Server-safe.
 */
import { ArrowRight, Users } from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { waLink } from '@/lib/wa';
import { Cloud, Sparkle, Star } from './art';
import { fill, type Dict } from './i18n';
import { SiteLink } from './i18n/client';
import { getSite } from './i18n/server';
import { PointIcon, WhatsAppIcon } from './icons';
import { Drift, Tilt } from './motion-kit';
import { Cta, SiteImage } from './ui';
import { CONTAINER, TONES, toneOf, type Tone } from './theme';

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

/* ───────────── get in touch band ───────────── */

export type CtaContent = { heading: string; text: string; primaryLabel: string; whatsappLabel: string; whatsappMessage: string; _hidden?: string };

/** The coloured card near the foot of most pages that invites a visitor to get in touch. */
export function CtaBand({ visit, whatsapp, href = '/contact#enquire' }: { visit: CtaContent; whatsapp: string; href?: string }) {
  if (visit._hidden === '1') return null;
  const wa = waLink(whatsapp, visit.whatsappMessage);
  return (
    <section className="relative pb-20 pt-4 sm:pb-24">
      <div className={CONTAINER}>
        <Reveal className="relative overflow-hidden rounded-[2.25rem] bg-brand-700 px-6 py-12 text-center shadow-lift sm:rounded-[3rem] sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-brand-600/70" />
          <div aria-hidden className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-brand-800/80" />
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
