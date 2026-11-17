/**
 * The coloured band at the top of every inner page: breadcrumbs, the page's
 * one h1, a paragraph, floating doodles and a wavy lower edge.
 * A server component (it reads the visitor's language), so it lives apart
 * from ui.tsx, which client components also import.
 */
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Blob, Cloud, Sparkle, Star, Wave } from './art';
import { SiteLink } from './i18n/client';
import { getSite } from './i18n/server';
import { Drift, Enter } from './motion-kit';
import { breadcrumbLd, type Crumb } from './seo';
import { CONTAINER, TONES, type Tone } from './theme';
import { Eyebrow, JsonLd } from './ui';

const TOP_BG: Record<Tone, string> = {
  sun: 'from-sun-50 to-sun-100/60',
  coral: 'from-coral-50 to-coral-100/60',
  mint: 'from-mint-50 to-mint-100/60',
  sky: 'from-sky-50 to-sky-100/60',
  brand: 'from-brand-50 to-brand-100/60',
};

export async function PageTop({
  eyebrow,
  heading,
  text,
  tone = 'brand',
  crumbs,
  children,
}: {
  eyebrow?: string;
  heading: string;
  text?: string;
  tone?: Tone;
  /** The trail after Home, ending with this page. */
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  const { lang, t } = await getSite();
  const trail: Crumb[] = [{ name: t.nav.home, path: '/' }, ...crumbs];
  return (
    <header className={cn('relative overflow-hidden bg-gradient-to-b pt-10 sm:pt-14', TOP_BG[tone])}>
      <JsonLd data={breadcrumbLd(lang, trail)} />
      <Drift className="absolute -left-10 top-10 w-40 text-white/80 sm:w-56" scroll={30} bob={8} duration={9} fromTop>
        <Cloud />
      </Drift>
      <Drift className="absolute right-[6%] top-8 hidden w-28 text-white/80 sm:block" scroll={50} bob={12} duration={7} delay={1} fromTop>
        <Cloud />
      </Drift>
      <Drift className={cn('absolute right-[14%] top-28 w-8 sm:w-10', TONES[tone].text)} scroll={70} rotate={12} duration={5} fromTop>
        <Star className="opacity-70" />
      </Drift>
      <Drift className="absolute bottom-24 left-[9%] hidden w-7 text-accent-400 md:block" scroll={60} rotate={18} duration={6} delay={0.6} fromTop>
        <Sparkle />
      </Drift>
      <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 text-white opacity-60">
        <Blob variant={1} />
      </div>

      <div className={cn(CONTAINER, 'relative pb-16 text-center sm:pb-20')}>
        <Enter y={10}>
          <nav aria-label={t.common.breadcrumb}>
            <ol className="flex flex-wrap items-center justify-center gap-1 text-sm font-semibold text-ink-600">
              {trail.map((crumb, index) => {
                const last = index === trail.length - 1;
                return (
                  <li key={crumb.path} className="flex items-center gap-1">
                    {index > 0 ? <ChevronRight aria-hidden size={14} className="text-ink-400" /> : null}
                    {last ? (
                      <span aria-current="page" className="text-brand-800">
                        {crumb.name}
                      </span>
                    ) : (
                      <SiteLink href={crumb.path} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-1 hover:text-brand-700 hover:underline">
                        {crumb.name}
                      </SiteLink>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </Enter>
        {eyebrow ? (
          <Enter delay={0.05} className="mt-3">
            <Eyebrow tone={tone} className="bg-white/80">
              {eyebrow}
            </Eyebrow>
          </Enter>
        ) : null}
        <Enter delay={0.12}>
          <h1 className="mx-auto mt-4 max-w-4xl text-balance font-display text-[2.3rem] font-extrabold leading-[1.08] text-brand-950 sm:text-5xl lg:text-6xl">{heading}</h1>
        </Enter>
        {text ? (
          <Enter delay={0.2}>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-ink-700 sm:text-xl">{text}</p>
          </Enter>
        ) : null}
        {children ? (
          <Enter delay={0.28} className="mt-8">
            {children}
          </Enter>
        ) : null}
      </div>
      <Wave className="relative -mb-px text-white" />
    </header>
  );
}
