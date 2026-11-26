/** Small server-safe pieces used on several dashboard screens. */
import { Mail, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/core';
import { cn } from '@/lib/cn';
import { getT } from '@/lib/t';
import { telLink, waLink } from '@/lib/wa';

/** Call, WhatsApp and email as icon buttons. Each shows only when there is something to open. */
export async function ContactLinks({ phone, email, waText, size = 'sm', labels }: { phone?: string | null; email?: string | null; waText?: string; size?: 'sm' | 'md'; labels?: boolean }) {
  const t = await getT();
  const tel = telLink(phone);
  const wa = waLink(phone, waText);
  const cls = buttonClass('secondary', size, labels ? '' : 'w-9 px-0');
  return (
    <span className="no-print inline-flex items-center gap-1.5">
      {tel ? (
        <a href={tel} className={cls} aria-label={t('Call')} title={t('Call')}>
          <Phone size={16} /> {labels ? t('Call') : null}
        </a>
      ) : null}
      {wa ? (
        <a href={wa} target="_blank" rel="noreferrer" className={cn(cls, 'text-mint-700')} aria-label={t('WhatsApp')} title={t('WhatsApp')}>
          <MessageCircle size={16} /> {labels ? t('WhatsApp') : null}
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} className={cls} aria-label={t('Email')} title={t('Email')}>
          <Mail size={16} /> {labels ? t('Email') : null}
        </a>
      ) : null}
    </span>
  );
}

/** Keeps only the filters that are set, for building a link. */
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
  return <div className="no-print mb-4 filter-bar flex flex-wrap items-center gap-2">{children}</div>;
}
