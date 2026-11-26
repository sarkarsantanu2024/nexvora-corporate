'use client';

/**
 * The floating buttons at the bottom right of every page on a laptop:
 * WhatsApp, call, and (after some scrolling) back to top. Phones have the
 * app-style bar at the bottom instead (see header.tsx).
 */
import { ArrowUp, Phone } from 'lucide-react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useState } from 'react';
import { telLink, waLink } from '@/lib/wa';
import { fill } from './i18n';
import { useSite } from './i18n/client';
import { WhatsAppIcon } from './icons';

export function Dock({ phone, whatsapp, message }: { phone: string; whatsapp: string; message: string }) {
  const reduce = useReducedMotion();
  const { t } = useSite();
  const { scrollY } = useScroll();
  const [far, setFar] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setFar(y > 700));

  const wa = waLink(whatsapp, message);
  const tel = telLink(phone);
  const pop = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 12 };

  return (
    <div className="no-print pointer-events-none fixed bottom-6 right-6 z-30 hidden flex-col items-center gap-3 xl:flex">
      <AnimatePresence>
        {far ? (
          <motion.button
            key="top"
            type="button"
            initial={pop}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={pop}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
            aria-label={t.dock.top}
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-ink-200 bg-white text-brand-800 shadow-card transition hover:-translate-y-0.5 hover:bg-brand-50"
          >
            <ArrowUp aria-hidden size={20} strokeWidth={2.6} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      {tel ? (
        <motion.a
          href={tel}
          aria-label={fill(t.dock.call, { phone })}
          initial={pop}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.1, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={reduce ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white shadow-lift"
        >
          <Phone aria-hidden size={20} strokeWidth={2.4} />
        </motion.a>
      ) : null}

      {wa ? (
        <motion.a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.dock.whatsapp}
          initial={pop}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.25, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={reduce ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="pointer-events-auto relative grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,.7)]"
        >
          <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-[#25d366]" />
          <WhatsAppIcon size={28} className="relative" />
        </motion.a>
      ) : null}
    </div>
  );
}
