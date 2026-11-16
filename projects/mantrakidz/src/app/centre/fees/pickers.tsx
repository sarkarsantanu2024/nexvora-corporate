'use client';

import { Check, Copy, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useUrlParam } from '@/components/ui/client';
import { buttonClass } from '@/components/ui/core';
import { cn } from '@/lib/cn';

/**
 * A date or month picker bound to a query parameter that shows a default
 * (today, this month) when the URL has none. The shared UrlDate shows an
 * empty box in that case, which reads as "no date chosen".
 */
export function UrlPick({
  param,
  type = 'date',
  fallback,
  label,
  max,
  className,
}: {
  param: string;
  type?: 'date' | 'month';
  fallback: string;
  label: string;
  max?: string;
  className?: string;
}) {
  const { get, set } = useUrlParam();
  return (
    <input
      type={type}
      aria-label={label}
      value={get(param) || fallback}
      max={max}
      // Clearing the box goes back to the default rather than to an empty screen.
      onChange={(event) => set(param, event.target.value === fallback ? '' : event.target.value)}
      className={cn('control w-auto', className)}
    />
  );
}

/** Opens the sender's own WhatsApp with the text ready. Shows nothing useful without a valid number. */
export function WhatsAppLink({ href, label = 'WhatsApp', size = 'sm' }: { href: string; label?: string; size?: 'sm' | 'md' }) {
  if (!href) {
    return (
      <span className={buttonClass('secondary', size, 'no-print cursor-not-allowed opacity-50')} title="No mobile number on record">
        <MessageCircle size={16} /> {label}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', size, 'no-print')}>
      <MessageCircle size={16} className="text-mint-500" /> {label}
    </a>
  );
}

/** Copies a UPI ID or account number, so a parent can paste it into their payment app. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        } catch {
          // Clipboard is blocked on some old phones; the value is on screen to type out.
        }
      }}
      className="no-print inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-ink-200 bg-white px-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
    >
      {done ? <Check size={14} className="text-mint-500" /> : <Copy size={14} />}
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}
