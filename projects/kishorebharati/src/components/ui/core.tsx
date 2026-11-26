/**
 * The building blocks every dashboard screen is made of. No client code in
 * here, so they can be used from server components. Interactive pieces
 * (dialogs, toasts, search boxes) live in ./client.tsx.
 */
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/* ───────────── Button ───────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap select-none';
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800',
  accent: 'bg-accent-500 text-white shadow-sm hover:bg-accent-600',
  success: 'bg-mint-500 text-white shadow-sm hover:bg-mint-700',
  secondary: 'border border-ink-200 bg-white text-ink-800 shadow-sm hover:border-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
  danger: 'border border-accent-200 bg-white text-accent-700 hover:bg-accent-50',
};
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-[15px]',
};

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) =>
  cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type="button" {...props} className={buttonClass(variant, size, className)} />;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

/* ───────────── Card ───────────── */

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('rounded-2xl border border-ink-200 bg-white shadow-card', className)} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-ink-900">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('p-5', className)} />;
}

/* ───────────── Page header ───────────── */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** A link back to the list this page belongs to. */
  back?: { href: string; label: string };
}) {
  return (
    <div className="page-header mb-4 sm:mb-6">
      {back ? (
        <Link href={back.href} className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-700 max-lg:hidden">
          <span aria-hidden>←</span> {back.label}
        </Link>
      ) : null}
      {/* The heading and the screen's buttons share one row, on a phone too. When the
          buttons need more than half the row they drop to a row of their own. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <h1 className="min-w-[50%] flex-1 font-display text-[22px] font-bold leading-tight text-ink-900 sm:text-2xl">{title}</h1>
        {actions ? <div className="page-actions no-print flex max-w-full flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="mt-1 max-w-2xl text-sm text-ink-500 sm:text-[15px]">{description}</p> : null}
    </div>
  );
}

/* ───────────── Badge ───────────── */

export type Tone = 'neutral' | 'brand' | 'green' | 'amber' | 'red' | 'blue' | 'violet';

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-100 text-brand-800',
  green: 'bg-mint-100 text-mint-700',
  amber: 'bg-sun-100 text-sun-700',
  red: 'bg-accent-100 text-accent-700',
  blue: 'bg-sky-100 text-sky-700',
  violet: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
};

export function Badge({ tone = 'neutral', className, ...props }: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      {...props}
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone], className)}
    />
  );
}

/** One place that decides the colour of every status word in the app. */
const STATUS_TONES: Record<string, Tone> = {
  // enquiries
  new: 'blue', contacted: 'violet', closed: 'neutral',
  // general: a business module adds its own words here
  active: 'green', inactive: 'neutral', pending: 'amber', done: 'green',
  // money
  paid: 'green', partial: 'amber', unpaid: 'red', cancelled: 'neutral',
  // students, certificates, schemes
  left: 'neutral', passed_out: 'blue', promoted: 'green', detained: 'amber', passed: 'blue', voided: 'red',
  applied: 'amber', sanctioned: 'blue', received: 'green', rejected: 'red',
  // exams
  draft: 'neutral', open: 'amber', published: 'green',
  // staff leave (office registers)
  approved: 'green',
  // library books
  available: 'green', issued: 'blue', lost: 'red', withdrawn: 'neutral',
};

/** The words for a status. Pass the screen's `t` to get them in the person's language. */
export const statusLabel = (status: string, t?: (text: string) => string) => {
  const label = status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  return t ? t(label) : label;
};

export function StatusBadge({ status, label, t }: { status: string; label?: string; t?: (text: string) => string }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{label ?? statusLabel(status, t)}</Badge>;
}

/* ───────────── Stat tile ───────────── */

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <Card className={cn('group h-full p-5 transition', href && 'hover:border-brand-300')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {icon ? <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', TONES[tone])}>{icon}</span> : null}
      </div>
      <p className="tabular mt-2 font-display text-[26px] font-bold leading-none text-ink-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ───────────── Empty state ───────────── */

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {icon ? <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div> : null}
      <p className="text-base font-bold text-ink-900">{title}</p>
      {text ? <p className="mt-1 max-w-sm text-sm text-ink-500">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ───────────── Table ───────────── */

/** On a phone each row is drawn as a card (see "table-cards" in globals.css); wider screens get the table. */
export function Table({ className, children, ...props }: ComponentProps<'table'>) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table {...props} className={cn('table-cards w-full min-w-[640px] border-collapse text-left text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      {...props}
      className={cn('whitespace-nowrap border-b border-ink-200 bg-ink-50/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500', className)}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return <td {...props} className={cn('border-b border-ink-100 px-4 py-3 align-middle text-ink-800', className)} />;
}

export function Tr({ className, ...props }: ComponentProps<'tr'>) {
  return <tr {...props} className={cn('transition-colors hover:bg-brand-50/40', className)} />;
}

/* ───────────── Form fields ───────────── */

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
        {required ? <span className="text-accent-500"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm font-medium text-accent-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, invalid, ...props }: ComponentProps<'input'> & { invalid?: boolean }) {
  return <input {...props} className={cn('control', invalid && 'control-invalid', className)} />;
}

export function Textarea({ className, invalid, ...props }: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return <textarea rows={3} {...props} className={cn('control min-h-[92px] resize-y', invalid && 'control-invalid', className)} />;
}

export function Select({ className, invalid, children, ...props }: ComponentProps<'select'> & { invalid?: boolean }) {
  return (
    <select {...props} className={cn('control appearance-none bg-[length:16px] bg-[right_.9rem_center] bg-no-repeat pr-10', invalid && 'control-invalid', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371718c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}

/** Lays form fields out in one column on a phone and two from tablet up. */
export function FormGrid({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('grid gap-4 sm:grid-cols-2', className)} />;
}

/* ───────────── Small pieces ───────────── */

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  // A stable colour per name, so a list is easy to scan.
  const hues = ['bg-brand-100 text-brand-800', 'bg-sun-100 text-sun-700', 'bg-mint-100 text-mint-700', 'bg-sky-100 text-sky-700', 'bg-coral-100 text-coral-700'];
  const hue = hues[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % hues.length];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full font-bold', hue)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials || '?'}
    </span>
  );
}

/** A label and a value, for detail pages. `empty` is what shows when there is no value, in the person's language. */
export function Detail({ label, children, className, empty = 'Not added' }: { label: string; children: ReactNode; className?: string; empty?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-ink-900">{children || <span className="text-ink-400">{empty}</span>}</dd>
    </div>
  );
}

/** A thin progress bar: how much of a target is done. */
export function Meter({ value, max = 100, tone = 'brand', className }: { value: number; max?: number; tone?: 'brand' | 'green' | 'amber' | 'red'; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fill = { brand: 'bg-brand-600', green: 'bg-mint-500', amber: 'bg-sun-500', red: 'bg-accent-500' }[tone];
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-100', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-700', fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Row of links that work as tabs; the active one is decided by the page. */
export function TabLinks({ tabs, active }: { tabs: { href: string; label: string; count?: number; key: string }[]; active: string }) {
  return (
    <div className="no-scrollbar no-print mb-5 flex gap-1 overflow-x-auto border-b border-ink-200">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          scroll={false}
          className={cn(
            '-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold transition',
            tab.key === active ? 'border-brand-700 text-brand-800' : 'border-transparent text-ink-500 hover:text-ink-800',
          )}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span className={cn('rounded-full px-1.5 text-xs', tab.key === active ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-600')}>{tab.count}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function Notice({ tone = 'blue', children, className }: { tone?: 'blue' | 'amber' | 'red' | 'green'; children: ReactNode; className?: string }) {
  const tones = {
    blue: 'border-sky-100 bg-sky-50 text-sky-700',
    amber: 'border-sun-100 bg-sun-50 text-sun-700',
    red: 'border-accent-100 bg-accent-50 text-accent-700',
    green: 'border-mint-100 bg-mint-50 text-mint-700',
  };
  return <div className={cn('rounded-xl border px-4 py-3 text-sm font-medium', tones[tone], className)}>{children}</div>;
}
