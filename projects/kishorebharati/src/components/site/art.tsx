/**
 * Hand-drawn shapes for the public website: blobs, clouds, stars, a paper
 * plane, dots and wavy dividers. Plain SVG, no client
 * code, so they cost nothing to render. All of them are decoration and are
 * hidden from screen readers.
 */
import type { SVGProps } from 'react';

type ArtProps = SVGProps<SVGSVGElement>;
const base = { 'aria-hidden': true, focusable: false, xmlns: 'http://www.w3.org/2000/svg' } as const;

const BLOBS = [
  'M43.5,-62.1C56.9,-54.6,68.6,-43.2,74.9,-29.1C81.2,-15,82.1,1.8,77.4,16.8C72.7,31.8,62.4,45,49.6,55.9C36.8,66.8,21.5,75.4,4.6,76.9C-12.3,78.4,-30.8,72.8,-45.3,62.3C-59.8,51.8,-70.3,36.4,-75.6,19.1C-80.9,1.8,-81,-17.4,-73.3,-32.5C-65.6,-47.6,-50.1,-58.6,-34.5,-65.3C-18.9,-72,-3.2,-74.4,11.3,-72.6C25.8,-70.8,30.1,-69.6,43.5,-62.1Z',
  'M38.9,-65.4C51.5,-59.6,63.6,-51.1,71.3,-39.3C79,-27.5,82.3,-12.4,80.2,1.8C78.1,16,70.6,29.3,61.5,41.2C52.4,53.1,41.7,63.6,28.7,70.3C15.7,77,0.4,79.9,-14.2,77.2C-28.8,74.5,-42.7,66.2,-54.6,55.4C-66.5,44.6,-76.4,31.3,-79.6,16.4C-82.8,1.5,-79.3,-15,-71.9,-28.9C-64.5,-42.8,-53.2,-54.1,-40.2,-59.7C-27.2,-65.3,-12.5,-65.2,0.6,-66.2C13.7,-67.2,26.3,-71.2,38.9,-65.4Z',
  'M47.7,-73.2C60.9,-65.7,70.2,-51.4,76.2,-36.1C82.2,-20.8,84.9,-4.5,81.4,10.2C77.9,24.9,68.2,38,57.1,49.4C46,60.8,33.5,70.5,19.1,75.6C4.7,80.7,-11.6,81.2,-26.2,76.3C-40.8,71.4,-53.7,61.1,-63.4,48.4C-73.1,35.7,-79.6,20.6,-80.4,5.1C-81.2,-10.4,-76.3,-26.3,-67.3,-39.1C-58.3,-51.9,-45.2,-61.6,-31.4,-68.7C-17.6,-75.8,-3.1,-80.3,10.9,-79.6C24.9,-78.9,34.5,-80.7,47.7,-73.2Z',
];

/** A soft, uneven round shape. Colour it with `fill-…` or `text-…` classes. */
export function Blob({ variant = 0, ...props }: ArtProps & { variant?: 0 | 1 | 2 }) {
  return (
    <svg {...base} viewBox="-100 -100 200 200" fill="currentColor" {...props}>
      <path d={BLOBS[variant]} />
    </svg>
  );
}

export function Cloud(props: ArtProps) {
  return (
    <svg {...base} viewBox="0 0 120 64" fill="currentColor" {...props}>
      <path d="M26 60C12 60 2 51 2 39c0-11 8-19 19-21C25 8 35 2 47 2c12 0 22 6 27 16 3-2 7-3 11-3 13 0 23 9 23 21 6 2 10 7 10 13 0 6-5 11-12 11H26Z" />
    </svg>
  );
}

export function Star(props: ArtProps) {
  return (
    <svg {...base} viewBox="0 0 48 48" fill="currentColor" {...props}>
      <path d="M24 3.5c1.2 0 2.3.7 2.8 1.8l4.6 10 10.9 1.5c2.6.4 3.6 3.5 1.7 5.3l-8 7.6 2 10.9c.5 2.5-2.2 4.500-4.500 3.300L24 38.700l-9.500 5.200c-2.300 1.200-5-.800-4.500-3.300l2-10.900-8-7.600c-1.900-1.800-.900-4.900 1.700-5.300l10.900-1.500 4.600-10c.5-1.100 1.600-1.800 2.800-1.800Z" />
    </svg>
  );
}

/** A four-point twinkle. */
export function Sparkle(props: ArtProps) {
  return (
    <svg {...base} viewBox="0 0 40 40" fill="currentColor" {...props}>
      <path d="M20 1c1.200 9.800 4.800 15.800 19 19-14.200 3.200-17.800 9.200-19 19C18.800 29.200 15.200 23.200 1 20 15.200 16.800 18.800 10.800 20 1Z" />
    </svg>
  );
}

/** A folded paper plane with a looping dotted trail behind it. */
export function PaperPlane(props: ArtProps) {
  return (
    <svg {...base} viewBox="0 0 220 110" fill="none" {...props}>
      <path
        d="M4 92c26 10 52 4 62-14 9-16-6-30-18-21-13 10-2 34 26 34 30 0 52-22 78-44"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
        opacity=".55"
      />
      <path d="M214 8 150 36l22 12 42-40Z" fill="#fff" stroke="#3f348f" strokeWidth="3" strokeLinejoin="round" />
      <path d="M214 8 172 48l4 26 12-18" fill="#cfcbf1" stroke="#3f348f" strokeWidth="3" strokeLinejoin="round" />
      <path d="M214 8 188 56l22 10 4-58Z" fill="#fff" stroke="#3f348f" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

/** A loose spiral scribble. */
export function Scribble(props: ArtProps) {
  return (
    <svg {...base} viewBox="0 0 90 60" fill="none" {...props}>
      <path
        d="M4 40c8-22 22-34 30-26 8 9-14 34-4 38 10 4 18-36 30-34 10 2-8 30 2 32 6 1 12-8 14-14"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A patch of dots, for quiet corners. */
export function Dots({ rows = 5, cols = 5, ...props }: ArtProps & { rows?: number; cols?: number }) {
  const dots = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dots.push(<circle key={`${r}-${c}`} cx={6 + c * 16} cy={6 + r * 16} r="3" />);
  return (
    <svg {...base} viewBox={`0 0 ${cols * 16 - 4} ${rows * 16 - 4}`} fill="currentColor" {...props}>
      {dots}
    </svg>
  );
}

/**
 * A wavy edge between two sections. It takes the colour of the section it
 * leads INTO (set with a `text-…` class) and sits at the bottom of the
 * section above; `flip` turns it over for the top of a section.
 */
export function Wave({ flip, className, variant = 0 }: { flip?: boolean; className?: string; variant?: 0 | 1 }) {
  const d =
    variant === 0
      ? 'M0 40c120-34 240-34 360-8s240 34 360 8 240-42 360-24 240 44 360 24V80H0V40Z'
      : 'M0 30c90 24 180 34 300 14S520-6 660 8s220 44 360 40 280-52 420-26V80H0V30Z';
  return (
    <svg
      {...base}
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      fill="currentColor"
      className={`pointer-events-none block h-[36px] w-full sm:h-[56px] lg:h-[72px] ${flip ? 'rotate-180' : ''} ${className ?? ''}`}
    >
      <path d={d} />
    </svg>
  );
}

/** The crayon stroke drawn under key words. Stretches to the width of its box. */
export const SQUIGGLE_PATH = 'M3 9c18-5 30-6 47-3s28 5 45 1 30-6 47-2 30 5 55 0';
