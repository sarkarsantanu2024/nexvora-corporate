/**
 * The head of every inner page, set like the title page of a school
 * magazine: breadcrumbs, a small label with a rule, the page's one h1 in
 * large type, a paragraph, and the seal as a faint watermark at the right.
 * A server component (it reads the visitor's language).
 */
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SiteLink } from './i18n/client';
import { getSite } from './i18n/server';
import { Enter } from './motion-kit';
import { breadcrumbLd, type Crumb } from './seo';
import { CONTAINER } from './theme';
import { JsonLd, SiteImage } from './ui';

export async function PageTop({
  eyebrow,
  heading,
  text,
  crumbs,
  children,
  dark,
}: {
  eyebrow?: string;
  heading: string;
  text?: string;
  /** Kept for older callers; the school's pages share one look. */
  tone?: string;
  /** The trail after Home, ending with this page. */
  crumbs: Crumb[];
  children?: ReactNode;
  /** Navy instead of paper. */
  dark?: boolean;
}) {
  const { lang, t } = await getSite();
  const trail: Crumb[] = [{ name: t.nav.home, path: '/' }, ...crumbs];
  return (
    <header className={cn('relative overflow-hidden border-b', dark ? 'border-white/10 bg-brand-950 text-white' : 'border-brand-950/10 bg-[#f7f1e3]')}>
      <JsonLd data={breadcrumbLd(lang, trail)} />
      <div aria-hidden className={cn('pointer-events-none absolute -right-16 top-1/2 h-[340px] w-[340px] -translate-y-1/2 sm:h-[460px] sm:w-[460px]', dark ? 'opacity-[0.07] invert' : 'opacity-[0.06]')}>
        <SiteImage src="/brand/mark.png" alt="" sizes="460px" className="!object-contain" />
      </div>
      <div className={cn(CONTAINER, 'relative pb-12 pt-6 sm:pb-16 sm:pt-8')}>
        <nav aria-label={t.common.breadcrumb}>
          <ol className={cn('flex flex-wrap items-center gap-1 text-sm font-semibold', dark ? 'text-brand-200' : 'text-ink-600')}>
            {trail.map((crumb, index) => {
              const last = index === trail.length - 1;
              return (
                <li key={crumb.path} className="flex items-center gap-1">
                  {index > 0 ? <ChevronRight aria-hidden size={14} className="opacity-60" /> : null}
                  {last ? (
                    <span aria-current="page" className={dark ? 'text-white' : 'text-brand-950'}>
                      {crumb.name}
                    </span>
                  ) : (
                    <SiteLink href={crumb.path} className="inline-flex min-h-[44px] items-center rounded px-1 hover:underline">
                      {crumb.name}
                    </SiteLink>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        {eyebrow ? (
          <Enter y={10} className="mt-4 flex items-center gap-3">
            <span aria-hidden className="h-[3px] w-10 rounded-full bg-sun-400" />
            <p className={cn('text-sm font-bold', dark ? 'text-sun-300' : 'text-accent-600')}>{eyebrow}</p>
          </Enter>
        ) : null}
        <Enter delay={0.08}>
          <h1 className={cn('mt-3 max-w-4xl text-balance text-[2.25rem] font-bold leading-[1.15] sm:text-5xl lg:text-[3.6rem]', dark ? 'text-white' : 'text-brand-950')}>{heading}</h1>
        </Enter>
        {text ? (
          <Enter delay={0.16}>
            <p className={cn('mt-4 max-w-2xl text-pretty text-lg leading-relaxed sm:text-xl', dark ? 'text-brand-100' : 'text-ink-700')}>{text}</p>
          </Enter>
        ) : null}
        {children ? (
          <Enter delay={0.22} className="mt-7">
            {children}
          </Enter>
        ) : null}
      </div>
    </header>
  );
}
