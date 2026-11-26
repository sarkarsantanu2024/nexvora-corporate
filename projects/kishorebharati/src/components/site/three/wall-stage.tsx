'use client';

/**
 * The campus tour section: a tall block whose inner frame stays put while
 * the page scrolls past it, so scrolling turns the photo wall. The frame
 * holds a still row of photos from the first paint; the 3D wall loads in the
 * browser and fades in over it. Without WebGL the row stays and scrolls
 * sideways by hand.
 */
import { Hand } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SiteImage } from '../ui';
import { useActive, useCalm, useCapability, useScrollThrough } from './stage';
import type { WallPhoto } from './wall-scene';

const WallScene = dynamic(() => import('./wall-scene'), { ssr: false, loading: () => null });

export function WallStage({ photos, children, hint }: { photos: WallPhoto[]; children: ReactNode; hint: string }) {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const can = useCapability();
  const active = useActive(frame);
  const calm = useCalm();
  const progress = useScrollThrough(section);
  const drag = useRef(0);
  const from = useRef<{ x: number; start: number } | null>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  // Until the browser has answered, assume WebGL (nearly every phone has it), so the section does not change height later.
  const three = photos.length > 2 && (can ? can.ok : true);

  return (
    <section ref={section} className={cn('relative', three ? 'h-[190vh] lg:h-[240vh]' : '')}>
      <div ref={frame} className={cn('overflow-hidden bg-brand-950', three ? 'sticky top-0 flex h-[100svh] flex-col' : 'relative')}>
        <div className="relative z-10 shrink-0">{children}</div>

        <div
          // The wall's own area, below the heading, so the words never sit over a photo.
          className={cn('relative', three ? 'min-h-0 flex-1 touch-pan-y' : 'pb-12')}
          onPointerDown={(e) => {
            if (!three) return;
            from.current = { x: e.clientX, start: drag.current };
          }}
          onPointerMove={(e) => {
            if (!from.current) return;
            drag.current = from.current.start + ((e.clientX - from.current.x) / window.innerWidth) * 2.2;
          }}
          onPointerUp={() => (from.current = null)}
          onPointerCancel={() => (from.current = null)}
          onPointerLeave={() => (from.current = null)}
        >
          {/* the still row: first paint, and the whole tour where WebGL is missing */}
          <div
            className={cn(
              'flex gap-4 overflow-x-auto px-4 transition-opacity duration-[1400ms] sm:px-8',
              three ? 'absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden' : 'snap-x snap-mandatory pt-4',
              three && ready ? 'opacity-0' : 'opacity-100',
            )}
          >
            {photos.slice(0, 8).map((photo) => (
              <figure key={photo.url} className="relative h-56 shrink-0 snap-center overflow-hidden rounded-sm sm:h-72" style={{ aspectRatio: `${Math.min(1.9, Math.max(0.6, photo.width / Math.max(1, photo.height)))}` }}>
                <SiteImage src={photo.url} alt={photo.caption} sizes="400px" />
              </figure>
            ))}
          </div>
          {three && can?.ok ? (
            <div className={cn('absolute inset-0 transition-opacity duration-[1400ms]', ready ? 'opacity-100' : 'opacity-0')}>
              <WallScene photos={photos} active={active} calm={calm} light={can?.light ?? true} progress={progress} drag={drag} onReady={onReady} />
            </div>
          ) : null}
        </div>

        {three ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2 text-sm font-semibold text-brand-100/80">
            <Hand aria-hidden size={16} />
            {hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
