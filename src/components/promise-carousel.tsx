"use client";

import { useEffect, useRef, useState } from "react";
import { PROMISE_TEXTS } from "@/lib/promise";

const INTERVAL = 7000;

export function PromiseCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Someone reading a paragraph in their second script should not have it
    // yanked away, so hovering, focusing or asking for reduced motion all stop
    // the rotation and leave the switcher working by hand.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || still) return;
    timer.current = setInterval(
      () => setIndex((i) => (i + 1) % PROMISE_TEXTS.length),
      INTERVAL,
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused]);

  const current = PROMISE_TEXTS[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* The box is sized to the longest translation so the buttons below it
          never jump as the language changes. */}
      <div className="relative min-h-[15rem] sm:min-h-[16rem] lg:min-h-[19rem]">
        {PROMISE_TEXTS.map((t, i) => (
          <blockquote
            key={t.code}
            lang={t.lang}
            aria-hidden={i !== index}
            className={`indic absolute inset-0 flex items-center justify-center text-xl font-semibold leading-snug tracking-tight transition-opacity duration-700 sm:text-2xl lg:text-[2.1rem] lg:leading-[1.35] ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <span>“{t.text}”</span>
          </blockquote>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {PROMISE_TEXTS.map((t, i) => (
          <button
            key={t.code}
            type="button"
            lang={t.lang}
            onClick={() => setIndex(i)}
            aria-label={`Read the promise in ${t.aria}`}
            aria-current={i === index}
            className={`indic rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              i === index
                ? "border-white bg-white text-brand-700"
                : "border-white/35 text-brand-100 hover:border-white/70 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
