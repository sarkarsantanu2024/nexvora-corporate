'use client';

/**
 * The home banner slider. Each slide has its own words on the left and a
 * photo or a video on the right, inside a drawn scene (sun, clouds, paper
 * plane, blocks) whose pieces float and lean towards the pointer.
 *
 * How it behaves:
 *  - Slides change by themselves. The bar inside the active dot shows how
 *    long is left. They wait while the pointer is over the banner, while
 *    something in it has keyboard focus, while the browser tab is hidden and
 *    while a YouTube video is playing. A pause button stops them for good.
 *  - Arrows, dots, the left and right keys and a sideways swipe all work.
 *  - A YouTube slide shows its poster and a play button; the player is only
 *    loaded on a tap, from youtube-nocookie.com, and is thrown away when the
 *    slide changes (which also stops the sound).
 *  - An mp4 slide plays muted and looped while it is the active slide. With
 *    reduced motion or data saver switched on it stays on its poster until
 *    the visitor presses play.
 *  - With reduced motion nothing moves by itself at all.
 *  - Every slide's words sit in the same grid cell and every slide's media in
 *    the same fixed-shape box, so the page never jumps between slides.
 */
import { Cake, ChevronLeft, ChevronRight, Pause, Play, Users } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';
import { Blob, Blocks, Cloud, Crayon, PaperPlane, Sparkle, Star, SunFace, Wave } from './art';
import { fill } from './i18n';
import { useSite } from './i18n/client';
import { Drift, Enter, Marked, PointerScene } from './motion-kit';
import { CONTAINER } from './theme';
import { Cta, SiteImage } from './ui';

export type Slide = {
  kind: 'image' | 'youtube' | 'mp4';
  /** The photo; for a video slide, its poster (may be empty). */
  image: string;
  /** An mp4 address, already checked on the server. */
  video?: string;
  /** A YouTube video id, already checked on the server. */
  youtube?: string;
  heading: string;
  text: string;
  buttonLabel: string;
  buttonLink: string;
  alt: string;
};

const INTERVAL_MS = 6500;
const MEDIA_SIZES = '(min-width: 1536px) 760px, (min-width: 1024px) 50vw, 94vw';

type SaveData = { connection?: { saveData?: boolean } };

function PlayBadge({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group/play absolute inset-0 z-10 grid place-items-center bg-brand-950/10 transition hover:bg-brand-950/25"
    >
      <span className="relative grid h-20 w-20 place-items-center rounded-full bg-white text-accent-500 shadow-lift transition duration-300 group-hover/play:scale-110 sm:h-24 sm:w-24">
        <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-white" />
        <Play aria-hidden size={36} fill="currentColor" strokeWidth={0} className="relative ml-1" />
      </span>
    </button>
  );
}

function SlideMedia({ slide, active, first, playing, onPlay, playLabel }: { slide: Slide; active: boolean; first: boolean; playing: boolean; onPlay: (on: boolean) => void; playLabel: string }) {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  // Decided in the browser only: the server cannot know about data saver.
  const [mayAutoplay, setMayAutoplay] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setMayAutoplay(!reduce && !(navigator as Navigator & SaveData).connection?.saveData);
  }, [reduce]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && (mayAutoplay || started)) {
      video.play().catch(() => {
        // The browser refused (for example low-power mode): the poster and play button stay.
        setStarted(false);
      });
    } else {
      video.pause();
    }
  }, [active, mayAutoplay, started]);

  const poster =
    slide.image ||
    // A YouTube slide without its own photo borrows YouTube's still.
    (slide.kind === 'youtube' ? `https://i.ytimg.com/vi/${slide.youtube}/hqdefault.jpg` : '');

  if (slide.kind === 'youtube') {
    return (
      <>
        {poster ? <SiteImage src={poster} alt={slide.alt} sizes={MEDIA_SIZES} priority={first} /> : null}
        {playing && active ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${slide.youtube}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
            title={slide.heading}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 z-20 h-full w-full border-0 bg-black"
          />
        ) : (
          <PlayBadge label={`${playLabel}: ${slide.heading}`} onClick={() => onPlay(true)} />
        )}
      </>
    );
  }

  if (slide.kind === 'mp4') {
    const showButton = !mayAutoplay && !started;
    return (
      <>
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload={first && mayAutoplay ? 'metadata' : 'none'}
          poster={slide.image || undefined}
          aria-label={slide.alt}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={slide.video} type="video/mp4" />
        </video>
        {showButton ? <PlayBadge label={`${playLabel}: ${slide.heading}`} onClick={() => setStarted(true)} /> : null}
      </>
    );
  }

  return slide.image ? (
    <SiteImage src={slide.image} alt={slide.alt} sizes={MEDIA_SIZES} priority={first} />
  ) : (
    <div aria-hidden className="grid h-full place-items-center bg-brand-100">
      <Blocks className="w-1/3" />
    </div>
  );
}

export function HeroSlider({
  slides,
  eyebrow,
  highlight,
  badge,
  secondaryLabel,
  ages,
  seats,
}: {
  slides: Slide[];
  eyebrow: string;
  highlight: string;
  badge: string;
  secondaryLabel: string;
  ages: string;
  seats: number;
}) {
  const { t } = useSite();
  const reduce = useReducedMotion();
  const many = slides.length > 1;
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false); // the visitor pressed pause
  const [held, setHeld] = useState(false); // pointer over, or focus inside
  const [hidden, setHidden] = useState(false); // tab in the background
  const [playing, setPlaying] = useState(false); // a YouTube player is open
  const swipeFrom = useRef<number | null>(null);

  const go = useCallback(
    (to: number) => {
      setPlaying(false);
      setIndex((to + slides.length) % slides.length);
    },
    [slides.length],
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const previous = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Slides advance only when there is more than one and the visitor has not asked for less motion.
  const auto = many && !reduce && !stopped;
  const running = auto && !held && !hidden && !playing;

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!many) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      previous();
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    swipeFrom.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (swipeFrom.current === null || !many) return;
    const moved = e.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (moved < -48) next();
    else if (moved > 48) previous();
  };

  const round = 'grid h-11 w-11 shrink-0 place-items-center rounded-full border border-brand-200 bg-white text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 active:scale-90';

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.slider.region}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHeld(false)}
      onFocusCapture={(e) => {
        // Only keyboard focus holds the slides; a mouse click on an arrow must not freeze them.
        if ((e.target as HTMLElement).matches(':focus-visible')) setHeld(true);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
      className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white"
    >
      {/* The dot's progress bar: a CSS animation, so that pausing it is one property and it costs no script while running. */}
      <style>{'@keyframes mk-hero-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}'}</style>

      <PointerScene>
        <div aria-hidden className="absolute -left-40 -top-40 h-[420px] w-[420px] text-brand-100/70">
          <Blob variant={2} />
        </div>
        <Drift className="absolute left-[2%] top-24 hidden w-28 text-white lg:block" depth={10} scroll={40} bob={8} duration={9} fromTop>
          <Cloud className="drop-shadow-[0_6px_10px_rgba(63,52,143,.12)]" />
        </Drift>
        <Drift className="absolute left-[40%] top-6 hidden w-40 text-brand-400 xl:block" depth={22} scroll={60} bob={12} duration={7} rotate={3} fromTop>
          <PaperPlane />
        </Drift>

        <div className={cn(CONTAINER, 'relative grid items-center gap-10 pb-20 pt-8 sm:pt-12 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pb-28 lg:pt-16 2xl:gap-20')}>
          {/* words: every slide's block shares one grid cell, so the tallest one sets the height once */}
          <div className="relative text-center lg:text-left">
            {eyebrow ? (
              <Enter y={14}>
                <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 font-display text-[15px] font-bold leading-normal text-brand-700 shadow-sm">
                  <Sparkle className="h-4 w-4 shrink-0 text-accent-500" />
                  <span className="truncate">{eyebrow}</span>
                </p>
              </Enter>
            ) : null}

            <Enter delay={0.1} className="mt-5 grid">
              {slides.map((slide, i) => {
                const active = i === index;
                const Heading = i === 0 ? 'h1' : 'h2';
                return (
                  <div
                    key={i}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={fill(t.slider.slideOf, { n: i + 1, total: slides.length })}
                    aria-hidden={!active}
                    // `inert` takes a hidden slide's button out of the tab order.
                    inert={!active}
                    className={cn(
                      'col-start-1 row-start-1 transition duration-500 ease-out',
                      active ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
                    )}
                  >
                    <Heading className="text-balance font-display text-[2.5rem] font-extrabold leading-[1.04] tracking-tight text-brand-950 sm:text-6xl xl:text-[4.25rem] 2xl:text-[4.75rem]">
                      {i === 0 ? <Marked text={slide.heading} mark={highlight} /> : slide.heading}
                    </Heading>
                    <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-ink-700 sm:text-xl lg:mx-0">{slide.text}</p>
                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                      <Cta href={slide.buttonLink} size="lg" arrow className="w-full sm:w-auto">
                        {slide.buttonLabel}
                      </Cta>
                      {secondaryLabel ? (
                        <Cta href="/programmes" variant="outline" size="lg" className="w-full sm:w-auto">
                          {secondaryLabel}
                        </Cta>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </Enter>

            <Enter delay={0.3}>
              <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 lg:justify-start">
                <li className="flex items-center gap-3 text-left">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun-100 text-sun-700">
                    <Cake aria-hidden size={24} strokeWidth={2.2} />
                  </span>
                  <span className="leading-tight">
                    <span className="tabular block font-display text-xl font-extrabold text-brand-950">{ages}</span>
                    <span className="text-sm font-medium text-ink-600">{t.common.yearsOfAge}</span>
                  </span>
                </li>
                <li className="flex items-center gap-3 text-left">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint-100 text-mint-700">
                    <Users aria-hidden size={24} strokeWidth={2.2} />
                  </span>
                  <span className="leading-tight">
                    <span className="tabular block font-display text-xl font-extrabold text-brand-950">{fill(t.common.seats, { n: seats })}</span>
                    <span className="text-sm font-medium text-ink-600">{t.common.inEachClass}</span>
                  </span>
                </li>
              </ul>
            </Enter>
          </div>

          {/* scene */}
          <Enter delay={0.2} y={40} scale={0.96} className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
            <Drift className="absolute -inset-x-[6%] -inset-y-[14%] text-sun-300" depth={-10} bob={0}>
              <Blob variant={0} />
            </Drift>
            <Drift className="absolute -left-[5%] -top-[13%] z-20 w-[17%]" depth={18} scroll={30} bob={6} duration={8} fromTop>
              <SunFace className="animate-[spin_50s_linear_infinite]" />
            </Drift>
            <Drift className="absolute -right-[5%] -top-[7%] z-20 w-[22%] text-white" depth={26} scroll={50} bob={10} duration={7} delay={0.5} fromTop>
              <Cloud className="drop-shadow-[0_8px_12px_rgba(63,52,143,.18)]" />
            </Drift>

            {/* one fixed shape per screen size: the slides swap inside it and nothing below moves */}
            <div
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (swipeFrom.current = null)}
              className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-[2rem] border-[6px] border-white bg-brand-100 shadow-lift sm:aspect-[16/10] sm:rounded-[2.75rem] sm:border-[10px]"
            >
              {slides.map((slide, i) => {
                const active = i === index;
                return (
                  <div
                    key={i}
                    aria-hidden={!active}
                    inert={!active}
                    className={cn('absolute inset-0 transition-[opacity,transform] duration-700 ease-out', active ? 'z-[1] scale-100 opacity-100' : 'scale-105 opacity-0')}
                  >
                    <SlideMedia slide={slide} active={active} first={i === 0} playing={playing} onPlay={setPlaying} playLabel={t.slider.playVideo} />
                  </div>
                );
              })}
            </div>

            {badge ? (
              <Drift className="absolute -bottom-[9%] right-[3%] z-20 hidden sm:block" depth={30} bob={8} duration={5} rotate={4}>
                <div className="relative grid h-28 w-28 place-items-center lg:h-32 lg:w-32">
                  <Star className="absolute inset-0 h-full w-full text-accent-500 drop-shadow-[0_10px_16px_rgba(227,30,36,.35)]" />
                  <span className="relative w-[56%] text-balance pt-1 text-center font-display text-[13px] font-extrabold leading-[1.1] text-white lg:text-[15px]">{badge}</span>
                </div>
              </Drift>
            ) : null}
            <Drift className="absolute -bottom-[11%] -left-[5%] z-20 hidden w-[19%] sm:block" depth={22} scroll={-20} bob={7} duration={6} delay={0.8} fromTop>
              <Blocks className="drop-shadow-[0_10px_14px_rgba(26,26,44,.18)]" />
            </Drift>
            <Drift className="absolute -right-[3.5%] bottom-[22%] z-20 hidden w-[4.5%] sm:block" depth={34} bob={9} duration={5.5} rotate={5}>
              <div className="-rotate-12">
                <Crayon color="#2ec4a0" wrap="#c8f4e8" />
              </div>
            </Drift>
            <Drift className="absolute right-[24%] -top-[9%] z-20 w-[5%] text-mint-400" depth={36} rotate={14} duration={6} delay={1.2}>
              <Star />
            </Drift>

            {many ? (
              <div className="relative z-20 mt-5 flex items-center justify-center gap-2 sm:mt-7 sm:justify-start sm:pl-[22%]">
                <button type="button" onClick={previous} aria-label={t.slider.previous} className={round}>
                  <ChevronLeft aria-hidden size={22} strokeWidth={2.6} />
                </button>
                <div className="flex items-center">
                  {slides.map((_, i) => {
                    const active = i === index;
                    return (
                      // The button is 44px tall for fingers; the dot inside is the small visible part.
                      <button
                        key={i}
                        type="button"
                        onClick={() => go(i)}
                        aria-label={fill(t.slider.goTo, { n: i + 1 })}
                        aria-current={active ? 'true' : undefined}
                        className={cn('group/dot grid h-11 place-items-center', slides.length <= 4 ? 'min-w-[44px]' : 'min-w-[30px]')}
                      >
                        <span className={cn('relative block h-2.5 overflow-hidden rounded-full transition-all duration-300', active ? 'w-12 bg-brand-200' : 'w-2.5 bg-brand-200 group-hover/dot:bg-brand-400')}>
                          {active ? (
                            auto ? (
                              <span
                                key={index}
                                onAnimationEnd={next}
                                className="absolute inset-0 origin-left rounded-full bg-accent-500"
                                style={{ animation: `mk-hero-progress ${INTERVAL_MS}ms linear forwards`, animationPlayState: running ? 'running' : 'paused' }}
                              />
                            ) : (
                              <span className="absolute inset-0 rounded-full bg-accent-500" />
                            )
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={next} aria-label={t.slider.next} className={round}>
                  <ChevronRight aria-hidden size={22} strokeWidth={2.6} />
                </button>
                {!reduce ? (
                  <button type="button" onClick={() => setStopped((v) => !v)} aria-label={stopped ? t.slider.play : t.slider.pause} aria-pressed={stopped} className={round}>
                    {stopped ? <Play aria-hidden size={18} fill="currentColor" strokeWidth={0} /> : <Pause aria-hidden size={18} fill="currentColor" strokeWidth={0} />}
                  </button>
                ) : null}
              </div>
            ) : null}
          </Enter>
        </div>
      </PointerScene>
      <Wave className="absolute inset-x-0 bottom-0 text-brand-700" variant={1} />
    </section>
  );
}
