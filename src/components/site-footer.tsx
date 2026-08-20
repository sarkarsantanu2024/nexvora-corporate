import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SocialLinks } from "@/components/social-links";
import { CAPABILITIES, CONTACT, NAV_LINKS } from "@/lib/site";

const YEAR = 2026;

export function SiteFooter() {
  return (
  <footer className="relative overflow-hidden border-t-4 border-brand-500 bg-ink text-slate-300">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="absolute -left-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-brand-600/25 blur-[130px]" />
      <div className="absolute -right-24 top-0 h-[20rem] w-[20rem] rounded-full bg-violet-600/20 blur-[130px]" />
    </div>

    {/* The reason the whole business exists, on every page of the site. */}
    <div className="relative border-b border-white/10">
      <div className="shell py-10 sm:py-12">
        <p className="max-w-4xl text-[clamp(1.15rem,2.4vw,1.75rem)] font-semibold leading-snug tracking-tight text-white">
          Every Indian business — small or big — deserves to be found online.
          Price should never be the thing that stops it.
        </p>
      </div>
    </div>

    <div className="shell relative grid gap-10 py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <div>
        <Image
          src="/logo-wordmark-white.png"
          alt="Nexvora Technologies"
          width={720}
          height={145}
          className="h-9 w-auto"
        />
        <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
          You don&apos;t need to understand technology. You just need to
          tell me what your business needs. I will help you choose what you
          actually need, tell you the price before we start, build it, keep
          you updated, and get it online.
        </p>
        <SocialLinks className="mt-5" tone="footer" />
      </div>

      {/* Every route, in one place. A crawler that only ever sees the footer
          should still be able to reach the whole site from it. */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
          Pages
        </p>
        <ul className="mt-4 space-y-2.5 text-sm">
          <li>
            <Link
              href="/"
              className="text-slate-400 transition hover:text-white"
            >
              Home
            </Link>
          </li>
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-slate-400 transition hover:text-white"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
          What I build
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {CAPABILITIES.map((c) => (
            <li
              key={c.label}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:border-brand-400 hover:bg-white/10 hover:text-white"
            >
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
          Office
        </p>
        <address className="mt-4 space-y-1 text-sm not-italic text-slate-400">
          {CONTACT.addressLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
        <div className="mt-4 space-y-2 text-sm">
          <a
            href={CONTACT.phoneHref}
            className="block font-semibold text-white transition hover:text-brand-300"
          >
            {CONTACT.phoneDisplay}
          </a>
          <a
            href={CONTACT.emailHref}
            className="block break-words text-slate-400 transition hover:text-brand-300"
          >
            {CONTACT.email}
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              CONTACT.mapQuery,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-brand-300 transition hover:text-white"
          >
            Open in Google Maps
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>

    <div className="relative border-t border-white/10 bg-black/25">
      <div className="shell flex flex-col gap-2 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {YEAR} Nexvora Technologies. All rights reserved.</p>
        <p>Udyam {CONTACT.udyam}</p>
      </div>
    </div>
  </footer>
  );
}
