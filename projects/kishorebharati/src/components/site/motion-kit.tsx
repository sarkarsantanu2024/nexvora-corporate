'use client';

/**
 * The website's own animation pieces, on top of the shared Reveal/Stagger.
 * Everything moves with transform and opacity only, and everything stands
 * still for a visitor who has asked their device for reduced motion.
 */
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SQUIGGLE_PATH } from './art';
import { useSite } from './i18n/client';

const EASE = [0.2, 0.7, 0.2, 1] as const;

/* ───────────── scroll progress ───────────── */

/** The thin bar across the very top that fills as the page is read. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-accent-500 via-sun-400 to-brand-600"
    />
  );
}

/* ───────────── pointer + scroll parallax ───────────── */

type Pointer = { x: MotionValue<number>; y: MotionValue<number> };
const PointerContext = createContext<Pointer | null>(null);

/**
 * Wrap a scene in this and every <Drift> inside leans gently towards the
 * pointer. x and y run from -1 to 1 across the scene.
 */
export function PointerScene({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 60, damping: 18 });
  const y = useSpring(rawY, { stiffness: 60, damping: 18 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    // Touch screens have no hovering pointer to follow.
    if (!el || reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      rawX.set(((e.clientX - box.left) / box.width) * 2 - 1);
      rawY.set(((e.clientY - box.top) / box.height) * 2 - 1);
    };
    const leave = () => {
      rawX.set(0);
      rawY.set(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [rawX, rawY, reduce]);

  return (
    <PointerContext.Provider value={{ x, y }}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </PointerContext.Provider>
  );
}

/**
 * A floating decoration. It bobs on its own, slides a little as the page
 * scrolls past (`scroll`, in pixels over the whole pass) and, inside a
 * PointerScene, leans towards the pointer (`depth`, in pixels).
 */
export function Drift({
  children,
  className,
  depth = 0,
  scroll = 0,
  bob = 10,
  duration = 6,
  delay = 0,
  rotate = 0,
  fromTop = false,
}: {
  children: ReactNode;
  className?: string;
  depth?: number;
  scroll?: number;
  bob?: number;
  duration?: number;
  delay?: number;
  rotate?: number;
  /**
   * For things at the top of a page: start exactly where they were drawn and
   * move only once the page scrolls. (Otherwise the slide is measured around
   * the middle of the screen, which suits everything further down.)
   */
  fromTop?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const pointer = useContext(PointerContext);
  const zero = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const { scrollY: pageY } = useScroll();
  const passing = useTransform(scrollYProgress, [0, 1], [scroll, -scroll]);
  const leaving = useTransform(pageY, [0, 800], [0, -scroll * 2]);
  const scrollY = fromTop ? leaving : passing;
  const px = useTransform(pointer?.x ?? zero, (v) => v * depth);
  const py = useTransform(pointer?.y ?? zero, (v) => v * depth);
  const y = useTransform<number, number>([scrollY, py], ([a, b]) => a + b);

  if (reduce) {
    return (
      <div aria-hidden className={cn('pointer-events-none', className)}>
        {children}
      </div>
    );
  }
  return (
    <motion.div ref={ref} aria-hidden style={{ x: px, y }} className={cn('pointer-events-none will-change-transform', className)}>
      <motion.div
        animate={{ y: [0, -bob, 0], rotate: rotate ? [-rotate, rotate, -rotate] : 0 }}
        transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** A photo or block that moves a little slower than the page as it scrolls. */
export function Parallax({ children, className, amount = 40 }: { children: ReactNode; className?: string; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ───────────── entrance ───────────── */

/** Hero pieces that arrive one after another as soon as the page opens. */
export function Enter({
  children,
  className,
  delay = 0,
  y = 26,
  scale = 1,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, scale }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────── tilt card ───────────── */

/** Lifts and tilts towards the pointer on hover. Children can use `group-hover`. */
export function Tilt({ children, className, max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 220, damping: 18 });
  const ry = useSpring(0, { stiffness: 220, damping: 18 });
  const lift = useSpring(0, { stiffness: 220, damping: 20 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const box = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - box.left) / box.width - 0.5;
    const dy = (e.clientY - box.top) / box.height - 0.5;
    ry.set(dx * max * 2);
    rx.set(-dy * max * 2);
    lift.set(-8);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
    lift.set(0);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX: rx, rotateY: ry, y: lift, transformPerspective: 900 }}
      className={cn('group will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
}

/* ───────────── marquee ───────────── */

/** An endless sideways strip. The content is repeated once, hidden from screen readers, so the loop has no seam. */
export function Marquee({ children, className, slow }: { children: ReactNode; className?: string; slow?: boolean }) {
  return (
    <div className={cn('group overflow-hidden', className)}>
      {/* The track holds two copies and slides by half its width, so the second copy lands exactly where the first began. */}
      <div
        className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]"
        style={{ animationDuration: slow ? '70s' : '40s' }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── headings ───────────── */

/**
 * The crayon underline, wiped in from left to right when it scrolls into view.
 *
 * Two details that matter:
 *  - It is placed from the middle of the line, not from the bottom of the
 *    box. Bengali and Hindi headings have much taller lines than English
 *    ones, and a line hung from the bottom would drift down into the next
 *    line of text. Those scripts also hang vowel signs below the letters, so
 *    the line sits a touch lower for them.
 *  - The reveal is a clip, not a dash animation: the drawing is stretched to
 *    the width of the words, and a dash pattern does not survive stretching.
 */
export function Squiggle({ className, delay = 0.35 }: { className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const { lang } = useSite();
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 200 14"
      preserveAspectRatio="none"
      fill="none"
      className={cn('absolute inset-x-0 h-[0.34em] w-full', className)}
      style={{ top: `calc(50% + ${lang === 'en' ? 0.36 : 0.5}em)` }}
      initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      <path d={SQUIGGLE_PATH} stroke="currentColor" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </motion.svg>
  );
}

/**
 * Heading text with one phrase underlined in crayon. When the phrase is not
 * found in the text (an editor changed one and not the other) the heading is
 * shown plain.
 */
export function Marked({ text, mark, lineClass = 'text-accent-500' }: { text: string; mark?: string; lineClass?: string }) {
  const at = mark ? text.toLowerCase().indexOf(mark.toLowerCase()) : -1;
  if (!mark || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="relative inline-block whitespace-nowrap">
        <span className="relative z-10">{text.slice(at, at + mark.length)}</span>
        <Squiggle className={lineClass} />
      </span>
      {text.slice(at + mark.length)}
    </>
  );
}
