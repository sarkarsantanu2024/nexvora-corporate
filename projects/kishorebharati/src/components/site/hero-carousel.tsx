'use client';

/**
 * The home page banner: edge to edge, the school's name centred over a
 * carousel of photos and 16:9 videos, under a navy wash that keeps the words
 * readable on any picture.
 *
 * How it moves:
 *  - A photo stays about six seconds, drifting in slowly (Ken Burns), then
 *    cross-fades to the next.
 *  - A video (YouTube or mp4) plays muted, filling the banner like a photo.
 *    While it plays the carousel never moves on by itself: it waits for the
 *    video to end, or for the visitor to press next or swipe. A sound button
 *    turns the sound on.
 *  - The mouse resting on the banner, keyboard focus inside it, a hidden tab
 *    and the pause button all hold the photos.
 *  - Reduced motion: still turning, slower, with a plain cross-fade and no
 *    drift. Data saver: videos wait for a tap.
 */
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { advanceOn } from './carousel-rule';
import type { Slide } from './hero-slider';
import { fill } from './i18n';
import { SiteLink, useSite } from './i18n/client';
import { CONTAINER } from './theme';
import { SiteImage } from './ui';

export type HeroWords = {
  eyebrow: string;
  heading: string;
  motto: string;
  mottoMeaning: string;
  text: string;
  primaryLabel: string;
  secondaryLabel: string;
};

const PHOTO_MS = 6000;
const EASE = [0.2, 0.7, 0.2, 1] as const;


type SaveData = { connection?: { saveData?: boolean } };

/** A YouTube video as a muted background that covers the banner. Talks to the player through postMessage, no extra script. */
function YouTubeCover({ id, active, muted, onEnded, onPlaying, title }: { id: string; active: boolean; muted: boolean; onEnded: () => void; onPlaying: (on: boolean) => void; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const send = useCallback((func: string) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  }, []);

  useEffect(() => {
    if (!active) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const data = JSON.parse(e.data) as { event?: string; info?: { playerState?: number } };
        const state = data.info?.playerState;
        // 0 ended, 1 playing, 2 paused.
        if (state === 0) onEnded();
        else if (state === 1) onPlaying(true);
        else if (state === 2) onPlaying(false);
      } catch {
        // Not a player message.
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [active, onEnded, onPlaying]);

  useEffect(() => {
    send(muted ? 'mute' : 'unMute');
  }, [muted, send]);

  if (!active) return null;
  return (
    // Sized to cover: a 16:9 frame at least as wide and as tall as the banner (container query units).
    <iframe
      ref={frame}
      title={title}
      src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&iv_load_policy=3`}
      allow="autoplay; encrypted-media; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*')}
      className="pointer-events-none absolute left-1/2 top-1/2 aspect-video -translate-x-1/2 -translate-y-1/2 border-0"
      style={{ width: 'max(100cqw, calc(100cqh * 16 / 9))', height: 'max(100cqh, calc(100cqw * 9 / 16))' }}
    />
  );
}

function Mp4Cover({ src, poster, active, muted, mayPlay, onEnded, onPlaying, label }: { src: string; poster: string; active: boolean; muted: boolean; mayPlay: boolean; onEnded: () => void; onPlaying: (on: boolean) => void; label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active && mayPlay) {
      v.currentTime = 0;
      v.play().catch(() => onPlaying(false));
    } else v.pause();
  }, [active, mayPlay, onPlaying]);
  return (
    <video
      ref={video}
      muted={muted}
      playsInline
      preload={active ? 'auto' : 'none'}
      poster={poster || undefined}
      aria-label={label}
      onPlaying={() => onPlaying(true)}
      onPause={() => onPlaying(false)}
      onEnded={onEnded}
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

export function HeroCarousel({ words, slides }: { words: HeroWords; slides: Slide[] }) {
  const { t } = useSite();
  const reduce = useReducedMotion();
  const many = slides.length > 1;
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [held, setHeld] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [mayPlay, setMayPlay] = useState(false);
  const swipeFrom = useRef<number | null>(null);
  const slide = slides[index];

  useEffect(() => {
    setMayPlay(!(navigator as Navigator & SaveData).connection?.saveData);
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const go = useCallback(
    (to: number) => {
      setVideoPlaying(false);
      setIndex((to + slides.length) % slides.length);
    },
    [slides.length],
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const previous = useCallback(() => go(index - 1), [go, index]);
  const onVideoEnded = useCallback(() => {
    if (advanceOn(slide.kind, 'ended')) next();
  }, [next, slide.kind]);

  // Photos only: a video slide has no timer at all.
  const photoTimer = many && slide.kind === 'image' && !stopped;
  const running = photoTimer && !held && !hidden;
  const photoMs = reduce ? PHOTO_MS * 1.5 : PHOTO_MS;

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    swipeFrom.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (swipeFrom.current === null || !many) return;
    const moved = e.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (moved < -50) next();
    else if (moved > 50) previous();
  };

  const round = 'grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/30 bg-brand-950/30 text-white backdrop-blur-sm transition hover:bg-white hover:text-brand-950 active:scale-90';
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.slider.region}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') previous();
      }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHeld(false)}
      onFocusCapture={(e) => (e.target as HTMLElement).matches(':focus-visible') && setHeld(true)}
      onBlurCapture={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHeld(false)}
      className="relative isolate flex min-h-[80svh] items-center overflow-hidden bg-brand-950 text-white lg:min-h-[min(88svh,880px)]"
    >
      <style>{'@keyframes kb-burns{from{transform:scale(1.04)}to{transform:scale(1.14)}}@keyframes kb-timer{from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>

      {/* the media: every slide stacked, the active one faded in */}
      <div className="absolute inset-0 -z-10 touch-pan-y [container-type:size]" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (swipeFrom.current = null)}>
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={fill(t.slider.slideOf, { n: i + 1, total: slides.length })}
              aria-hidden={!active}
              className={cn('absolute inset-0 transition-opacity duration-[1400ms] ease-out', active ? 'opacity-100' : 'opacity-0')}
            >
              {s.kind === 'image' ? (
                <div className="absolute inset-0" style={active && !reduce ? { animation: `kb-burns ${photoMs + 1600}ms ease-out forwards` } : undefined}>
                  <SiteImage src={s.image} alt={s.alt} sizes="100vw" priority={i === 0} />
                </div>
              ) : (
                <>
                  {s.image ? <SiteImage src={s.image} alt={s.alt} sizes="100vw" priority={i === 0} /> : null}
                  {s.kind === 'youtube' && s.youtube && mayPlay ? (
                    <YouTubeCover id={s.youtube} active={active} muted={muted} onEnded={onVideoEnded} onPlaying={setVideoPlaying} title={s.heading} />
                  ) : null}
                  {s.kind === 'mp4' && s.video ? (
                    <Mp4Cover src={s.video} poster={s.image} active={active} muted={muted} mayPlay={mayPlay} onEnded={onVideoEnded} onPlaying={setVideoPlaying} label={s.alt} />
                  ) : null}
                </>
              )}
            </div>
          );
        })}
        {/* navy wash: darker at the top (under the header) and the foot (under the controls), clear enough to see the photo */}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,36,.72)_0%,rgba(11,15,36,.42)_38%,rgba(11,15,36,.5)_62%,rgba(11,15,36,.9)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,15,36,.35),transparent_65%)]" />
      </div>

      {/* the words, centred */}
      <div className={cn(CONTAINER, 'relative pb-36 pt-16 text-center sm:py-28')}>
        {words.eyebrow ? (
          <motion.p {...fade(0.05)} className="inline-flex items-center gap-3 text-sm font-semibold text-sun-300 sm:text-base">
            <span aria-hidden className="h-px w-8 bg-sun-300/70" />
            {words.eyebrow}
            <span aria-hidden className="h-px w-8 bg-sun-300/70" />
          </motion.p>
        ) : null}
        <motion.h1 {...fade(0.15)} className="mx-auto mt-5 max-w-5xl text-balance text-[2.5rem] font-bold leading-[1.12] text-white [text-shadow:0_2px_24px_rgba(0,0,0,.35)] min-[400px]:text-[2.8rem] sm:text-6xl lg:text-7xl 2xl:text-[5.4rem]">
          {words.heading}
        </motion.h1>
        {words.motto ? (
          <motion.p {...fade(0.35)} className="mt-5">
            <span lang="sa" className="block text-2xl font-semibold text-sun-300 sm:text-3xl">
              {words.motto}
            </span>
            {words.mottoMeaning ? <span className="mt-1 block text-base italic text-brand-100">{words.mottoMeaning}</span> : null}
          </motion.p>
        ) : null}
        {words.text ? (
          <motion.p {...fade(0.5)} className="mx-auto mt-5 hidden max-w-2xl text-pretty text-lg leading-relaxed text-brand-50 sm:block">
            {words.text}
          </motion.p>
        ) : null}
        <motion.div {...fade(0.65)} className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <SiteLink href="/admission" className="group inline-flex h-14 items-center justify-center gap-2 rounded-md bg-accent-600 px-8 text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgba(223,42,34,.8)] transition hover:-translate-y-0.5 hover:bg-accent-700">
            {words.primaryLabel}
            <ArrowRight aria-hidden size={19} className="transition-transform duration-300 group-hover:translate-x-1" />
          </SiteLink>
          {words.secondaryLabel ? (
            <SiteLink href="/contact" className="inline-flex h-14 items-center justify-center rounded-md border border-white/40 bg-white/5 px-8 text-lg font-bold text-white backdrop-blur-sm transition hover:border-sun-300 hover:text-sun-300">
              {words.secondaryLabel}
            </SiteLink>
          ) : null}
        </motion.div>
      </div>

      {/* caption and controls along the foot */}
      <div className="absolute inset-x-0 bottom-0">
        <div className={cn(CONTAINER, 'flex flex-wrap items-center justify-between gap-3 pb-5 sm:pb-7')}>
          <p aria-live="polite" className="min-w-0 max-w-full text-sm font-semibold text-brand-100 sm:text-[15px]">
            <span className="tabular mr-2 text-sun-300">
              {String(index + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
            </span>
            {slide?.heading}
          </p>
          <div className="flex items-center gap-2">
            {slide && slide.kind !== 'image' && !mayPlay ? (
              <button type="button" onClick={() => setMayPlay(true)} aria-label={t.slider.playVideo} className={round}>
                <Play aria-hidden size={16} fill="currentColor" strokeWidth={0} />
              </button>
            ) : null}
            {slide && slide.kind !== 'image' && mayPlay ? (
              <button type="button" onClick={() => setMuted((m) => !m)} aria-pressed={!muted} aria-label={muted ? t.slider.soundOn : t.slider.soundOff} className={round}>
                {muted ? <VolumeX aria-hidden size={18} /> : <Volume2 aria-hidden size={18} />}
              </button>
            ) : null}
            {many ? (
              <>
                <div className="flex items-center">
                  {slides.map((s, i) => {
                    const active = i === index;
                    return (
                      <button key={i} type="button" onClick={() => go(i)} aria-label={fill(t.slider.goTo, { n: i + 1 })} aria-current={active ? 'true' : undefined} className="grid h-11 min-w-[30px] place-items-center">
                        <span className={cn('relative block h-1.5 overflow-hidden rounded-full transition-all duration-500', active ? 'w-10 bg-white/30' : 'w-1.5 bg-white/50')}>
                          {active ? (
                            s.kind === 'image' && photoTimer ? (
                              <span
                                key={index}
                                onAnimationEnd={() => advanceOn('image', 'timer') && next()}
                                className="absolute inset-0 origin-left bg-sun-400"
                                style={{ animation: `kb-timer ${photoMs}ms linear forwards`, animationPlayState: running ? 'running' : 'paused' }}
                              />
                            ) : (
                              <span className={cn('absolute inset-0 bg-sun-400', s.kind !== 'image' && videoPlaying && 'animate-pulse')} />
                            )
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={previous} aria-label={t.slider.previous} className={round}>
                  <ChevronLeft aria-hidden size={20} />
                </button>
                <button type="button" onClick={next} aria-label={t.slider.next} className={round}>
                  <ChevronRight aria-hidden size={20} />
                </button>
                <button type="button" onClick={() => setStopped((v) => !v)} aria-label={stopped ? t.slider.play : t.slider.pause} aria-pressed={stopped} className={round}>
                  {stopped ? <Play aria-hidden size={16} fill="currentColor" strokeWidth={0} /> : <Pause aria-hidden size={16} fill="currentColor" strokeWidth={0} />}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
