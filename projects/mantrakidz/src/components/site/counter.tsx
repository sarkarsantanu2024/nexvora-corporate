/** One tile of the numbers strip. The number counts up when it scrolls into view. */
import type { ReactNode } from 'react';
import { CountUp } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { TONES, type Tone } from './theme';

export function NumberTile({
  tone,
  label,
  icon,
  value,
  text,
}: {
  tone: Tone;
  label: string;
  icon: ReactNode;
  /** A whole number to count up to… */
  value?: number;
  /** …or ready-made text such as "1.5 to 5.5", shown as it is. */
  text?: string;
}) {
  const t = TONES[tone];
  return (
    <div className={cn('group relative h-full overflow-hidden rounded-[1.75rem] p-5 text-center transition duration-300 hover:-translate-y-1 sm:p-7', t.soft)}>
      <span aria-hidden className={cn('absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-70 transition-transform duration-500 group-hover:scale-150', t.tint)} />
      <span className={cn('relative mx-auto grid h-12 w-12 place-items-center rounded-2xl text-white', t.solid)}>{icon}</span>
      <p className="tabular relative mt-4 font-display text-[2.1rem] font-extrabold leading-none text-brand-950 sm:text-5xl">
        {text ?? <CountUp value={value ?? 0} duration={1.4} />}
      </p>
      <p className={cn('relative mt-2 text-[15px] font-semibold leading-snug', t.text)}>{label}</p>
    </div>
  );
}
