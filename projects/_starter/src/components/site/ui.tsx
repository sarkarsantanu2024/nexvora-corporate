/**
 * The public website's own building blocks. Server-safe.
 *
 * The site has its own call-to-action button (`Cta`) instead of the dashboard
 * Button: the dashboards want a quiet square button, the website wants a big
 * round friendly one, and bending one into the other made both worse.
 */
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/ui/motion';
import { Sparkle } from './art';
import { SiteLink } from './i18n/client';
import { Marked } from './motion-kit';
import { CONTAINER, TONES, type Tone } from './theme';

/* ───────────── structured data ───────────── */

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // "<" is escaped so text typed by an editor can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

/* ───────────── images ───────────── */

const OPTIMISABLE = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/**
 * A photo from the site's own files or the media library goes through
 * next/image (resized, lazy, modern format). A photo pasted in from some
 * other address is shown as it is, because next/image refuses hosts it has
 * not been told about and one odd URL must not break a page.
 */
export function SiteImage({
  src,
  alt,
  sizes,
  className,
  priority,
  width,
  height,
}: {
  src: string;
  alt: string;
  /** Required for `fill` images: how wide the photo is shown at each screen size. */
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** Give both to reserve the photo's own shape; leave out to fill the parent box. */
  width?: number;
  height?: number;
}) {
  if (!src) return null;
  const local = src.startsWith('/') && !src.startsWith('//');
  const sized = Boolean(width && height);
  if (local || OPTIMISABLE.test(src)) {
    return sized ? (
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className={className} />
    ) : (
      <Image src={src} alt={alt} fill sizes={sizes ?? '100vw'} priority={priority} className={cn('object-cover', className)} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn(!sized && 'absolute inset-0 h-full w-full object-cover', className)}
    />
  );
}

/* ───────────── buttons ───────────── */

type CtaVariant = 'red' | 'indigo' | 'outline' | 'white' | 'whatsapp' | 'ghost';
type CtaSize = 'md' | 'lg' | 'sm';

const CTA_BASE =
  'group/cta relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-display font-bold leading-none transition duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[.97] disabled:pointer-events-none disabled:opacity-60';
const CTA_VARIANTS: Record<CtaVariant, string> = {
  red: 'bg-accent-500 text-white shadow-glow hover:bg-accent-600',
  indigo: 'bg-brand-700 text-white shadow-lift hover:bg-brand-800',
  outline: 'border-2 border-brand-200 bg-white text-brand-800 hover:border-brand-400 hover:bg-brand-50',
  white: 'bg-white text-brand-800 shadow-lift hover:bg-brand-50',
  whatsapp: 'bg-[#0b7a6b] text-white shadow-[0_12px_30px_-10px_rgba(11,122,107,.6)] hover:bg-[#096558]',
  ghost: 'text-brand-800 hover:bg-brand-50',
};
const CTA_SIZES: Record<CtaSize, string> = {
  sm: 'h-11 px-5 text-[15px]',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
};

export const ctaClass = (variant: CtaVariant = 'red', size: CtaSize = 'md', className?: string) =>
  cn(CTA_BASE, CTA_VARIANTS[variant], CTA_SIZES[size], className);

/** The sheen that sweeps across a filled button on hover. */
const Sheen = () => (
  <span
    aria-hidden
    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-500 group-hover/cta:left-[120%] group-hover/cta:opacity-100"
  />
);

export function Cta({
  href,
  variant = 'red',
  size = 'md',
  arrow,
  icon,
  className,
  children,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & {
  href: string;
  variant?: CtaVariant;
  size?: CtaSize;
  arrow?: boolean;
  icon?: ReactNode;
}) {
  const inner = (
    <>
      {variant !== 'outline' && variant !== 'ghost' ? <Sheen /> : null}
      {icon}
      <span className="relative">{children}</span>
      {arrow ? <ArrowRight aria-hidden size={18} strokeWidth={2.6} className="relative transition-transform duration-200 group-hover/cta:translate-x-1" /> : null}
    </>
  );
  const cls = ctaClass(variant, size, className);
  // tel:, WhatsApp, outside links and jumps within the page are plain anchors; pages of the site go through the router and keep the visitor's language.
  if (!href.startsWith('/')) {
    const outside = href.startsWith('http');
    return (
      <a href={href} className={cls} {...(outside ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...props}>
        {inner}
      </a>
    );
  }
  return (
    <SiteLink href={href} className={cls} {...props}>
      {inner}
    </SiteLink>
  );
}

/* ───────────── sections ───────────── */

export function Eyebrow({ children, tone = 'brand', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-sm font-bold uppercase tracking-wider', TONES[tone].chip, className)}>
      <Sparkle className="h-3.5 w-3.5" />
      {children}
    </p>
  );
}

/** The heading block at the top of a section, revealed on scroll. */
export function SectionHeading({
  eyebrow,
  heading,
  mark,
  text,
  tone = 'brand',
  align = 'center',
  as: Tag = 'h2',
  light,
  className,
}: {
  eyebrow?: string;
  heading: string;
  mark?: string;
  text?: string;
  tone?: Tone;
  align?: 'center' | 'left';
  as?: 'h2' | 'h3';
  /** On a dark background. */
  light?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cn(align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl', className)}>
      {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      <Tag className={cn('mt-4 text-balance font-display text-[2rem] font-extrabold leading-[1.12] sm:text-[2.6rem] lg:text-5xl', light ? 'text-white' : 'text-brand-950')}>
        <Marked text={heading} mark={mark} lineClass={light ? 'text-sun-400' : 'text-accent-500'} />
      </Tag>
      {text ? <p className={cn('mt-4 text-pretty text-lg leading-relaxed', light ? 'text-brand-100' : 'text-ink-600')}>{text}</p> : null}
    </Reveal>
  );
}

export function Section({ className, children, id, ...props }: ComponentProps<'section'>) {
  return (
    <section id={id} className={cn('relative py-16 sm:py-20 lg:py-24', className)} {...props}>
      <div className={CONTAINER}>{children}</div>
    </section>
  );
}

/* ───────────── small pieces ───────────── */

/** A tick list. */
export function Ticks({ items, tone = 'mint', className }: { items: string[]; tone?: Tone; className?: string }) {
  return (
    <ul className={cn('space-y-3', className)}>
      {items.filter(Boolean).map((item) => (
        <li key={item} className="flex items-start gap-3 text-[17px] font-medium text-ink-800">
          <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white', TONES[tone].solid)}>
            <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3.5 8.500 3 3 6-6.500" />
            </svg>
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Splits an editor's paragraph field on blank lines. */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={cn('whitespace-pre-line', className)}>
            {p}
          </p>
        ))}
    </>
  );
}
