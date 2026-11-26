/**
 * The school site's own building blocks, in an editorial style: numbered
 * section heads with a rule, bands of paper and night, ruled lists and
 * tables. Server-safe; the few moving parts are the shared Reveal/Stagger.
 */
import { ArrowUpRight } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { PointIcon } from './icons';
import { Marked } from './motion-kit';
import { CONTAINER } from './theme';
import { SiteImage } from './ui';

export type BandTone = 'paper' | 'deep' | 'white' | 'night';
const BAND: Record<BandTone, string> = {
  paper: 'bg-[#fbf7ec]',
  deep: 'bg-[#f2e9d3]',
  white: 'bg-white',
  night: 'bg-brand-950 text-brand-100',
};

/** A full-width band with the page container inside. */
export function Band({ tone = 'paper', className, inner, children, ...props }: ComponentProps<'section'> & { tone?: BandTone; inner?: string }) {
  return (
    <section className={cn('relative py-14 sm:py-20 lg:py-24', BAND[tone], className)} {...props}>
      <div className={cn(CONTAINER, inner)}>{children}</div>
    </section>
  );
}

/** "01 — label" with a rule, then a large heading and an optional paragraph. */
export function Head({
  index,
  eyebrow,
  heading,
  mark,
  text,
  light,
  as: Tag = 'h2',
  className,
  aside,
}: {
  index?: number;
  eyebrow?: string;
  heading: string;
  mark?: string;
  text?: string;
  light?: boolean;
  as?: 'h2' | 'h3';
  className?: string;
  /** Something to put at the right of the heading on a wide screen (a button). */
  aside?: ReactNode;
}) {
  return (
    <Reveal className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-3xl">
        {eyebrow || index ? (
          <p className={cn('flex items-center gap-3 text-sm font-bold', light ? 'text-sun-300' : 'text-accent-600')}>
            {index ? <span className="tabular font-semibold opacity-80">{String(index).padStart(2, '0')}</span> : null}
            <span aria-hidden className={cn('h-px w-10', light ? 'bg-sun-300/60' : 'bg-accent-600/50')} />
            {eyebrow}
          </p>
        ) : null}
        <Tag className={cn('mt-3 text-balance text-[1.9rem] font-bold leading-[1.18] sm:text-[2.5rem] lg:text-[2.9rem]', light ? 'text-white' : 'text-brand-950')}>
          <Marked text={heading} mark={mark} lineClass="text-sun-400" />
        </Tag>
        {text ? <p className={cn('mt-4 max-w-2xl text-pretty text-lg leading-relaxed', light ? 'text-brand-100' : 'text-ink-700')}>{text}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </Reveal>
  );
}

/** Paragraphs separated by a blank line in the editor. */
export function Prose({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-4 text-pretty text-lg leading-relaxed', className)}>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
    </div>
  );
}

/** A numbered list with hairlines between rows. */
export function RuledList({ items, light, numbered = true, className }: { items: string[]; light?: boolean; numbered?: boolean; className?: string }) {
  const rows = items.filter(Boolean);
  return (
    <Stagger role="list" className={cn('divide-y border-y', light ? 'divide-white/10 border-white/10' : 'divide-brand-950/10 border-brand-950/10', className)}>
      {rows.map((item, i) => (
        <StaggerItem key={`${item}-${i}`} role="listitem" className="flex gap-4 py-4">
          {numbered ? <span className={cn('tabular w-7 shrink-0 pt-0.5 text-sm font-semibold', light ? 'text-sun-300' : 'text-accent-600')}>{String(i + 1).padStart(2, '0')}</span> : null}
          <span className={cn('text-[17px] leading-relaxed', light ? 'text-brand-50' : 'text-ink-800')}>{item}</span>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** A plain card: an icon or photo, a title and a few lines. */
export function InfoCard({ title, text, icon, image, className, footer }: { title: string; text?: string; icon?: string; image?: string; className?: string; footer?: ReactNode }) {
  return (
    <article className={cn('group flex h-full flex-col overflow-hidden rounded-xl border border-brand-950/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-28px_rgba(22,26,58,.55)]', className)}>
      {image ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-brand-50">
          <SiteImage src={image} alt="" sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 92vw" className="transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        {icon && !image ? (
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-950 text-sun-300 transition-transform duration-300 group-hover:-rotate-6">
            <PointIcon name={icon} size={22} />
          </span>
        ) : null}
        <h3 className="text-xl font-bold leading-snug text-brand-950">{title}</h3>
        {text ? <p className="mt-2 flex-1 leading-relaxed text-ink-700">{text}</p> : null}
        {footer}
      </div>
    </article>
  );
}

/** A grid that staggers its cards in. */
export function CardGrid({ children, cols = 3, className }: { children: ReactNode[]; cols?: 2 | 3 | 4; className?: string }) {
  const grid = cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <Stagger className={cn('grid gap-5', grid, className)}>
      {children.map((child, i) => (
        <StaggerItem key={i} className="h-full">
          {child}
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** Two-column rows of label and value, as on an official form. */
export function FactTable({ rows, className }: { rows: { label: string; value: string }[]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-brand-950/10 border-y border-brand-950/10', className)}>
      {rows
        .filter((r) => r.label && r.value)
        .map((row) => (
          <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[minmax(180px,1fr)_2fr] sm:gap-6">
            <dt className="text-sm font-semibold text-ink-600">{row.label}</dt>
            <dd className="break-words text-[17px] font-semibold text-brand-950">{row.value}</dd>
          </div>
        ))}
    </dl>
  );
}

/** A link that leaves the site, with a small arrow and the new-tab warning for screen readers. */
export function OutLink({ href, children, note, className }: { href: string; children: ReactNode; note: string; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn('inline-flex min-h-[44px] items-center gap-1 font-semibold text-brand-700 underline decoration-sun-400 decoration-2 underline-offset-4 hover:text-brand-950', className)}>
      {children}
      <ArrowUpRight aria-hidden size={16} />
      <span className="sr-only">{note}</span>
    </a>
  );
}

/** Day, month, year in the visitor's language: '16 Nov 2026'. */
export function niceDate(iso: string, months: string[]) {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

/** A tall date block: day number over the month. */
export function DateBlock({ iso, months, className }: { iso: string; months: string[]; className?: string }) {
  const [, m, d] = iso.split('-');
  return (
    <span className={cn('grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-brand-950 text-center leading-none text-white', className)}>
      <span>
        <span className="tabular block text-2xl font-bold">{Number(d)}</span>
        <span className="mt-1 block text-xs font-semibold text-sun-300">{months[Number(m) - 1]}</span>
      </span>
    </span>
  );
}
