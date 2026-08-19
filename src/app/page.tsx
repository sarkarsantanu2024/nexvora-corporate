import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import { PromiseCarousel } from "@/components/promise-carousel";
import { Reveal } from "@/components/reveal";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { PRODUCTS } from "@/lib/products";
import { SERVICES } from "@/lib/services";
import { CAPABILITIES, CONTACT } from "@/lib/site";

const YEAR = 2026;

// The things a cautious buyer wants settled before they will read on.
const PROMISES = [
  {
    icon: "receipt_long",
    title: "Fixed price, half to start",
    body: "One number agreed in writing, 50% advance to begin and the rest on delivery. No hourly meter, no revised estimate halfway.",
  },
  {
    icon: "handshake",
    title: "We will not lie to you",
    body: "If a date is going to slip, or something cannot be done the way you want, you hear it the same day. We would rather lose the job than tell you a comfortable lie.",
  },
  {
    icon: "notifications_active",
    title: "You are told at every step",
    body: "A message when work starts, when it is ready for your review, and when it goes live. You never have to ring and ask what is happening.",
  },
  {
    icon: "key",
    title: "Everything in your name",
    body: "Domain, hosting, Google and social accounts are registered to you, not to us. You can walk away with all of it.",
  },
  {
    icon: "verified_user",
    title: "Registered MSME",
    body: `Udyam ${CONTACT.udyam}, a GST invoice for every rupee, and an office you can visit.`,
  },
];

// Reading the money question in the order a customer actually asks it.
const STEPS = [
  {
    icon: "chat",
    title: "Send it on WhatsApp",
    body: "A voice note, a photograph of something you have written down, or two lines of text. Whatever is easiest. No form with fourteen mandatory fields.",
  },
  {
    icon: "request_quote",
    title: "Agree the price, pay half",
    body: "One fixed number for a fixed scope, with whatever is not included spelled out. Half up front to start the work, the balance when it is delivered.",
  },
  {
    icon: "bedtime",
    title: "Then put the phone down",
    body: "You get a message when the work starts, when it is ready to look at, and when it goes live. Chasing us for an update is not part of your job.",
  },
];

const MISSION_CASES = [
  {
    icon: "storefront",
    title: "The shop with no website yet",
    body: "A few honest pages, your products, your phone number, and a map pin that actually finds you.",
  },
  {
    icon: "badge",
    title: "The freelancer with no online identity",
    body: "A portfolio at your own name, so a client searching for you finds work rather than nothing at all.",
  },
  {
    icon: "shopping_bag",
    title: "The trader ready to sell online",
    body: "A store with UPI and card payment, GST invoices and delivery tracking, without a monthly platform bill.",
  },
  {
    icon: "thumb_up",
    title: "The business nobody has heard of",
    body: "Facebook page, YouTube channel and Google listing set up properly, then promoted to the people nearby.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ------------------------------------------------------------------
            Hero. Kept light and warm rather than dark — this page is asking a
            careful, price-sensitive buyer to stay and read.
        ------------------------------------------------------------------- */}
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
                Kolkata · serving all of India
              </p>
              <h1 className="mt-6 text-[2.1rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl 2xl:text-[4.2rem]">
                Bring your business online. Fast, and{" "}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10 bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
                    for less money
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
                .
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg 2xl:text-xl">
                Website, online shop, logo, printing, Facebook page, YouTube
                channel, ads — all from one place. Send us a message on
                WhatsApp. You get one price. Pay half, and we start.
              </p>

              {/* The four terms a first-time buyer is quietly checking for. */}
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-sm font-medium text-slate-700">
                {[
                  "One price, no extra bills",
                  "Pay half to start",
                  "Stays in your name",
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

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="https://eduflow.nexvoratechnologies.co.in"
                  className="group inline-flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition duration-300 hover:border-brand-300 hover:shadow-lift sm:px-6"
                >
                  <span className="icon-tile h-12 w-12">
                    <span
                      aria-hidden="true"
                      className="material-symbols-rounded text-[24px]"
                    >
                      school
                    </span>
                  </span>
                  <span className="mr-auto text-left">
                    <span className="block text-base font-semibold leading-tight">
                      EduFlow
                    </span>
                    <span className="block text-sm text-slate-500">
                      Student management software
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-brand-600" />
                </a>
                <a
                  href={CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3.5 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 px-5 py-4 text-white shadow-lift transition duration-300 hover:brightness-110 sm:px-6"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
                    <span
                      aria-hidden="true"
                      className="material-symbols-rounded text-[24px]"
                    >
                      handyman
                    </span>
                  </span>
                  <span className="mr-auto text-left">
                    <span className="block text-base font-semibold leading-tight">
                      Ask the price on WhatsApp
                    </span>
                    <span className="block text-sm text-brand-100">
                      Reply the same working day
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0" />
                </a>
              </div>
            </Reveal>

            {/* Photo, framed and offset, with the two numbers worth knowing
                pinned to its corner. */}
            <Reveal delay={120} className="relative">
              <div
                aria-hidden="true"
                className="absolute -right-3 -top-3 hidden h-full w-full rounded-[2rem] border-2 border-brand-200 sm:block"
              />
              <div className="animate-float-slow relative overflow-hidden rounded-[2rem] bg-white p-2 shadow-lift ring-1 ring-slate-200">
                <Image
                  src="/hero-team.jpg"
                  alt="A project team reviewing work together in an office"
                  width={1200}
                  height={900}
                  priority
                  className="h-full w-full rounded-[1.6rem] object-cover"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:absolute sm:-bottom-6 sm:-left-5 sm:mt-0 sm:w-[17.5rem] sm:grid-cols-1 sm:gap-0 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-5 sm:shadow-lift lg:-left-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-none sm:border-0 sm:p-0">
                  <p className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                    300+
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-600 sm:text-sm">
                    centres already running our software
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:mt-4 sm:rounded-none sm:border-0 sm:border-t sm:border-slate-200 sm:p-0 sm:pt-4">
                  <p className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                    13 yrs
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-600 sm:text-sm">
                    building for the web, hands on the keyboard
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* What we build, on a band of its own so it is impossible to miss
              on the way past. */}
          <div className="relative border-y border-slate-200 bg-white/70 backdrop-blur">
            <div className="shell py-7 sm:py-9">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                What we build
              </p>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {CAPABILITIES.map((c) => (
                  <li
                    key={c.label}
                    className="group inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white py-2 pl-2 pr-4 text-sm font-medium text-slate-700 shadow-sm transition duration-300 hover:border-brand-300 hover:text-brand-700 hover:shadow-lift"
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
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            What you are promised, before anything is sold
        ------------------------------------------------------------------- */}
        <section className="border-b border-slate-200 bg-white">
          <div className="shell grid gap-6 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-3 xl:grid-cols-5">
            {PROMISES.map((p, i) => (
              <Reveal key={p.title} delay={70 * i} className="h-full">
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
        </section>

        {/* ------------------------------------------------------------------
            Why we exist
        ------------------------------------------------------------------- */}
        <section
          id="mission"
          className="relative scroll-mt-32 overflow-hidden border-b border-slate-200 bg-slate-50"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60rem_40rem_at_70%_0%,black,transparent)]"
          />
          <div className="shell relative py-16 sm:py-20 2xl:py-24">
            {/* Text beside the photograph, cases in a full-width row below.
                The earlier two-column split left the right half empty once the
                four cards ran out while the prose kept going. */}
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                Why we exist
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
                The quote is the problem, not the technology
              </h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                A tailor, a tutor, a chemist, a wedding photographer — they all
                need roughly the same four things. Somewhere people can find
                them. Somewhere people can message them. Somewhere people can
                buy from them. And somebody to keep all of it running.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                What they get instead is a quotation written for a company ten
                times their size, an annual maintenance charge on top, and a
                marketing retainer they cannot justify. So most of them stay
                offline, or end up with a half-finished page nobody updates.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                We would rather fix that. The work is kept small and honest, we
                reuse what we have already built instead of billing you to write
                it twice, and the price is set for the business in front of us.
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
                The customer we actually build for.
              </p>
            </Reveal>
            </div>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MISSION_CASES.map((row, i) => (
                <Reveal as="li" key={row.title} delay={80 * i}>
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

        {/* ------------------------------------------------------------------
            How it works
        ------------------------------------------------------------------- */}
        <section className="border-b border-slate-200 bg-white">
          <div className="shell py-16 sm:py-20 2xl:py-24">
            <Reveal className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Three steps, no surprises on the invoice
              </h2>
            </Reveal>

            <div className="relative mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
              {/* The line joining the three steps on wide screens. */}
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block"
              />
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={100 * i} className="relative">
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
          </div>
        </section>

        {/* ------------------------------------------------------------------
            The pledge. This is the founder's own position, set as a signed
            statement rather than another row of cards, because it is the one
            thing on the page a nervous first-time buyer is really weighing.
        ------------------------------------------------------------------- */}
        <section
          id="promise"
          className="relative scroll-mt-32 overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 text-white"
        >
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
                Our promise to you
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
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  Send your requirement on WhatsApp
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

        {/* ------------------------------------------------------------------
            Products
        ------------------------------------------------------------------- */}
        <section
          id="products"
          className="scroll-mt-32 border-b border-slate-200 bg-slate-50"
        >
          <div className="shell py-16 sm:py-20 2xl:py-24">
            <Reveal className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                Our products
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
                Seven products, built and run by us
              </h2>
              <p className="mt-3 text-slate-600">
                Each one runs independently, with its own login and its own
                data. Nothing is shared between them.
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

        {/* ------------------------------------------------------------------
            Services
        ------------------------------------------------------------------- */}
        <section
          id="services"
          className="relative scroll-mt-32 overflow-hidden border-b border-slate-200 bg-white"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(50rem_35rem_at_20%_100%,black,transparent)]"
          />
          <div className="shell relative py-16 sm:py-20 2xl:py-24">
            <Reveal className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                Services
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
                What we take on for clients
              </h2>
              <p className="mt-3 text-slate-600">
                Alongside our own products we do a limited amount of build work
                for other businesses. This is the sort we say yes to — and the
                same person who ships our products does it.
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

        {/* ------------------------------------------------------------------
            About
        ------------------------------------------------------------------- */}
        <section
          id="about"
          className="scroll-mt-32 border-b border-slate-200 bg-slate-50"
        >
          <div className="shell grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 2xl:py-24">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                About
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
                About Nexvora
              </h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                Nexvora Technologies is a product company based in Kolkata,
                West Bengal. Our own software comes first — every product we
                launch keeps getting maintained, supported and improved long
                after launch — and we take on a limited amount of client work
                alongside it.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                Our customers are schools, coaching centres, clinics, print
                shops and local businesses. The common thread is simple: they
                have real work to do and no appetite for complicated software.
              </p>
              <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[20px] text-brand-600"
                >
                  verified_user
                </span>
                Registered MSME · Udyam {CONTACT.udyam}
              </p>
            </Reveal>

            <dl className="grid grid-cols-2 gap-4 self-start sm:gap-5">
              {[
                ["7", "products built", "inventory_2"],
                ["300+", "centres served", "groups"],
                ["100%", "in-house engineering", "engineering"],
                ["13 yrs", "on the keyboard", "schedule"],
              ].map(([stat, label, icon], i) => (
                <Reveal key={label} delay={70 * i}>
                  <div className="group h-full rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:border-brand-300 hover:shadow-lift sm:p-6">
                    <span className="icon-tile-soft h-11 w-11">
                      <span
                        aria-hidden="true"
                        className="material-symbols-rounded text-[22px]"
                      >
                        {icon}
                      </span>
                    </span>
                    <dt className="mt-4 bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                      {stat}
                    </dt>
                    <dd className="mt-1 text-sm text-slate-600">{label}</dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            Who you are actually dealing with
        ------------------------------------------------------------------- */}
        <section
          id="founder"
          className="relative scroll-mt-32 overflow-hidden border-b border-slate-200 bg-white"
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
                Founder · Frontend architect
              </p>
              <SocialLinks className="mt-4 justify-center lg:justify-start" />
            </Reveal>

            <Reveal delay={100} className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                Who we are
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
                The person you will be dealing with
              </h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                I am Santanu Sarkar, and Nexvora is mine. Thirteen years of
                building for the web, most of them at Webspiders working on
                React, Vue and Next.js front-ends over headless Drupal. That is
                the background everything here gets built on.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                There is no account manager in the middle. Whoever writes your
                quotation is the person writing the code, and the same person
                answers the phone when something breaks at an inconvenient hour.
                It is a small outfit, and that is rather the point.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                Check before you commit — the products already running on this
                page, and the profiles next to the photograph. Call the number
                and you will get me, not a queue.
              </p>

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
                    term: "Office",
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

        {/* ------------------------------------------------------------------
            Contact, with the office on a map
        ------------------------------------------------------------------- */}
        <section
          id="contact"
          className="scroll-mt-32 bg-slate-50 py-16 sm:py-20 2xl:py-24"
        >
          <div className="shell">
            <Reveal className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                Contact
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
                Get in touch
              </h2>
              <p className="mt-3 text-slate-600">
                Interested in one of our products, or want something built?
                Call, message on WhatsApp, or send a note — we reply within a
                working day.
              </p>
            </Reveal>

            <div className="mt-11 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,52%)] lg:gap-10">
              <div className="grid gap-4 self-start sm:grid-cols-2">
                {[
                  {
                    icon: "call",
                    term: "Phone",
                    value: CONTACT.phoneDisplay,
                    href: CONTACT.phoneHref,
                  },
                  {
                    icon: "chat",
                    term: "WhatsApp",
                    value: "Message us directly",
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
                    term: "Office",
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
      </main>

      {/* --------------------------------------------------------------------
          Footer
      --------------------------------------------------------------------- */}
      <footer className="border-t-4 border-brand-600 bg-white">
        <div className="shell grid gap-10 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <Image
              src="/logo-wordmark.png"
              alt="Nexvora Technologies"
              width={720}
              height={145}
              className="h-9 w-auto"
            />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600">
              Nexvora Technologies builds and runs its own software products,
              and takes on website, store, hosting and marketing work for small
              businesses that have been quoted too much elsewhere.
            </p>
            <SocialLinks className="mt-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              What we build
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {CAPABILITIES.map((c) => (
                <li
                  key={c.label}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Office
            </p>
            <address className="mt-4 space-y-1 text-sm not-italic text-slate-600">
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <div className="mt-4 space-y-2 text-sm">
              <a
                href={CONTACT.phoneHref}
                className="block font-semibold text-slate-700 transition hover:text-brand-600"
              >
                {CONTACT.phoneDisplay}
              </a>
              <a
                href={CONTACT.emailHref}
                className="block break-words text-slate-600 transition hover:text-brand-600"
              >
                {CONTACT.email}
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  CONTACT.mapQuery,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-brand-600 transition hover:text-brand-700"
              >
                Open in Google Maps
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50">
          <div className="shell flex flex-col gap-2 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {YEAR} Nexvora Technologies. All rights reserved.</p>
            <p>Udyam {CONTACT.udyam}</p>
          </div>
        </div>
      </footer>

      <BackToTop />
    </>
  );
}
