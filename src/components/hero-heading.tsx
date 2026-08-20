"use client";

import { useEffect, useState } from "react";

/**
 * The home page h1, said three times over — English, Bengali, Hindi — with a
 * slow cross-fade between them.
 *
 * Two things it has to get right.
 *
 * SEO: all three are in the served HTML and English is the one that renders
 * first, so a crawler and a reader who lands before the first fade both get
 * the English heading. The rotation is a client-side opacity change on markup
 * that was already there — nothing is fetched or injected later.
 *
 * Stillness: the three versions are stacked in one grid cell rather than
 * swapped in and out, so the h1 is always as tall as the tallest of them and
 * the paragraph under it never moves. A heading that reflows every four
 * seconds would push the whole page around.
 */

type Version = {
  /** BCP-47 tag, so a screen reader switches voice on the right lines. */
  lang: string;
  before: string;
  accent: string;
  after: string;
};

const VERSIONS: Version[] = [
  {
    lang: "en",
    before: "Need a website for your business? ",
    accent: "You don't need",
    after: " a big company budget.",
  },
  {
    lang: "bn",
    before: "ব্যবসার জন্য ওয়েবসাইট দরকার? ",
    accent: "বড় বাজেট লাগবে না",
    after: "।",
  },
  {
    lang: "hi",
    before: "कारोबार के लिए वेबसाइट चाहिए? ",
    accent: "बड़ा बजट नहीं चाहिए",
    after: "।",
  },
];

// Long enough that a slow reader finishes the sentence, notices it is now in
// their own language, and still has a moment before it moves on.
const HOLD_MS = 9000;

export function HeroHeading() {
  const [active, setActive] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (still) return;
    const t = setInterval(
      () => setActive((n) => (n + 1) % VERSIONS.length),
      HOLD_MS,
    );
    return () => clearInterval(t);
  }, [still]);

  return (
    <h1 className="mt-6 grid text-[2.1rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl 2xl:text-[4.2rem]">
      {VERSIONS.map((v, i) => {
        const on = still ? i === 0 : i === active;
        return (
          <span
            key={v.lang}
            lang={v.lang}
            aria-hidden={on ? undefined : true}
            // Every version occupies the same cell, so the box is sized by
            // the tallest and nothing below it shifts.
            className={`indic col-start-1 row-start-1 transition-opacity duration-[2000ms] ease-in-out ${
              on ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {v.before}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
                {v.accent}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 320 14"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-brand-300"
              >
                <path
                  d="M2 9c60-6 120-8 180-6 46 1 92 4 136 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {v.after}
          </span>
        );
      })}
    </h1>
  );
}
