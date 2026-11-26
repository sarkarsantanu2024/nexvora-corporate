'use client';

/**
 * The welcome on a visitor's first page of a session: the Headmaster's face
 * drawn in thousands of dots, which then scatter to show the home page.
 *
 * Rules it keeps:
 *  - Once per browser session (sessionStorage). A small script in the markup
 *    hides it before the first paint for anyone who has already seen it, so
 *    there is no flash and nothing to wait for.
 *  - The page underneath is drawn normally the whole time; this is only an
 *    overlay. It never stays more than about three and a half seconds, and
 *    "Skip" or a tap ends it at once.
 *  - No WebGL: the seal and the name fade in and out, quickly.
 *  - Reduced motion: shorter and calmer, never cut.
 *  - Add ?intro=1 to the address to see it again (for checking and showing it).
 */
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { useSite } from './i18n/client';
import { INTRO_KEY, INTRO_Z, removeIntroCover, unlockIntroScroll } from './intro-cover';
import { hasWebGL } from './three/stage';
import type { Grid } from './three/portrait-scene';

const loadScene = () => import('./three/portrait-scene');
const PortraitScene = dynamic(loadScene, { ssr: false, loading: () => null });

const KEY = INTRO_KEY;
const ID = 'kb-intro';
/**
 * The longest the overlay may stay, whatever happens (slow phone, image or 3D
 * code not loading). Counted from the moment it appears; once the dots are on
 * screen the scene's own timeline (about 3 seconds) ends it instead.
 */
const HARD_STOP_MS = 11000;
/**
 * How long to wait for the 3D part to arrive before giving up and showing the
 * site. Long on a developer's computer, where the first load is compiled on
 * the spot; short on the live site.
 */
const WAIT_FOR_SCENE_MS = process.env.NODE_ENV === 'development' ? 30000 : 8000;
const FADE_MS = 450;

/** Reads the photo into a grid of brightness values, brighter towards the face and fading at the edges. */
function sample(src: string, cols: number): Promise<Grid> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const rows = Math.round((cols * img.naturalHeight) / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return reject(new Error('no 2d context'));
      ctx.drawImage(img, 0, 0, cols, rows);
      const data = ctx.getImageData(0, 0, cols, rows).data;
      const count = cols * rows;
      const raw = new Float32Array(count);
      const mask = new Float32Array(count);
      const inside: number[] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          raw[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
          // A tight oval round the head and shoulders, so the person stands alone
          // on the dark screen and the bright gate behind him falls away.
          const dx = (x / cols - 0.46) / 0.34;
          const dy = (y / rows - 0.5) / 0.56;
          const d = Math.sqrt(dx * dx + dy * dy);
          const m = 1 - Math.min(1, Math.max(0, (d - 0.72) / 0.28));
          mask[i] = m * m * (3 - 2 * m);
          if (mask[i] > 0.8) inside.push(raw[i]);
        }
      }
      // Stretch the contrast to what is inside the oval (darkest 4% to brightest 2%),
      // so a face in shade still reads clearly as dots.
      inside.sort((a, b) => a - b);
      const lo = inside[Math.floor(inside.length * 0.04)] ?? 0;
      const hi = inside[Math.floor(inside.length * 0.98)] ?? 1;
      const lum = new Float32Array(count);
      for (let i = 0; i < count; i++) lum[i] = Math.pow(Math.max(0, Math.min(1, (raw[i] - lo) / Math.max(0.05, hi - lo))), 0.85) * mask[i];
      resolve({ cols, rows, lum });
    };
    img.onerror = () => reject(new Error('photo did not load'));
    img.src = src;
  });
}

export function IntroLoader({ photo, name, motto }: { photo: string; name: string; motto: string }) {
  const { t } = useSite();
  const [stage, setStage] = useState<'idle' | 'show' | 'leaving' | 'gone'>('idle');
  const [grid, setGrid] = useState<Grid | null>(null);
  const [calm, setCalm] = useState(false);
  const timers = useRef<number[]>([]);
  // Decided once per page load. In development React runs effects twice, and
  // reading and setting the flag inside the effect hid the intro on the second run.
  const firstVisit = useRef<boolean | null>(null);

  const leave = useCallback(() => {
    setStage((s) => (s === 'show' || s === 'idle' ? 'leaving' : s));
    timers.current.push(
      window.setTimeout(() => {
        setStage('gone');
        unlockIntroScroll();
      }, FADE_MS),
    );
  }, []);

  // The dots are on screen: drop the wait limit and give the scene its full
  // timeline, with a little spare in case frames run slow.
  const startClock = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    timers.current.push(window.setTimeout(leave, HARD_STOP_MS));
  }, [leave]);

  // Before paint, so arriving at the home page from another page never flashes the overlay.
  useLayoutEffect(() => {
    if (firstVisit.current === null) {
      let seen = false;
      try {
        seen = sessionStorage.getItem(KEY) === '1' && !new URLSearchParams(window.location.search).has('intro');
        sessionStorage.setItem(KEY, '1');
      } catch {
        // Storage blocked (private mode): show it this once.
      }
      firstVisit.current = !seen;
    }
    if (!firstVisit.current) {
      setStage('gone');
      removeIntroCover();
      unlockIntroScroll();
      return;
    }
    setStage('show');
    // Our own overlay is drawn in this same frame, so the page's first cover can go.
    removeIntroCover();
    const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCalm(quiet);
    // Until the dots are on screen, only the wait limit applies; the full timeline starts with them (see onStart below).
    timers.current.push(window.setTimeout(leave, WAIT_FOR_SCENE_MS));
    if (hasWebGL()) {
      // Fetch the 3D code at the same moment as the photo, not after it.
      void loadScene();
      const cols = window.innerWidth < 768 ? 90 : (navigator.hardwareConcurrency || 4) <= 4 ? 120 : 160;
      sample(photo, cols)
        .then(setGrid)
        .catch(() => timers.current.push(window.setTimeout(leave, 900)));
    } else {
      // Without WebGL the still overlay (seal and name) shows briefly and fades.
      timers.current.push(window.setTimeout(leave, 1100));
    }
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, [photo, leave]);

  // Keep the page from scrolling under the overlay while it is up.
  useEffect(() => {
    if (stage !== 'show') return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [stage]);

  // Nothing on the server (the page's first cover, intro-cover.tsx, holds the
  // screen until now) and nothing once finished.
  if (stage === 'gone' || stage === 'idle') return null;
  // Long enough to see the face clearly (the owner asked for it to stay a little longer).
  const timeline = calm ? { assemble: 1.8, hold: 4.2, scatter: 1.0 } : { assemble: 2.0, hold: 4.5, scatter: 1.2 };
  const total = (timeline.assemble + timeline.hold + timeline.scatter) * 1000;

  // Straight into <body>: the site's page wrapper slides each page in with a
  // transform, and a transformed parent would trap this full-screen layer
  // inside itself, below the header.
  return createPortal(
    <div
      id={ID}
      // The breathing dot field (intro-cover.tsx) shows until the 3D dots take over.
      data-scene={grid ? 'on' : 'off'}
      role="dialog"
      aria-modal="false"
      aria-label={t.intro.loading}
      onClick={leave}
      className={cn(
        'kb-dotfield fixed inset-0 cursor-pointer overflow-hidden bg-[#0b0f24] text-white transition-[opacity,clip-path] ease-[cubic-bezier(.7,0,.3,1)]',
        stage === 'leaving' ? 'opacity-0 [clip-path:inset(0_0_100%_0)]' : 'opacity-100 [clip-path:inset(0_0_0_0)]',
      )}
      style={{ zIndex: INTRO_Z, transitionDuration: `${FADE_MS}ms` }}
    >
      {grid ? <PortraitScene grid={grid} calm={calm} timeline={timeline} onDone={leave} onStart={startClock} /> : null}
      <span className="sr-only">{t.intro.portrait}</span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center">
        <p lang="bn" className="text-lg font-bold text-white sm:text-xl">
          {name}
        </p>
        <p lang="sa" className="mt-1 text-sm text-sun-300">
          {motto}
        </p>
        <div className="mx-auto mt-4 h-px w-40 overflow-hidden bg-white/15">
          <span className="block h-full origin-left bg-sun-400" style={{ animation: `kb-intro-line ${grid ? total : HARD_STOP_MS}ms linear forwards` }} />
        </div>
        <style>{'@keyframes kb-intro-line{from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          leave();
        }}
        className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] min-h-[44px] rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0b0f24]"
      >
        {t.intro.skip}
      </button>
    </div>,
    document.body,
  );
}
