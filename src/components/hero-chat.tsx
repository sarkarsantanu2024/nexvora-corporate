"use client";

import { useEffect, useReducer, useState } from "react";

/**
 * The home hero: a phone, running the conversation this business actually
 * runs on.
 *
 * There is no office and no team, so a photograph of either would be the first
 * thing on the page that is not true — and not doing that is what the site is
 * selling. So the hero is the transaction itself, playing live: the enquiry
 * arrives, the typing dots appear, the answer goes back.
 *
 * No price is quoted here. A number in a hero is a promise made before anyone
 * has described their business, and the whole proposition is that the price
 * comes after the question, not before it. /price carries the real figures.
 *
 * Drawn in markup rather than exported as an image: sharp at any size, the
 * words in it are real text, and it costs no download.
 */

type Line = { from: "them" | "me"; text: string };
type Conversation = { label: string; lines: Line[] };

/**
 * The same enquiry, five times over, in the five ways a customer actually
 * writes: English, Bengali, Hindi, and the two Roman-letter forms most people
 * on a phone keyboard default to. Each answer comes back in the language the
 * question was asked in, because that is the claim being made — not "we
 * support languages" written in English, but the thing happening.
 *
 * They run one after another, forever. A reader who does not speak the one
 * currently on screen only has to wait for their own to come round.
 *
 * Written as a real WhatsApp exchange rather than a brochure: a greeting on
 * its own line, short bursts instead of paragraphs, and questions going both
 * ways.
 *
 * The shop owner leads. He says what he wants customers to be able to do, and
 * he is the one who asks how many pages that takes — the answer is a
 * recommendation ("4 or 5 is enough to start"), not a package handed down. He
 * also raises the two things every small shop actually worries about: will the
 * orders reach my phone, and can I change a rate myself without calling
 * anybody. A script where the seller announces the specification and the buyer
 * agrees is an advertisement with speech bubbles.
 *
 * The price question is answered the way it would really be answered — ask for
 * the photographs first, then one number for everything. Quoting instantly, or
 * reciting the terms back at him, both read as a machine.
 *
 * Numbers are digits. "4 or 5" is read at a glance; "four or five" is read as
 * prose, and this has to be scannable in the seconds it is on screen.
 */
const CONVERSATIONS: Conversation[] = [
  {
    label: "English",
    lines: [
      { from: "them", text: "Hello" },
      { from: "them", text: "I have a sweet shop. I want a website." },
      { from: "me", text: "Namaskar. Where is the shop?" },
      { from: "them", text: "Behala. 12 years old." },
      { from: "me", text: "What should a customer be able to do on it?" },
      {
        from: "them",
        text: "See our sweets with rates. And order for delivery.",
      },
      { from: "them", text: "How many pages will that need?" },
      {
        from: "me",
        text: "4 or 5 is enough to start. We can add more whenever you want.",
      },
      { from: "them", text: "Will the orders come to my phone?" },
      { from: "me", text: "Yes, to this same WhatsApp number." },
      { from: "them", text: "And if I want to change a rate myself?" },
      { from: "me", text: "You can. I will show you how on a call." },
      { from: "them", text: "How much?" },
      {
        from: "me",
        text: "Send me the shop photos first. Then I will give you one number for everything.",
      },
      { from: "them", text: "Okay, sending now." },
    ],
  },
  {
    label: "বাংলা",
    lines: [
      { from: "them", text: "নমস্কার" },
      { from: "them", text: "আমার মিষ্টির দোকান আছে। একটা ওয়েবসাইট চাই।" },
      { from: "me", text: "নমস্কার। দোকানটা কোথায়?" },
      { from: "them", text: "বেহালা। 12 বছরের দোকান।" },
      { from: "me", text: "কাস্টমার ওয়েবসাইটে কী কী করতে পারবে, সেটা বলুন?" },
      {
        from: "them",
        text: "মিষ্টির ছবি আর দাম দেখতে পারবে। আর ডেলিভারির অর্ডার দিতে পারবে।",
      },
      { from: "them", text: "তাতে কটা পাতা লাগবে?" },
      {
        from: "me",
        text: "শুরুতে 4-5টা যথেষ্ট। পরে যখন খুশি বাড়ানো যাবে।",
      },
      { from: "them", text: "অর্ডার কি আমার ফোনে আসবে?" },
      { from: "me", text: "হ্যাঁ, এই WhatsApp নম্বরেই।" },
      { from: "them", text: "দাম নিজে বদলাতে চাইলে পারব?" },
      { from: "me", text: "পারবেন। ফোনে দেখিয়ে দেব।" },
      { from: "them", text: "কত পড়বে?" },
      {
        from: "me",
        text: "আগে দোকানের ছবিগুলো পাঠান। তারপর সবকিছু মিলিয়ে একটাই দাম বলে দেব।",
      },
      { from: "them", text: "ঠিক আছে, পাঠাচ্ছি।" },
    ],
  },
  {
    label: "हिन्दी",
    lines: [
      { from: "them", text: "नमस्ते" },
      { from: "them", text: "मेरी मिठाई की दुकान है। एक वेबसाइट चाहिए।" },
      { from: "me", text: "नमस्ते। दुकान कहाँ है?" },
      { from: "them", text: "बेहाला। 12 साल पुरानी दुकान है।" },
      { from: "me", text: "ग्राहक वेबसाइट पर क्या-क्या कर सके, वो बताइए?" },
      {
        from: "them",
        text: "मिठाइयों की तस्वीरें और रेट देख सके। और डिलीवरी का ऑर्डर दे सके।",
      },
      { from: "them", text: "उसमें कितने पेज लगेंगे?" },
      {
        from: "me",
        text: "शुरू में 4-5 काफी हैं। बाद में जब चाहें बढ़ा सकते हैं।",
      },
      { from: "them", text: "ऑर्डर मेरे फोन पर आएंगे?" },
      { from: "me", text: "जी हाँ, इसी WhatsApp नंबर पर।" },
      { from: "them", text: "और रेट मुझे खुद बदलना हो तो?" },
      { from: "me", text: "बदल सकेंगे। फोन पर दिखा दूँगा।" },
      { from: "them", text: "कितना लगेगा?" },
      {
        from: "me",
        text: "पहले दुकान की तस्वीरें भेजिए। फिर सब मिलाकर एक ही दाम बता दूँगा।",
      },
      { from: "them", text: "ठीक है, भेज रहा हूँ।" },
    ],
  },
  {
    label: "Hinglish",
    lines: [
      { from: "them", text: "Namaste" },
      { from: "them", text: "Mithai ki dukaan hai. Website banwani hai." },
      { from: "me", text: "Namaste. Dukaan kahan hai?" },
      { from: "them", text: "Behala. 12 saal purani hai." },
      { from: "me", text: "Grahak website par kya kar sakein, ye bataiye?" },
      {
        from: "them",
        text: "Mithai ki photos aur rate dekh sakein. Aur delivery ka order de sakein.",
      },
      { from: "them", text: "Usme kitne page lagenge?" },
      {
        from: "me",
        text: "Shuru mein 4-5 kaafi hain. Baad mein jab chahein badha sakte hain.",
      },
      { from: "them", text: "Order mere phone par aayenge?" },
      { from: "me", text: "Ji haan, isi WhatsApp number par." },
      { from: "them", text: "Aur rate mujhe khud badalna ho to?" },
      { from: "me", text: "Badal sakenge. Phone par dikha dunga." },
      { from: "them", text: "Kitna lagega?" },
      {
        from: "me",
        text: "Pehle dukaan ki photos bhejiye. Phir sab milakar ek hi daam bata dunga.",
      },
      { from: "them", text: "Theek hai, bhej raha hoon." },
    ],
  },
  {
    label: "Banglish",
    lines: [
      { from: "them", text: "Namaskar" },
      { from: "them", text: "Amar mishtir dokan ache. Ekta website lagbe." },
      { from: "me", text: "Namaskar. Dokan ta kothay?" },
      { from: "them", text: "Behala. 12 bochorer dokan." },
      { from: "me", text: "Customer website e ki ki korte parbe, seta bolun?" },
      {
        from: "them",
        text: "Mishti r chhobi ar daam dekhte parbe. Ar delivery r order dite parbe.",
      },
      { from: "them", text: "Tate kota page lagbe?" },
      {
        from: "me",
        text: "Shurute 4-5ta jothesto. Pore jokhon khushi barano jabe.",
      },
      { from: "them", text: "Order ki amar phone e asbe?" },
      { from: "me", text: "Hyan, ei WhatsApp number-ei." },
      { from: "them", text: "Daam nije bodlate chaile parbo?" },
      { from: "me", text: "Parben. Phone e dekhiye debo." },
      { from: "them", text: "Koto porbe?" },
      {
        from: "me",
        text: "Age dokaner chhobi gulo pathan. Tarpor shob miliye ektai daam bole debo.",
      },
      { from: "them", text: "Thik ache, pathacchi." },
    ],
  },
];

// Paced to be read rather than watched, and paced unevenly on purpose: a real
// person takes a moment over a long sentence and fires "Ache" back instantly.
// A fixed delay on every message is the thing that makes a scripted chat look
// scripted.
// Slow enough that a message can be read in full before the next one starts
// arriving. The multiplier is what does the work: a long sentence gets its own
// long pause, so the reader is never chasing the conversation.
const typingFor = (text: string) =>
  Math.min(3400, Math.max(1100, text.length * 45));

const AFTER_MS = 2000;
const HOLD_MS = 6000;

export function HeroChat() {
  // Anyone who has asked their system for less motion gets the finished
  // conversation, at rest, rather than no conversation at all.
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // `shown` is how many lines of the current conversation have landed;
  // `typing` is whether the dots are up for the next one. One timer at a
  // time, cleared on every change, so a re-render can never leave a stray
  // timer running the sequence twice.
  const [conv, nextConv] = useReducer(
    (n: number) => (n + 1) % CONVERSATIONS.length,
    0,
  );
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  const script = CONVERSATIONS[conv];

  useEffect(() => {
    if (still) return;

    if (shown >= script.lines.length) {
      // Everything said: hold it long enough to be read, then start the same
      // conversation again in the next language.
      const t = setTimeout(() => {
        setShown(0);
        nextConv();
      }, HOLD_MS);
      return () => clearTimeout(t);
    }

    // A settled gap after one message lands before the next set of dots, so
    // the rhythm reads as two people rather than as a ticker.
    const previous = script.lines[shown - 1];
    const upcoming = script.lines[shown];

    let typed: ReturnType<typeof setTimeout>;
    const gap = setTimeout(
      () => {
        setTyping(true);
        typed = setTimeout(() => {
          setTyping(false);
          setShown((n) => n + 1);
        }, typingFor(upcoming.text));
      },
      // Straight into the next one when the same person is still talking;
      // a beat longer when the other side has to read first.
      shown === 0
        ? 400
        : previous?.from === upcoming.from
          ? AFTER_MS / 2
          : AFTER_MS,
    );

    return () => {
      clearTimeout(gap);
      clearTimeout(typed);
    };
  }, [shown, conv, still]);

  const visible = still ? script.lines.length : shown;
  const pending = script.lines[visible];

  // Built to the reference handset: an even dark bezel all the way round, an
  // uninterrupted screen with no notch or camera cutout, a moderate corner
  // radius, and the buttons grouped on the right. Kept narrow so the
  // silhouette holds a real phone's proportions — a wide one reads as a
  // tablet no matter how much detail is drawn on it.
  return (
    <div className="relative mx-auto w-full max-w-[24rem]">
      <div className="relative rounded-[2.1rem] bg-gradient-to-b from-slate-600 via-slate-800 to-slate-900 p-[2px] shadow-[0_40px_75px_-30px_rgba(10,17,40,0.7)]">
        <div className="rounded-[2rem] bg-[#15181d] p-[9px]">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[#ece5dd]">
            {/* Status bar and chat header, under one green field. */}
            <div className="relative bg-[#075E54] pt-2 text-white">
              <div
                aria-hidden="true"
                className="flex items-center justify-between px-4 pb-1.5 text-[0.68rem] font-semibold tracking-wide"
              >
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-rounded text-[14px]">
                    signal_cellular_alt
                  </span>
                  <span className="material-symbols-rounded text-[14px]">
                    wifi
                  </span>
                  <span className="material-symbols-rounded text-[14px]">
                    battery_full_alt
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 pb-3 pt-1">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[20px] text-white/70"
                >
                  arrow_back
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold">
                  N
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8rem] font-semibold">
                    Nexvora Technologies
                  </span>
                  <span className="block text-[0.62rem] text-white/70">
                    {typing ? "typing…" : "online"}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[18px] text-white/70"
                >
                  more_vert
                </span>
              </div>
            </div>

            {/* The conversation. Fixed height with the messages pinned to the
                bottom, so each one rises into a screen that never changes
                size — nothing on the page moves while it plays. */}
            <div
              aria-live="off"
              className="flex h-[32rem] flex-col justify-end gap-2.5 overflow-hidden px-3.5 py-4"
            >
              {script.lines.slice(0, visible).map((l, i) => (
                <Bubble key={`${conv}-${i}`} line={l} />
              ))}

              {typing && pending ? (
                <span
                  aria-hidden="true"
                  className={`inline-flex w-max items-center gap-1 rounded-2xl px-3 py-2.5 shadow-sm ${
                    pending.from === "me"
                      ? "ml-auto rounded-tr-sm bg-[#dcf8c6]"
                      : "rounded-tl-sm bg-white"
                  }`}
                >
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      style={{ animationDelay: `${d * 0.18}s` }}
                      className="chat-dot h-1.5 w-1.5 rounded-full bg-slate-400"
                    />
                  ))}
                </span>
              ) : null}
            </div>

            {/* Input row, for the shape of the thing rather than for use. */}
            <div className="flex items-center gap-2.5 border-t border-black/5 bg-[#f0f0f0] px-3.5 py-3">
              <span className="flex-1 truncate rounded-full bg-white px-3.5 py-2 text-[0.78rem] text-slate-400 shadow-sm">
                Tell me what your business needs…
              </span>
              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#25D366] text-white"
              >
                <span className="material-symbols-rounded text-[20px]">
                  send
                </span>
              </span>
            </div>

            {/* Android gesture bar */}
            <div className="bg-[#f0f0f0] pb-2 pt-1.5">
              <div
                aria-hidden="true"
                className="mx-auto h-1 w-28 rounded-full bg-slate-500/60"
              />
            </div>
          </div>
        </div>

        {/* Volume rocker and power, both on the right as in the reference,
            with the single small key on the left. */}
        <span
          aria-hidden="true"
          className="absolute -right-[3px] top-[7rem] h-[3.4rem] w-[3px] rounded-r-sm bg-slate-700"
        />
        <span
          aria-hidden="true"
          className="absolute -right-[3px] top-[11.4rem] h-[2.2rem] w-[3px] rounded-r-sm bg-slate-700"
        />
        <span
          aria-hidden="true"
          className="absolute -left-[3px] top-[8.5rem] h-[2rem] w-[3px] rounded-l-sm bg-slate-700"
        />
      </div>
    </div>
  );
}

function Bubble({ line }: { line: Line }) {
  const mine = line.from === "me";
  return (
    <p
      // .indic adds the Noto/Nirmala fallbacks, so the Bengali and Hindi
      // lines render from the system rather than from a downloaded webfont.
      className={`chat-in indic max-w-[88%] rounded-2xl px-3 py-2 text-[0.85rem] leading-relaxed text-slate-800 shadow-sm ${
        mine
          ? "ml-auto rounded-tr-sm bg-[#dcf8c6]"
          : "rounded-tl-sm bg-white"
      }`}
    >
      {line.text}
    </p>
  );
}
