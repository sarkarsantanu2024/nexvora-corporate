'use client';

/**
 * A fact's big line. When it is a plain number (1965), it counts up to it the
 * first time it is seen; any other words are shown as they are. The real
 * value is in the page from the start (for search engines and for anyone
 * without script); the count only plays once the line scrolls into view.
 * Calmer, not off, for reduced motion. No thousands separator: it is a year.
 */
import { animate, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

export function CountYear({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -60px 0px' });
  const reduce = useReducedMotion();
  const number = /^\d{1,6}$/.test(value.trim()) ? Number(value) : null;
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!seen || number === null) return;
    const from = Math.max(0, number - (number > 1000 ? 60 : number));
    const controls = animate(from, number, { duration: reduce ? 2.2 : 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(String(Math.round(v))) });
    return () => controls.stop();
  }, [seen, number, reduce]);

  return (
    <span ref={ref} className={className}>
      {number === null ? value : shown}
    </span>
  );
}
