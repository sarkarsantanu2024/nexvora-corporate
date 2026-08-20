import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PromiseCarousel } from "@/components/promise-carousel";
import { Reveal } from "@/components/reveal";
import { SocialLinks } from "@/components/social-links";
import { FAQS } from "@/lib/faq";
import { HELP_GROUPS } from "@/lib/help";
import {
  NOT_INCLUDED,
  PACKAGES,
  PRICE_GROUPS,
  rupees,
} from "@/lib/pricing";
import { PRODUCTS } from "@/lib/products";
import { SERVICES } from "@/lib/services";
import { HeroChat } from "@/components/hero-chat";
import { HeroHeading } from "@/components/hero-heading";
import { CAPABILITIES, CONTACT } from "@/lib/site";
import { WORK } from "@/lib/work";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

// What people say happened to them last time, which is usually why the
// website never happened again. Set as speech bubbles rather than bullets,
// because that is how they were said.
//
// These are complaints about how the work was done, not about the work
// itself. An earlier version of this list used "you will need hosting" and
// "you will need a domain" as scare lines, which was dishonest twice over:
// both are genuinely needed, and both are things I charge for. Every line
// here is answered by something stated elsewhere on this site — one price
// told first, everything in your own name, a reply the same working day.
const EXCUSES = [
  "Website will cost ₹30,000.",
  "The price went up after the work started.",
  "Nobody told me what I was actually paying for.",
  "They stopped replying once the payment was made.",
  "The domain is in their company's name, not mine.",
  "I still cannot change my own phone number on it.",
  "It has been 4 months and it is still not live.",
];

// Who this is actually for, said as the person rather than the industry.
const WHO = [
  {
    icon: "storefront",
    title: "Local shop",
    body: "You have a real business and a real footfall, but nothing online that a new customer can find.",
  },
  {
    icon: "school",
    title: "Teacher or tutor",
    body: "You want students and parents to find your courses, see your fees and message you.",
  },
  {
    icon: "photo_camera",
    title: "Photographer",
    body: "You want people to see your work before they call you, not after.",
  },
  {
    icon: "medical_services",
    title: "Clinic or professional",
    body: "Your services, timings, location and contact number, in one place people trust.",
  },
  {
    icon: "badge",
    title: "Freelancer",
    body: "A portfolio at your own name that you can send to a client in one link.",
  },
  {
    icon: "shopping_bag",
    title: "Small seller",
    body: "You want to show your products online, and take orders and payment for them.",
  },
  {
    icon: "rocket_launch",
    title: "Just starting out",
    body: "No big budget yet, but you want to look like a proper business from day one.",
  },
  {
    icon: "table_view",
    title: "Running on Excel",
    body: "The spreadsheet, the notebook and the WhatsApp group have stopped coping. You need software.",
  },
];

// What you are promised before anything is sold. This is the founder's own
// position, not a service-level agreement written by somebody else.
const PROMISES = [
  {
    icon: "receipt_long",
    title: "I tell you the price first",
    body: "One number for the work we agreed, settled before it starts. No hourly meter running in the background, and the price does not move because the job turned out harder than I thought. If you ask for something extra later, I tell you what it costs before I build it.",
  },
  {
    icon: "handshake",
    title: "I don't go quiet once work starts",
    body: "You keep messaging the same WhatsApp number you started on. While the work is going on, and long after the site is live, you get a reply from me — not from an office.",
  },
  {
    icon: "notifications_active",
    title: "I keep you updated",
    body: "A message when I start, a message when something is ready for you to look at, and a message when it goes live. You never have to ring and ask.",
  },
  {
    icon: "record_voice_over",
    title: "I explain things in plain language",
    body: "You do not need to understand coding, hosting, APIs or databases. Ask me anything, twice if you like, and you will get an answer without jargon.",
  },
  {
    icon: "key",
    title: "Your business stays yours",
    body: "Domain, hosting, Google account, Facebook page — registered in your name wherever it is practical. You can walk away with all of it.",
  },
  {
    icon: "warning",
    title: "If there is a problem, I say so",
    body: "Sometimes a job takes longer. Sometimes the plan has to change. You hear that from me the same day I know it, not after the deadline has gone.",
  },
  {
    icon: "inventory_2",
    title: "You know what you are getting",
    body: "Before we start, what is included and what is not included are both written down. Small business does not mean small respect.",
  },
  {
    icon: "verified_user",
    title: "A registered business, not a stranger",
    body: `A registered MSME — Udyam ${CONTACT.udyam} — based in Kolkata, with a proper invoice for every job.`,
  },
];

// The whole process, in the order it happens.
const STEPS = [
  {
    icon: "chat",
    title: "Tell me what you need",
    body: "WhatsApp is enough. Text, photos, a screenshot, a voice note, or just explain the idea. You do not have to prepare anything technical.",
  },
  {
    icon: "request_quote",
    title: "I explain the work and the price",
    body: "What can be done, what I recommend, what it will cost, what is included, what is not, and how long it should take. If something is unclear, ask.",
  },
  {
    icon: "payments",
    title: "You agree it, and I start",
    body: "Nothing begins until you have the price and have said yes to it. How and when you pay is settled in that same conversation, in writing, so there is never a figure you did not expect.",
  },
  {
    icon: "notifications_active",
    title: "I keep you updated",
    body: "You do not have to keep asking whether it has started or when it will be ready. I will tell you.",
  },
  {
    icon: "visibility",
    title: "You see it before it goes live",
    body: "You check the work and tell me what needs changing. Changes within what we agreed are part of the job, not a new bill.",
  },
  {
    icon: "rocket_launch",
    title: "It goes online",
    body: "Once you have approved it and the final payment is done, I put it live and hand over the accounts.",
  },
];

// "You explain the business, I'll explain the technology." Left column is what
// a customer actually says; right column is what it turns into.
const PLAIN_EXAMPLES = [
  {
    said: "I want people to see my products and call me.",
    built: "A website with your catalogue, your photos and a call button.",
  },
  {
    said: "I want parents to see our courses and contact us on WhatsApp.",
    built: "A course page with fees, timings and a WhatsApp button.",
  },
  {
    said: "I want customers to order from my shop.",
    built: "An online shop with UPI and card payment, and a bill they can keep.",
  },
  {
    said: "I want people to find my business on Google.",
    built: "A Google listing set up properly, and a site Google can read.",
  },
  {
    said: "I want an online booking system.",
    built: "A booking page, with the day's list on your phone.",
  },
  {
    said: "I have an Excel file and want software instead.",
    built: "A small application that does the same job without breaking.",
  },
];

// The transparent version. Saying who this is not for is what makes the rest
// of the page believable.
const NOT_FOR = [
  "You want the cheapest page anybody will make, and it does not matter how it works or who fixes it later.",
  "You want a large agency with a sales team, an account manager and a floor of people you will never meet.",
  "You want somebody who will agree to every date you name whether or not it is possible.",
];

const RIGHT_FOR = [
  "You want somebody to understand your actual business before quoting for it.",
  "You want a sensible solution instead of features you will never open.",
  "You want to know exactly what you are paying for.",
  "You want to talk directly to the person doing the work.",
  "You want somebody who still cares about the site after it has gone live.",
];


// Split down the middle for the two ticker rows, in the order they are
// declared in lib/site — the order there is deliberate, so it is kept.
const CAPABILITY_ROWS = [
  CAPABILITIES.slice(0, Math.ceil(CAPABILITIES.length / 2)),
  CAPABILITIES.slice(Math.ceil(CAPABILITIES.length / 2)),
];

export function Hero() {
  return (
  <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(55rem_38rem_at_50%_0%,black,transparent)]" />
      <div className="animate-drift absolute -left-40 -top-52 h-[34rem] w-[34rem] rounded-full bg-brand-300/35 blur-[120px]" />
      <div className="animate-drift absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-violet-400/25 blur-[120px] [animation-delay:-6s]" />
    </div>

    <div className="shell relative grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] lg:gap-16 lg:py-24 2xl:py-28">
      <Reveal>
        <p className="inline-flex items-center gap-2.5 rounded-full border border-brand-100 bg-white py-1.5 pl-2 pr-4 text-xs font-semibold uppercase tracking-widest text-brand-700 shadow-sm sm:text-sm">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
          </span>
          Kolkata · working with people all over India
        </p>
        <HeroHeading />
        <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg 2xl:text-xl">
          I build simple, professional websites and online services for
          shops, tutors, teachers, photographers, clinics, freelancers,
          small businesses and people starting something new.
        </p>
        <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-slate-800 sm:text-lg">
          Tell me what you need on WhatsApp. I will tell you what is
          possible and what it will cost.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3.5 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 px-5 py-4 text-white shadow-lift transition duration-300 hover:brightness-110 sm:px-6"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6"
                fill="currentColor"
              >
                <path d={WHATSAPP_PATH} />
              </svg>
            </span>
            <span className="mr-auto text-left">
              <span className="block text-base font-semibold leading-tight">
                WhatsApp me
              </span>
              <span className="block text-sm text-brand-100">
                Reply the same working day
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </a>
          <Link
            href="/what-i-can-do"
            className="group inline-flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition duration-300 hover:border-brand-300 hover:shadow-lift sm:px-6"
          >
            <span className="icon-tile h-12 w-12">
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[24px]"
              >
                list_alt
              </span>
            </span>
            <span className="mr-auto text-left">
              <span className="block text-base font-semibold leading-tight">
                See what I can do
              </span>
              <span className="block text-sm text-slate-500">
                In plain language, not technical names
              </span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-brand-600" />
          </Link>
        </div>

        {/* The four terms a first-time buyer is quietly checking for. */}
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5 text-sm font-medium text-slate-700">
          {[
            "One agreed price for the agreed work",
            "Small jobs from ₹499, websites from ₹4,499",
            "Payment agreed before work starts",
            "Your accounts stay under your control",
            "Registered MSME",
          ].map((t) => (
            <li key={t} className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[20px] text-brand-600"
              >
                check_circle
              </span>
              {t}
            </li>
          ))}
        </ul>
      </Reveal>

      {/* Not a photograph.
          There is no office and no team, so a picture of either would be the
          first thing on the page that is not true — and not doing that is
          what this site is selling. What goes here instead is the transaction
          itself, playing live: the enquiry arrives, the dots appear, the
          answer goes back. See hero-chat for why it quotes no price. */}
      <Reveal delay={120}>
        <HeroChat />
      </Reveal>
    </div>

    {/* The shorthand, on a band of its own. It stays because people scan
        for the word they came looking for — but it sits below the plain
        sentence, not above it.

        Two rows drifting in opposite directions rather than a static block of
        chips: a wall of eighteen identical pills reads as a price list nobody
        finishes, whereas something moving gets looked at, and the row that
        moves the other way stops the pair reading as one sliding sheet. It
        pauses under the cursor, so the movement never costs anyone the
        ability to actually read a name. */}
    <div className="relative overflow-hidden border-y border-slate-200 bg-white/70 py-7 backdrop-blur sm:py-9">
      <div className="shell">
        {/* A bare list of everything reads as a business with no speciality.
            Naming the four areas and then saying what it saves the customer
            is the same breadth, argued rather than announced. */}
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Websites, software, design and digital services — without dealing
          with five different people
        </p>
      </div>

      <div className="marquee relative mt-5 space-y-3">
        {[CAPABILITY_ROWS[0], CAPABILITY_ROWS[1]].map((row, r) => (
          <div
            key={r}
            style={{ ["--marquee-duration" as string]: r === 0 ? "52s" : "64s" }}
            className={`marquee-track gap-3 ${r === 1 ? "is-reverse" : ""}`}
          >
            {/* The list twice over: the first copy is the real one, the
                second exists only to fill the gap the first leaves behind. */}
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1 || undefined}
                className="flex shrink-0 gap-3 pr-3"
              >
                {row.map((c) => (
                  <li
                    key={c.label}
                    className="group inline-flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white py-2 pl-2 pr-4 text-sm font-medium text-slate-700 shadow-sm transition duration-300 hover:border-brand-300 hover:text-brand-700 hover:shadow-lift"
                  >
                    <span className="icon-tile-soft h-9 w-9 rounded-xl">
                      <span
                        aria-hidden="true"
                        className="material-symbols-rounded text-[20px]"
                      >
                        {c.icon}
                      </span>
                    </span>
                    {c.label}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>

      <div className="shell">
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-800">
            Starting small is fine.
          </span>{" "}
          You do not need all of this on day one. We can build what you
          need now and add the rest when your business grows.
        </p>
      </div>
    </div>
  </section>
  );
}

export function PuttingOff() {
  return (
  <section className="relative overflow-hidden band band-tint">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60rem_40rem_at_30%_0%,black,transparent)]"
    />
    <div className="shell relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 2xl:py-24">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Sound familiar?
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          Maybe you have been putting off your website
        </h2>
        <p className="mt-5 leading-relaxed text-slate-600">
          Because of how it went last time, or how it went for somebody you
          know. The problem is rarely the website itself. It is not being
          told the real number, not being able to reach anyone afterwards,
          and not owning the thing you paid for.
        </p>
        <p className="mt-4 text-lg font-semibold text-slate-900">
          It does not have to be.
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          If all you need today is a small site with your business name,
          your photos, your services, your location and a WhatsApp button
          — start with that. If later you need online payment, booking, an
          app, customer logins or something built specially for you, that
          can be built too.
        </p>
        <p className="mt-5 rounded-2xl border-l-4 border-brand-500 bg-white px-5 py-4 font-medium text-slate-800 shadow-sm">
          You hear the price before any work starts, the domain and hosting
          stay under your control wherever practical, and you talk to the person doing the
          work — not to a sales desk.
        </p>
      </Reveal>

      <Reveal delay={120}>
        <ul className="space-y-3">
          {EXCUSES.map((line, i) => (
            <li
              key={line}
              className={
                i % 2 === 0
                  ? "max-w-md rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-5 py-3.5 text-slate-700 shadow-sm"
                  : "ml-auto max-w-md rounded-2xl rounded-tr-sm border border-slate-200 bg-white px-5 py-3.5 text-slate-700 shadow-sm"
              }
            >
              &ldquo;{line}&rdquo;
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  </section>
  );
}

export function WhoIsItFor() {
  return (
  <section className="band band-plain">
    <div className="shell py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Who I work with
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          Is this for someone like you?
        </h2>
        <p className="mt-3 text-slate-600">
          If your business is small today, that is not a problem. You do
          not have to pretend to be a big company to have a good website.
        </p>
      </Reveal>

      <ul className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WHO.map((row, i) => (
          <Reveal as="li" key={row.title} delay={(i % 4) * 70}>
            <div className="group h-full rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:border-brand-300 hover:shadow-lift sm:p-6">
              <span className="icon-tile h-12 w-12">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[24px]"
                >
                  {row.icon}
                </span>
              </span>
              <span className="mt-4 block font-semibold tracking-tight">
                {row.title}
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">
                {row.body}
              </span>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  </section>
  );
}

export function WhatICanDo() {
  return (
  <section
    id="help"
    className="relative scroll-mt-32 overflow-hidden band band-tint"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(50rem_35rem_at_80%_0%,black,transparent)]"
    />
    <div className="shell relative py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          What I can do
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          What can I help you with?
        </h2>
        <p className="mt-3 text-slate-600">
          You do not have to know the technical name for it. Just tell me
          what you want to do.
        </p>
      </Reveal>

      <div className="mt-11 grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        {HELP_GROUPS.map((g, i) => (
          <Reveal key={g.title} delay={(i % 4) * 80} className="h-full">
            <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:border-brand-300 hover:shadow-lift sm:p-7">
              <span className="icon-tile h-12 w-12">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[24px]"
                >
                  {g.icon}
                </span>
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {g.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {g.lead}
              </p>
              <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-700">
                {g.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="material-symbols-rounded mt-px shrink-0 text-[18px] text-brand-500"
                    >
                      check
                    </span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="mt-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Need something more advanced?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              AI, automation, software built from scratch, mobile apps and
              cloud hosting are all possible as well. Most of the software
              I run for other people started as one of those conversations.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Don&apos;t know what you need?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              That is completely fine, and it is how most jobs here start.
              Tell me the problem first. Working out what will actually fix
              it is my part of the job, not yours.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
  );
}

export function MyPromise() {
  return (
  <section
    id="promise"
    className="scroll-mt-32 band band-plain"
  >
    <div className="shell py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          My promise
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          What can you expect from me?
        </h2>
      </Reveal>

      <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PROMISES.map((p, i) => (
          <Reveal key={p.title} delay={(i % 4) * 70} className="h-full">
            <div className="group flex h-full gap-4">
              <span className="icon-tile-soft h-12 w-12">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[24px]"
                >
                  {p.icon}
                </span>
              </span>
              <span>
                <span className="block font-semibold tracking-tight">
                  {p.title}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">
                  {p.body}
                </span>
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
  );
}

export function PromiseBand() {
  return (
  <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 text-white">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-grid-dark opacity-50"
    />
    <div
      aria-hidden="true"
      className="animate-drift pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
    />
    <div className="shell relative py-16 sm:py-20 2xl:py-24">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-100">
          In my own words
        </p>
        <p className="mt-3 text-sm text-brand-100/80">
          Read it in your language
        </p>
        <PromiseCarousel />

        <div className="mt-9 flex items-center justify-center gap-4">
          <Image
            src="/santanu-sarkar.jpg"
            alt=""
            width={640}
            height={640}
            className="h-14 w-14 rounded-full border-2 border-white/80 object-cover"
          />
          <span className="text-left">
            <span className="block font-semibold">Santanu Sarkar</span>
            <span className="block text-sm text-brand-100">
              Founder, Nexvora Technologies
            </span>
          </span>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-700 shadow-lift transition hover:bg-brand-50"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 text-[#25D366]"
              fill="currentColor"
            >
              <path d={WHATSAPP_PATH} />
            </svg>
            Tell me what you need
          </a>
          <a
            href={CONTACT.phoneHref}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <span
              aria-hidden="true"
              className="material-symbols-rounded text-[20px]"
            >
              call
            </span>
            {CONTACT.phoneDisplay}
          </a>
        </div>
      </Reveal>
    </div>
  </section>
  );
}

export function HowItWorks() {
  return (
  <section
    id="how"
    className="scroll-mt-32 band band-plain"
  >
    <div className="shell py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          Six steps, and no surprises on the bill
        </h2>
      </Reveal>

      <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={(i % 3) * 100} className="relative">
            <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:border-brand-300 hover:shadow-lift sm:p-7">
              <div className="flex items-center gap-4">
                <span className="icon-tile h-12 w-12">
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded text-[24px]"
                  >
                    {s.icon}
                  </span>
                </span>
                <span className="text-4xl font-bold tabular-nums text-slate-100 transition group-hover:text-brand-100">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                {s.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <p className="mt-8 text-slate-600">
          That is the whole process. There is no complicated paperwork in
          the middle of it.
        </p>
      </Reveal>
    </div>
  </section>
  );
}

export function NoTechNeeded() {
  return (
  <section className="relative overflow-hidden band band-tint">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(55rem_35rem_at_20%_0%,black,transparent)]"
    />
    <div className="shell relative py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          No technical knowledge needed
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          &ldquo;But I don&apos;t know anything about websites.&rdquo;
        </h2>
        <p className="mt-5 leading-relaxed text-slate-600">
          That is fine. You do not need to know HTML, CSS, React, hosting,
          databases, APIs, SEO or any other word like them. There is no
          shame in not knowing technology — that is exactly why you are
          talking to somebody who does.
        </p>
        <p className="mt-4 font-semibold text-slate-900">
          Tell me what you want your customer to be able to do. That is
          enough to start.
        </p>
      </Reveal>

      <ul className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLAIN_EXAMPLES.map((row, i) => (
          <Reveal as="li" key={row.said} delay={(i % 3) * 80}>
            <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="rounded-2xl rounded-tl-sm bg-brand-50 px-4 py-3 text-sm font-medium leading-snug text-brand-900">
                &ldquo;{row.said}&rdquo;
              </p>
              <div className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded shrink-0 text-[20px] text-brand-500"
                >
                  subdirectory_arrow_right
                </span>
                <span>{row.built}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </ul>

      <Reveal delay={140}>
        <p className="mt-8 text-lg font-semibold text-slate-900">
          You explain the business. I will explain the technology.
        </p>
      </Reveal>
    </div>
  </section>
  );
}

export function Pricing() {
  return (
  <section
    id="price"
    className="scroll-mt-32 band band-plain"
  >
    <div className="shell grid gap-12 pb-12 pt-16 sm:pt-20 lg:grid-cols-2 lg:gap-16 2xl:pt-24">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Price
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          How much will it cost?
        </h2>
        <p className="mt-5 leading-relaxed text-slate-600">
          There is no single price for every business. A one-page website
          and a full online shop are not the same job. A simple site may
          need a few pages. A business application may need a database, a
          login, an admin panel and a lot more besides.
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          So I am not going to put a made-up &ldquo;starting from
          ₹X&rdquo; on this page just to get you to call. Tell me what you
          actually need, I will look at it properly, and I will give you a
          number for it.
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          No surprise invoice later because the job quietly became
          &ldquo;more complicated&rdquo; without anyone discussing it with
          you.
        </p>
      </Reveal>

      <Reveal delay={120} className="self-start">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            For suitable projects
          </p>
          <p className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            One agreed price for the agreed work.
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-500 sm:text-3xl">
            Payment on the terms we settle with it.
          </p>
          <ul className="mt-7 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-700">
            {[
              "You know the price before the work begins.",
              "What is included and what is not are both written down.",
              "Changes within what we agreed are not a fresh bill.",
              "A proper invoice for every job.",
            ].map((line) => (
              <li key={line} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded shrink-0 text-[20px] text-brand-600"
                >
                  check_circle
                </span>
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>
          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:brightness-105"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d={WHATSAPP_PATH} />
            </svg>
            Ask me what yours would cost
          </a>
        </div>
      </Reveal>
    </div>

    {/* The small end of the price list — the one part of this section
        that does carry numbers, because here they are real. */}
    <div className="shell pb-16 sm:pb-20 2xl:pb-24">
      <Reveal>
        <div className="rounded-[1.75rem] border border-brand-200 bg-brand-50/60 p-6 shadow-sm sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-700 shadow-sm">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[18px]"
                >
                  bolt
                </span>
                Small jobs
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl 2xl:text-4xl">
                Small job? ₹499 to ₹12,999, and usually back the same day.
              </h2>
              <p className="mt-4 leading-relaxed text-slate-700">
                Not everything is a website. Sometimes you need one poster
                for tomorrow&apos;s offer, a bill format, a presentation
                by Monday, or three quick pages with a contact form — and
                nobody wants to quote for work that small.
              </p>
              <p className="mt-3 leading-relaxed text-slate-700">
                I do. Send it on WhatsApp with whatever details and photos
                you have. The smallest jobs come back within minutes of me
                reading your message. If it needs a change, say so and it
                comes back changed.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                How this one works
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {[
                  "You are told the price before I touch it.",
                  "Nothing in this range needs an advance conversation — pay when you are happy with it.",
                  "Design files can be printed and couriered to you — printing and courier paid by you, at cost.",
                  "₹12,999 is where this band ends, not where the work does — a web application, a database, an online shop or a mobile app gets a proper look and its own number.",
                  "Domain, hosting and any advertising budget are separate, and never inside these figures.",
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="material-symbols-rounded shrink-0 text-[20px] text-brand-600"
                    >
                      check_circle
                    </span>
                    <span className="leading-snug">{line}</span>
                  </li>
                ))}
              </ul>
              <a
                href={CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:brightness-105"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d={WHATSAPP_PATH} />
                </svg>
                Send me a small job now
              </a>
            </div>
          </div>

          {/* Every number here comes from pricing.ts, the same list the
              calculator adds up — so the page and the panel can never
              disagree about what something costs. */}
          <div className="mt-8 grid gap-4 border-t border-brand-200/70 pt-8 sm:grid-cols-2 2xl:grid-cols-4">
            {PRICE_GROUPS.map((g) => (
              <div
                key={g.id}
                className="group flex h-full flex-col rounded-2xl border border-white bg-white p-5 shadow-sm sm:p-6"
              >
                <span className="icon-tile-soft h-11 w-11">
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded text-[22px]"
                  >
                    {g.icon}
                  </span>
                </span>
                <h4 className="mt-4 font-semibold tracking-tight">
                  {g.title}
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {g.lead}
                </p>
                <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
                  {g.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-baseline justify-between gap-3 py-2"
                    >
                      <span className="leading-snug text-slate-700">
                        {item.label}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                        {rupees(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-slate-600">
            Not on the list? Ask anyway. If it is small and I can do it,
            it is priced the same way.
          </p>
        </div>
      </Reveal>

      {/* Packages. Cheaper than ticking the same things one by one, but the
          struck-through total and the "you keep" line are deliberately not
          shown. A crossed-out price is the oldest trick on a sales page, and
          on a site whose whole argument is that it does not do sales tricks,
          it costs more trust than the saving it advertises. The parts are all
          priced above; anyone who wants to check the arithmetic can. The
          `worth` figure is still computed in lib/pricing — it fails the build
          on a bad item id, which is worth keeping on its own. */}
      <Reveal delay={100}>
        <div className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Or take the lot together and pay less
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Most people who come to me need several of these at once. Put
            together, they cost less than buying them one at a time.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {PACKAGES.map((p) => (
              <div
                key={p.id}
                className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm sm:p-8 ${
                  p.featured
                    ? "border-brand-500 bg-white ring-1 ring-brand-500"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold tracking-tight">
                      {p.name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {p.tagline}
                    </p>
                  </div>
                  {p.featured && (
                    <span className="shrink-0 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      Best value
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tight">
                    {rupees(p.price)}
                  </span>
                </div>

                <ul className="mt-6 flex-1 space-y-2.5 border-t border-slate-100 pt-6 text-sm text-slate-700">
                  {p.includes.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span
                        aria-hidden="true"
                        className="material-symbols-rounded mt-px shrink-0 text-[18px] text-brand-500"
                      >
                        check
                      </span>
                      <span className="leading-snug">{line}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-lift transition ${
                    p.featured
                      ? "bg-gradient-to-br from-brand-600 to-violet-600 text-white hover:brightness-110"
                      : "border border-slate-300 bg-white text-slate-800 hover:border-brand-400 hover:text-brand-700"
                  }`}
                >
                  Ask me about {p.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* The running costs, said out loud rather than buried. */}
      <Reveal delay={140}>
        <div className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-amber-900">
            <span
              aria-hidden="true"
              className="material-symbols-rounded text-[26px]"
            >
              info
            </span>
            What no price on this page includes
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-amber-900/90">
            These are running costs. They are paid to the provider, in
            your own name, and I do not add anything on top of them. You
            will be told what each one costs before you commit to it —
            finding this out after the work is done is exactly the kind of
            surprise this page exists to avoid.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NOT_INCLUDED.map((row) => (
              <li
                key={row.label}
                className="flex gap-3 rounded-2xl bg-white/70 p-4"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded shrink-0 text-[22px] text-amber-700"
                >
                  {row.icon}
                </span>
                <span className="text-sm leading-snug text-amber-950">
                  <span className="block font-semibold">{row.label}</span>
                  <span className="mt-1 block text-amber-900/90">
                    {row.note}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  </section>
  );
}

export function Examples() {
  return (
  <section
    id="examples"
    className="scroll-mt-32 band band-plain"
  >
    <div className="shell py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Examples
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          Things I have actually built
        </h2>
        <p className="mt-3 text-slate-600">
          Not mock-ups or template previews — screenshots of software that
          is running right now, with real people using it. Open any of
          them and look for yourself.
        </p>
      </Reveal>

      <div className="mt-11 grid gap-6 lg:grid-cols-3">
        {WORK.map((w, i) => {
          const shot = (
            <>
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                <Image
                  src={w.image}
                  alt={w.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                    {w.kind}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight">
                    {w.name}
                  </h3>
                </div>
                {w.href && (
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand-600" />
                )}
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                {w.blurb}
              </p>
            </>
          );

          const base =
            "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 sm:p-5";

          return (
            <Reveal key={w.name} delay={(i % 3) * 80} className="h-full">
              {w.href ? (
                <a
                  href={w.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${base} hover:border-brand-300 hover:shadow-lift`}
                >
                  {shot}
                </a>
              ) : (
                <div className={base}>{shot}</div>
              )}
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={140}>
        <p className="mt-8 text-slate-600">
          Your job does not have to be this big. Most of what I do in a
          week is a poster, a page or a spreadsheet that somebody needed
          by Friday.
        </p>
      </Reveal>
    </div>
  </section>
  );
}

export function Products() {
  return (
  <section
    id="products"
    className="scroll-mt-32 band band-tint"
  >
    <div className="shell py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          My own software
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          I also build my own software
        </h2>
        <p className="mt-3 text-slate-600">
          Nexvora is not only a service business. These are products I
          built and still run for real businesses — which means I know
          what happens to software after it goes live, not just up to the
          day it launches.
        </p>
      </Reveal>

      <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {PRODUCTS.map((p, i) => {
          const card = (
            <>
              <div className="flex items-start justify-between gap-3">
                {/* Monogram in the product's own accent, so the grid
                    reads as seven distinct things rather than seven
                    identical boxes. */}
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${p.accent} text-lg font-bold text-white shadow-lift ring-1 ring-inset ring-white/25 transition duration-300`}
                >
                  {p.name.charAt(0)}
                </span>
                {p.href ? (
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand-600" />
                ) : (
                  <span className="mt-1 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Coming soon
                  </span>
                )}
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {p.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-brand-600">
                {p.tagline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {p.blurb}
              </p>
              <div
                className={`mt-5 h-1 w-0 rounded-full bg-gradient-to-r ${p.accent} transition-all duration-500 group-hover:w-16`}
              />
            </>
          );

          const base =
            "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300";

          return (
            <Reveal key={p.name} delay={(i % 4) * 70} className="h-full">
              {p.href ? (
                <a
                  href={p.href}
                  className={`${base} hover:border-brand-300 hover:shadow-lift`}
                >
                  {card}
                </a>
              ) : (
                <div className={`${base} opacity-75`}>{card}</div>
              )}
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
  );
}

export function ServicesDetail() {
  return (
  <section
    id="services"
    className="relative scroll-mt-32 overflow-hidden band band-plain"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(50rem_35rem_at_20%_100%,black,transparent)]"
    />
    <div className="shell relative py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          The longer list
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          If you want the detail, here it is
        </h2>
        <p className="mt-3 text-slate-600">
          You do not need to read this part to send me a message. It is
          here for people who like to know exactly what they are buying.
        </p>
      </Reveal>

      <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {SERVICES.map((s, i) => (
          <Reveal key={s.title} delay={(i % 4) * 70} className="h-full">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:border-brand-300 hover:shadow-lift sm:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-brand-100 to-violet-400/20 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100"
              />
              <span className="pointer-events-none absolute right-5 top-4 text-3xl font-bold tabular-nums text-slate-100 transition group-hover:text-brand-100">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="icon-tile-soft relative h-12 w-12">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[24px]"
                >
                  {s.icon}
                </span>
              </span>
              <h3 className="relative mt-5 text-lg font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="relative mt-3 text-sm leading-relaxed text-slate-600">
                {s.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
  );
}

export function WhyIStarted() {
  return (
  <section
    id="mission"
    className="relative scroll-mt-32 overflow-hidden band band-tint"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60rem_40rem_at_70%_0%,black,transparent)]"
    />
    <div className="shell relative grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 2xl:py-24">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Why I started Nexvora
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          The quote is the problem, not the technology
        </h2>
        <p className="mt-5 leading-relaxed text-slate-600">
          I have watched too many small businesses be told that going
          online is expensive and complicated. A shop may only need a
          simple website. A tutor may need one page with the courses and a
          WhatsApp button. A photographer needs a portfolio. A small clinic
          needs an enquiry page. Somebody starting out just needs a proper
          place on the internet they can show a customer.
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          What they get instead is a quotation written for a company ten
          times their size, a yearly maintenance charge on top, and a
          marketing retainer they cannot justify. So most of them stay
          offline, or end up with a half-finished page nobody ever updates.
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          They should not have to spend like a large company. So I build
          to the actual size of the business in front of me. You do not
          have to buy ten things when you only need two.
        </p>
        <p className="mt-5 rounded-2xl border-l-4 border-brand-500 bg-white px-5 py-4 font-medium text-slate-800 shadow-sm">
          Start small. Spend carefully. Grow when you are ready.
        </p>
      </Reveal>

      <Reveal delay={120}>
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-lift">
          <Image
            src="/mission-shop.jpg"
            alt="A shop owner standing outside his shop"
            width={1000}
            height={780}
            className="h-64 w-full rounded-[1.4rem] object-cover sm:h-80 lg:h-[26rem]"
          />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          The customer I actually build for.
        </p>
      </Reveal>
    </div>
  </section>
  );
}

export function Founder() {
  return (
  <section
    id="founder"
    className="relative scroll-mt-32 overflow-hidden band band-plain"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-100/50 blur-3xl"
    />
    <div className="shell relative grid items-start gap-10 py-16 sm:py-20 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16 2xl:py-24">
      <Reveal className="mx-auto w-full max-w-[300px] text-center lg:mx-0 lg:text-left">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -right-3 h-full w-full rounded-[1.75rem] bg-gradient-to-br from-brand-500 to-violet-600"
          />
          <Image
            src="/santanu-sarkar.jpg"
            alt="Santanu Sarkar, founder of Nexvora Technologies"
            width={640}
            height={640}
            className="relative w-full rounded-[1.75rem] border-4 border-white object-cover shadow-lift"
          />
        </div>
        <p className="mt-6 text-lg font-semibold tracking-tight">
          Santanu Sarkar
        </p>
        <p className="text-sm text-slate-600">
          Founder, Nexvora Technologies
        </p>
        <SocialLinks className="mt-4 justify-center lg:justify-start" />
      </Reveal>

      <Reveal delay={100} className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          About me
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          Who will actually do the work?
        </h2>
        <p className="mt-5 leading-relaxed text-slate-600">
          I am Santanu. Nexvora is a small technology business based in
          Kolkata, and it is mine. I do the work myself — from working out
          what you need, to building the website or the software, to
          helping you get it online. When a job genuinely needs another
          pair of hands, a photographer, a printer, someone for a language
          I do not write, I bring that person in for that piece of it. Your
          job stays mine either way: I choose them, I check what they hand
          back, and you deal only with me.
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          I have 13+ years of hands-on experience building websites and web
          applications professionally, most of them at Webspiders. But you
          do not need to know any of my technical background to work with
          me. What matters more is this: if you call or message Nexvora,
          you are talking to the person who will do the work. There is no
          sales team promising one thing while somebody else quietly works
          out how to build it.
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          I will tell you what I think is practical. And if I think you do
          not need something, I will tell you that too. I want your
          business to get online — not your bill to get bigger.
        </p>

        {/* How we will actually talk to each other, including the part
            most people are too polite to ask about. */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <span className="icon-tile-soft h-11 w-11">
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[22px]"
              >
                videocam
              </span>
            </span>
            <h3 className="mt-4 font-semibold tracking-tight">
              Mostly we can do this over the phone
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Phone, WhatsApp and video call handle almost every job, in
              Bengali, Hindi or English. It is quicker for you, and it
              keeps your cost down. If you would rather sit across a table,
              say so and we will find somewhere in Kolkata to meet.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <span className="icon-tile-soft h-11 w-11">
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[22px]"
              >
                flight_takeoff
              </span>
            </span>
            <h3 className="mt-4 font-semibold tracking-tight">
              Meeting in person, if I agree it is needed
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Some jobs are better done face to face, and for those I will
              travel. Whether a job is one of them is my decision, and I
              will say yes or no plainly rather than leave you waiting. If
              I do travel, you arrange the travel, the stay and the food —
              and I add no charge on top for the trip itself.
            </p>
          </div>
        </div>

        <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {[
            {
              icon: "call",
              term: "Phone and WhatsApp",
              value: CONTACT.phoneDisplay,
              href: CONTACT.whatsappHref,
            },
            {
              icon: "mail",
              term: "Email",
              value: CONTACT.email,
              href: CONTACT.emailHref,
            },
            {
              icon: "location_on",
              term: "Address",
              value: `${CONTACT.street}, ${CONTACT.city} ${CONTACT.pincode}`,
              href: null,
            },
            {
              icon: "verified_user",
              term: "Registered MSME",
              value: `Udyam ${CONTACT.udyam}`,
              href: null,
            },
          ].map((row) => (
            <div key={row.term} className="group flex items-start gap-3">
              <span className="icon-tile-soft h-10 w-10">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[22px]"
                >
                  {row.icon}
                </span>
              </span>
              <div className="min-w-0">
                <dt className="text-sm font-semibold">{row.term}</dt>
                <dd className="mt-0.5 break-words text-sm text-slate-600">
                  {row.href ? (
                    <a
                      href={row.href}
                      className="hover:text-brand-600 hover:underline"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </Reveal>
    </div>
  </section>
  );
}

export function NotRightForYou() {
  return (
  <section className="band band-tint">
    <div className="shell py-16 sm:py-20 2xl:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Being straight with you
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          Maybe I am not the right person for you
        </h2>
        <p className="mt-3 text-slate-600">
          I do not want to take every job that comes to me. It is better
          for both of us if you know that now rather than later.
        </p>
      </Reveal>

      <div className="mt-11 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-semibold tracking-tight">
              Probably look elsewhere if
            </h3>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-slate-600">
              {NOT_FOR.map((line) => (
                <li key={line} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded shrink-0 text-[20px] text-slate-400"
                  >
                    do_not_disturb_on
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="h-full rounded-2xl border border-brand-200 bg-brand-50/60 p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-semibold tracking-tight">
              Message me if
            </h3>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700">
              {RIGHT_FOR.map((line) => (
                <li key={line} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded shrink-0 text-[20px] text-brand-600"
                  >
                    check_circle
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
  );
}

export function Faq() {
  return (
  <section
    id="faq"
    className="scroll-mt-32 band band-plain"
  >
    <div className="shell grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16 2xl:py-24">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Questions
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          The things people ask me first
        </h2>
        <p className="mt-4 leading-relaxed text-slate-600">
          If your question is not here, ask it on WhatsApp. No question
          about your own money is a silly one.
        </p>
        <a
          href={CONTACT.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:brightness-105"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="currentColor"
          >
            <path d={WHATSAPP_PATH} />
          </svg>
          Ask me directly
        </a>
      </Reveal>

      <Reveal delay={100}>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold tracking-tight marker:hidden">
                <span>{f.q}</span>
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded mt-0.5 shrink-0 text-[22px] text-brand-600 transition-transform duration-300 group-open:rotate-45"
                >
                  add
                </span>
              </summary>
              <p className="mt-3 max-w-3xl pr-8 text-sm leading-relaxed text-slate-600">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
  );
}

export function Contact() {
  return (
  <section
    id="contact"
    className="band band-tint scroll-mt-32 py-16 sm:py-20 2xl:py-24"
  >
    <div className="shell">
      <Reveal className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Contact
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
          Have an idea but don&apos;t know where to start?
        </h2>
        <p className="mt-5 leading-relaxed text-slate-600">
          That is fine. Just send me a message like one of these:
        </p>
        <ul className="mt-5 space-y-3">
          {[
            "I have a small shop and need a website.",
            "I am a tutor and want to get students online.",
            "I want to start a business and need a website.",
          ].map((line) => (
            <li
              key={line}
              className="max-w-lg rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-5 py-3.5 text-slate-700 shadow-sm"
            >
              &ldquo;{line}&rdquo;
            </li>
          ))}
        </ul>
        <p className="mt-5 leading-relaxed text-slate-600">
          That is enough to start. I will ask you the questions I need. No
          technical knowledge required.
        </p>
      </Reveal>

      <div className="mt-11 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,52%)] lg:gap-10">
        <div className="grid gap-4 self-start sm:grid-cols-2">
          {[
            {
              icon: "chat",
              term: "WhatsApp",
              value: "Text, photo or voice note",
              href: CONTACT.whatsappHref,
            },
            {
              icon: "call",
              term: "Phone",
              value: CONTACT.phoneDisplay,
              href: CONTACT.phoneHref,
            },
            {
              icon: "mail",
              term: "Email",
              value: CONTACT.email,
              href: CONTACT.emailHref,
            },
            {
              icon: "location_on",
              term: "Address",
              value: CONTACT.addressLines.join(", "),
              href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                CONTACT.mapQuery,
              )}`,
            },
          ].map((row, i) => (
            <Reveal key={row.term} delay={60 * i} className="h-full">
              <a
                href={row.href}
                {...(row.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:border-brand-300 hover:shadow-lift"
              >
                <span className="icon-tile-soft h-12 w-12">
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded text-[24px]"
                  >
                    {row.icon}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {row.term}
                  </span>
                  <span className="mt-1 block break-words text-sm text-slate-600">
                    {row.value}
                  </span>
                </span>
              </a>
            </Reveal>
          ))}

          <Reveal delay={260} className="sm:col-span-2">
            <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
              Most of the work runs on WhatsApp and video call. Some jobs
              are better done face to face, and for those I will travel —
              whether yours is one of them is my decision, and you will get
              a plain yes or no. If I do come, you cover the travel, stay
              and food, and there is no extra charge for the trip.
            </p>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-lift">
            <iframe
              title="Nexvora Technologies office location on Google Maps"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                CONTACT.mapQuery,
              )}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[320px] w-full rounded-xl border-0 sm:h-[420px] lg:h-full lg:min-h-[420px]"
            />
          </div>
        </Reveal>
      </div>
    </div>
  </section>
  );
}
