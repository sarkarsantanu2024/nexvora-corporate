'use client';

/**
 * A template is rebuilt on every navigation (a layout is not), which makes it
 * the place for the page-enter transition: each new page fades up into place.
 */
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export default function SiteTemplate({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}
