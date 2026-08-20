import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import {
  Hero,
  PromiseBand,
  PuttingOff,
  WhoIsItFor,
} from "@/components/sections";
import { CONTACT } from "@/lib/site";

// The home page carries the argument — you don't need a big budget, here is why
// your website never happened, here is who I work with — and then hands the
// reader to whichever page answers the question they actually arrived with.
//
// Nothing here is repeated from an inner route. Every full section lives on
// exactly one page, which is the whole point of splitting the site up: two
// pages competing on the same words help nobody, least of all in search.
const NEXT_STEPS = [
  {
    href: "/what-i-can-do",
    icon: "list_alt",
    title: "What I can do",
    body: "Everything I take on, said the way you would say it rather than in technical names.",
  },
  {
    href: "/how-it-works",
    icon: "route",
    title: "How it works",
    body: "The six steps from your first message to the day it goes live, and what you are promised at each one.",
  },
  {
    href: "/price",
    icon: "sell",
    title: "What it costs",
    body: "Real numbers. Small jobs from ₹999, packages from ₹7,999, and the running costs that are never inside either.",
  },
  {
    href: "/examples",
    icon: "photo_library",
    title: "Things I have built",
    body: "Screenshots of software running right now, with real people using it. Open them and look.",
  },
  {
    href: "/about",
    icon: "person",
    title: "Who you are dealing with",
    body: "One person in Kolkata, thirteen years on the keyboard, and no account manager in the middle.",
  },
  {
    href: "/faq",
    icon: "help",
    title: "Questions people ask",
    body: "Whose name the domain is in, how much to pay up front, and what happens if the work runs late.",
  },
];

export default function Home() {
  return (
    <>
      <Hero />
      <PuttingOff />
      <WhoIsItFor />

      {/* ------------------------------------------------------------------
          Where to go next. A visitor arrives with one question; this is the
          shortest route from that question to the page that answers it.
      ------------------------------------------------------------------- */}
      <section className="border-b border-slate-200 bg-white">
        <div className="shell py-16 sm:py-20 2xl:py-24">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
              Have a look around
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl 2xl:text-5xl">
              What did you come here to find out?
            </h2>
            <p className="mt-3 text-slate-600">
              Or skip all of it and just send me a message. That works too.
            </p>
          </Reveal>

          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {NEXT_STEPS.map((s, i) => (
              <Reveal key={s.href} delay={(i % 3) * 70} className="h-full">
                <Link
                  href={s.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:border-brand-300 hover:shadow-lift sm:p-7"
                >
                  <span className="icon-tile h-12 w-12">
                    <span
                      aria-hidden="true"
                      className="material-symbols-rounded text-[24px]"
                    >
                      {s.icon}
                    </span>
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600">
                    {s.body}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                    Read this
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <p className="mt-8 text-slate-600">
              Still not sure? Message me on{" "}
              <a
                href={CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-600 underline underline-offset-4 hover:text-brand-700"
              >
                WhatsApp
              </a>{" "}
              and describe the problem. Working out what fixes it is my part of
              the job, not yours.
            </p>
          </Reveal>
        </div>
      </section>

      <PromiseBand />
    </>
  );
}
