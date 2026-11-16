'use client';

/**
 * The photo wall and its lightbox.
 *
 * Wall: album chips filter the photos, which reshuffle with a layout
 * animation. Lightbox: arrow keys and swipe move between photos, Escape or a
 * tap on the dark area closes it, and focus goes back to the photo that
 * opened it.
 */
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import type { SitePhoto } from '@/server/site/queries';
import { fill, type Dict } from './i18n';
import { useSite } from './i18n/client';
import { SiteImage } from './ui';

const altOf = (photo: SitePhoto, g: Dict['gallery']) => photo.caption || fill(g.fromAlbum, { album: photo.album });

function Lightbox({ photos, index, onClose, onMove }: { photos: SitePhoto[]; index: number; onClose: () => void; onMove: (step: number) => void }) {
  const reduce = useReducedMotion();
  const g = useSite().t.gallery;
  const closeRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(0);
  // A swipe ends with a click on the dark area; this stops that click from closing the lightbox.
  const swiped = useRef(false);
  const photo = photos[index];
  const many = photos.length > 1;

  const move = useCallback(
    (step: number) => {
      setDirection(step);
      onMove(step);
    },
    [onMove],
  );

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && many) move(1);
      else if (e.key === 'ArrowLeft' && many) move(-1);
      else if (e.key === 'Tab' && boxRef.current) {
        // Keep Tab inside the lightbox.
        const items = boxRef.current.querySelectorAll<HTMLElement>('button');
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [many, move, onClose]);

  const slide = reduce ? 0 : 80;
  const arrow =
    'absolute top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white hover:text-brand-900 active:scale-90';

  return createPortal(
    <motion.div
      ref={boxRef}
      role="dialog"
      aria-modal="true"
      aria-label={fill(g.count, { n: index + 1, total: photos.length })}
      className="fixed inset-0 z-[80] flex flex-col bg-brand-950/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
        <p className="tabular font-display text-lg font-bold" aria-live="polite">
          {index + 1} <span className="text-white/60">{fill(g.of, { total: photos.length })}</span>
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={g.close}
          className="grid h-12 w-12 place-items-center rounded-full bg-white/15 transition hover:bg-white hover:text-brand-900 active:scale-90"
        >
          <X aria-hidden size={24} strokeWidth={2.4} />
        </button>
      </div>

      <div
        className="relative flex-1"
        onClick={() => {
          if (!swiped.current) onClose();
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.figure
            key={photo.id}
            custom={direction}
            className="absolute inset-0 flex flex-col items-center justify-center px-3 pb-4 sm:px-20"
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * slide, scale: d === 0 && !reduce ? 0.94 : 1 }),
              centre: { opacity: 1, x: 0, scale: 1 },
              exit: (d: number) => ({ opacity: 0, x: d * -slide }),
            }}
            initial="enter"
            animate="centre"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            drag={many && !reduce ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragStart={() => {
              swiped.current = true;
            }}
            onDragEnd={(_, info) => {
              window.setTimeout(() => {
                swiped.current = false;
              }, 60);
              if (info.offset.x < -70 || info.velocity.x < -500) move(1);
              else if (info.offset.x > 70 || info.velocity.x > 500) move(-1);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={altOf(photo, g)}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[calc(100%-3.5rem)] max-w-full select-none rounded-2xl object-contain shadow-2xl"
            />
            {photo.caption ? (
              <figcaption className="mt-3 max-w-xl text-center font-display text-lg font-semibold text-white" onClick={(e) => e.stopPropagation()}>
                {photo.caption}
              </figcaption>
            ) : null}
          </motion.figure>
        </AnimatePresence>

        {many ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                move(-1);
              }}
              aria-label={g.previous}
              className={cn(arrow, 'left-2 sm:left-5')}
            >
              <ChevronLeft aria-hidden size={26} strokeWidth={2.6} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                move(1);
              }}
              aria-label={g.next}
              className={cn(arrow, 'right-2 sm:right-5')}
            >
              <ChevronRight aria-hidden size={26} strokeWidth={2.6} />
            </button>
          </>
        ) : null}
      </div>
    </motion.div>,
    document.body,
  );
}

/** Opens the lightbox for a list of photos and gives focus back afterwards. */
function useLightbox(photos: SitePhoto[]) {
  const [index, setIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = (i: number, opener: HTMLElement) => {
    openerRef.current = opener;
    setIndex(i);
  };
  const close = useCallback(() => {
    setIndex(null);
    openerRef.current?.focus();
  }, []);
  const moveBy = useCallback((step: number) => setIndex((i) => (i === null ? i : (i + step + photos.length) % photos.length)), [photos.length]);

  const lightbox = (
    <AnimatePresence>{index !== null && photos[index] ? <Lightbox photos={photos} index={index} onClose={close} onMove={moveBy} /> : null}</AnimatePresence>
  );
  return { open, lightbox };
}

function Tile({ photo, onOpen, sizes, className }: { photo: SitePhoto; onOpen: (el: HTMLElement) => void; sizes: string; className?: string }) {
  // Photos whose size we know keep their own shape; the rest fall back to a 4:3 box.
  const g = useSite().t.gallery;
  const ratio = photo.width > 0 && photo.height > 0 ? Math.min(Math.max(photo.width / photo.height, 0.62), 1.8) : 4 / 3;
  return (
    <button
      type="button"
      onClick={(e) => onOpen(e.currentTarget)}
      aria-label={fill(g.open, { caption: altOf(photo, g) })}
      className={cn('group relative block w-full overflow-hidden rounded-3xl bg-brand-50 shadow-card transition duration-300 hover:shadow-lift', className)}
      style={{ aspectRatio: ratio }}
    >
      <SiteImage src={photo.url} alt={altOf(photo, g)} sizes={sizes} className="transition-transform duration-700 ease-out group-hover:scale-110" />
      {photo.caption ? (
        <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-brand-950/80 to-transparent px-4 pb-3 pt-10 text-left font-display text-base font-semibold text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          {photo.caption}
        </span>
      ) : null}
    </button>
  );
}

/** The full gallery page: album chips, a masonry wall, the lightbox. */
export function GalleryWall({ photos, allLabel }: { photos: SitePhoto[]; allLabel: string }) {
  const reduce = useReducedMotion();
  const g = useSite().t.gallery;
  const albums = useMemo(() => [...new Set(photos.map((p) => p.album))], [photos]);
  const [album, setAlbum] = useState<string | null>(null);
  const shown = useMemo(() => (album ? photos.filter((p) => p.album === album) : photos), [album, photos]);
  const { open, lightbox } = useLightbox(shown);

  return (
    <>
      {albums.length > 1 ? (
        <div role="group" aria-label={g.albums} className="mb-8 flex flex-wrap justify-center gap-2.5">
          {[null, ...albums].map((name) => {
            const active = album === name;
            return (
              <button
                key={name ?? '__all'}
                type="button"
                aria-pressed={active}
                onClick={() => setAlbum(name)}
                className={cn(
                  'relative min-h-[44px] rounded-full px-5 font-display text-base font-bold transition',
                  active ? 'text-white' : 'bg-brand-50 text-brand-800 hover:bg-brand-100',
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="album-pill"
                    className="absolute inset-0 rounded-full bg-brand-700"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <span className="relative">{name ?? allLabel}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* CSS columns give a masonry wall without measuring anything in script. Changing album swaps the whole wall with one fade. */}
      <motion.ul
        key={album ?? '__all'}
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
        className="columns-2 gap-4 sm:gap-5 md:columns-3 xl:columns-4"
      >
        {shown.map((photo, i) => (
          <li key={photo.id} className="mb-4 break-inside-avoid sm:mb-5">
            <Tile photo={photo} onOpen={(el) => open(i, el)} sizes="(min-width: 1280px) 310px, (min-width: 768px) 32vw, 48vw" />
          </li>
        ))}
      </motion.ul>
      {lightbox}
    </>
  );
}

/** The strip on the home page: a few photos in a row that open in the same lightbox. */
export function GalleryStrip({ photos }: { photos: SitePhoto[] }) {
  const { open, lightbox } = useLightbox(photos);
  // A playful uneven row: every other photo sits a little lower and tilts the other way.
  const tilt = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1', 'rotate-1'];
  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6">
        {photos.map((photo, i) => (
          <li key={photo.id} className={cn('transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-105', tilt[i % tilt.length], i % 2 ? 'lg:mt-8' : '')}>
            <div className="rounded-[1.75rem] bg-white p-2 shadow-lift">
              <Tile
                photo={{ ...photo, width: 3, height: 4 }}
                onOpen={(el) => open(i, el)}
                sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
                className="rounded-[1.35rem] shadow-none"
              />
            </div>
          </li>
        ))}
      </ul>
      {lightbox}
    </>
  );
}
