'use client';

/** Questions and answers that open and close smoothly. Each question is a real button, so it works from the keyboard. */
import { Plus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';

export function Faq({ items }: { items: { question?: string; answer?: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  const id = useId();
  const list = items.filter((item) => item.question && item.answer);

  return (
    <div className="space-y-3">
      {list.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={`${item.question}-${i}`}
            className={cn(
              'overflow-hidden rounded-3xl border-2 bg-white transition-colors duration-300',
              isOpen ? 'border-brand-300 shadow-card' : 'border-ink-100 hover:border-brand-200',
            )}
          >
            <h3>
              <button
                type="button"
                id={`${id}-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-lg font-bold text-brand-950 sm:px-7 sm:text-xl"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-full transition duration-300',
                    isOpen ? 'rotate-[135deg] bg-accent-500 text-white' : 'bg-brand-100 text-brand-700',
                  )}
                >
                  <Plus size={20} strokeWidth={2.8} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={`${id}-a-${i}`}
                  role="region"
                  aria-labelledby={`${id}-q-${i}`}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <p className="whitespace-pre-line px-5 pb-6 text-[17px] leading-relaxed text-ink-700 sm:px-7">{item.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
