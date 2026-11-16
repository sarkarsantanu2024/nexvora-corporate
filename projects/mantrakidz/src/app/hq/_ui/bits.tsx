/** Small server-safe pieces used on several head office screens. */
import { Download, Mail, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/core';
import { cn } from '@/lib/cn';
import { telLink, waLink } from '@/lib/wa';

/** Call, WhatsApp and email as icon buttons. Each shows only when there is something to open. */
export function ContactLinks({ phone, email, waText, size = 'sm', labels }: { phone?: string | null; email?: string | null; waText?: string; size?: 'sm' | 'md'; labels?: boolean }) {
  const tel = telLink(phone);
  const wa = waLink(phone, waText);
  const cls = buttonClass('secondary', size, labels ? '' : 'w-9 px-0');
  return (
    <span className="no-print inline-flex items-center gap-1.5">
      {tel ? (
        <a href={tel} className={cls} aria-label="Call" title="Call">
          <Phone size={16} /> {labels ? 'Call' : null}
        </a>
      ) : null}
      {wa ? (
        <a href={wa} target="_blank" rel="noreferrer" className={cn(cls, 'text-mint-700')} aria-label="WhatsApp" title="WhatsApp">
          <MessageCircle size={16} /> {labels ? 'WhatsApp' : null}
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} className={cls} aria-label="Email" title="Email">
          <Mail size={16} /> {labels ? 'Email' : null}
        </a>
      ) : null}
    </span>
  );
}

/** A plain download link styled as a button; the browser saves the CSV. */
export function ExportLink({ href, label = 'Export CSV' }: { href: string; label?: string }) {
  return (
    <a href={href} className={buttonClass('secondary', 'md', 'no-print')}>
      <Download size={18} /> {label}
    </a>
  );
}

/** Keeps only the filters that are set, for building an export or tab link. */
export function query(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : '';
}

/** Search params of a page, flattened to single strings. */
export type Search = Promise<Record<string, string | string[] | undefined>>;
export async function readSearch(searchParams: Search): Promise<Record<string, string>> {
  const raw = await searchParams;
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? (value[0] ?? '') : (value ?? '')]));
}

/** The row of filters above a list. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="no-print mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

/** A right-aligned number cell. */
export const NUM = 'tabular text-right whitespace-nowrap';
