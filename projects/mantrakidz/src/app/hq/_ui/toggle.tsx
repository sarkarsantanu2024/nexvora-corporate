'use client';

import { cn } from '@/lib/cn';

/** An on/off switch with its label and a line saying what it does. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex items-start gap-3 rounded-xl border border-ink-200 p-3.5', disabled ? 'opacity-60' : 'cursor-pointer hover:border-ink-300')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-700' : 'bg-ink-300')}
      >
        <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </button>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-800">{label}</span>
        {hint ? <span className="mt-0.5 block text-sm text-ink-500">{hint}</span> : null}
      </span>
    </label>
  );
}
