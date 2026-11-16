'use client';

/**
 * Animation helpers shared by the website and the dashboards.
 * All of them stand still for people who ask their device for reduced motion.
 *
 *   <Reveal>…</Reveal>                         fades up when scrolled into view
 *   <Stagger><StaggerItem>…</StaggerItem></Stagger>   children arrive one after another
 *   <CountUp value={1250} prefix="₹" />        counts from 0 when first seen
 */
import { animate, motion, useInView, type HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const EASE = [0.2, 0.7, 0.2, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  ...props
}: HTMLMotionProps<'div'> & { children: ReactNode; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  gap = 0.08,
  ...props
}: HTMLMotionProps<'div'> & { children: ReactNode; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }: HTMLMotionProps<'div'> & { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  value,
  prefix = '',
  suffix = '',
  duration = 1.2,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  // Always 0 first: the server cannot know the motion setting, and a different first value breaks hydration.
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, { duration, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}
