'use client';

/**
 * "Which class is right for my child?" A parent enters a date of birth and
 * sees the class whose age range (set on each programme in the dashboard)
 * contains the child's age today.
 */
import { ArrowRight, Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { fill, type Dict } from './i18n';
import { SiteLink, useSite } from './i18n/client';
import { TONES, toneOf } from './theme';
import { ctaClass } from './ui';

type FinderProgramme = { slug: string; name: string; ageLabel: string; ageFromMonths: number; ageToMonths: number; color: string };

/** Whole months between a date of birth and today, both 'YYYY-MM-DD'. */
function monthsOld(dob: string, today: string): number {
  const [by, bm, bd] = dob.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0);
}

const ageWords = (months: number, f: Dict['finder']) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const years = y ? fill(y === 1 ? f.year : f.years, { n: y }) : '';
  const rest = m ? fill(m === 1 ? f.month : f.months, { n: m }) : '';
  if (years && rest) return fill(f.and, { a: years, b: rest });
  return years || rest || f.underMonth;
};

export function ClassFinder({
  programmes,
  today,
  copy,
}: {
  programmes: FinderProgramme[];
  /** Today's date in India. */
  today: string;
  copy: { heading: string; text: string; note: string; tooYoung: string; tooOld: string };
}) {
  const [dob, setDob] = useState('');
  const reduce = useReducedMotion();
  const id = useId();
  const f = useSite().t.finder;

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(dob) && dob <= today;
  const months = valid ? monthsOld(dob, today) : null;
  const youngest = Math.min(...programmes.map((p) => p.ageFromMonths));
  const match = months === null ? null : (programmes.find((p) => months >= p.ageFromMonths && months < p.ageToMonths) ?? null);
  const index = match ? programmes.indexOf(match) : 0;
  const t = match ? TONES[toneOf(match.color, index)] : null;

  return (
    <div className="relative overflow-hidden rounded-[2.25rem] bg-brand-700 p-6 text-white shadow-lift sm:rounded-[3rem] sm:p-10 lg:p-14">
      <div aria-hidden className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-600/70" />
      <div aria-hidden className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-brand-800/80" />
      <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="text-balance font-display text-[2rem] font-extrabold leading-tight sm:text-[2.6rem]">{copy.heading}</h2>
          <p className="mt-3 text-pretty text-lg leading-relaxed text-brand-100">{copy.text}</p>
          <label htmlFor={`${id}-dob`} className="mt-6 block text-sm font-bold uppercase tracking-wider text-brand-200">
            {f.dob}
          </label>
          <div className="relative mt-2 max-w-xs">
            <Search aria-hidden size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              id={`${id}-dob`}
              type="date"
              value={dob}
              max={today}
              onChange={(e) => setDob(e.target.value)}
              className="h-14 w-full rounded-2xl border-2 border-transparent bg-white pl-11 pr-4 font-display text-lg font-bold text-brand-950 shadow-sm focus:border-sun-400 focus:outline-none focus:ring-4 focus:ring-sun-300/50"
            />
          </div>
        </div>

        <div aria-live="polite" className="min-h-[210px]">
          <AnimatePresence mode="wait" initial={false}>
            {months === null ? (
              <motion.ul
                key="all"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-3"
              >
                {programmes.map((p, i) => (
                  <li key={p.slug} className="rounded-2xl bg-white/10 px-4 py-3.5">
                    <span className="block font-display text-xl font-bold" style={{ color: TONES[toneOf(p.color, i)].hex }}>
                      {p.name}
                    </span>
                    <span className="text-sm font-medium text-brand-100">{p.ageLabel}</span>
                  </li>
                ))}
              </motion.ul>
            ) : (
              <motion.div
                key={match?.slug ?? (months < youngest ? 'young' : 'old')}
                initial={reduce ? false : { opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="rounded-[1.75rem] bg-white p-6 text-ink-800 sm:p-7"
              >
                <p className="text-sm font-bold uppercase tracking-wider text-ink-500">{fill(f.childIs, { age: ageWords(Math.max(months, 0), f) })}</p>
                {match && t ? (
                  <>
                    <p className="mt-2 font-display text-4xl font-extrabold text-brand-950">{match.name}</p>
                    <p className={cn('mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold', t.chip)}>{match.ageLabel}</p>
                    <p className="mt-3 text-[15px] text-ink-600">{copy.note}</p>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <SiteLink href={`/programmes/${match.slug}`} className={ctaClass('indigo', 'sm')}>
                        {fill(f.about, { name: match.name })}
                        <ArrowRight aria-hidden size={17} strokeWidth={2.6} />
                      </SiteLink>
                      <SiteLink href={`/admissions?programme=${match.slug}#enquire`} className={ctaClass('outline', 'sm')}>
                        {f.enquire}
                      </SiteLink>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-lg font-medium leading-relaxed text-ink-800">{months < youngest ? copy.tooYoung : copy.tooOld}</p>
                    <SiteLink href="/admissions#enquire" className={ctaClass('indigo', 'sm', 'mt-5')}>
                      {f.leave}
                      <ArrowRight aria-hidden size={17} strokeWidth={2.6} />
                    </SiteLink>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
