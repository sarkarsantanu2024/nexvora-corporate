"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SocialLinks } from "@/components/social-links";
import { CONTACT, NAV_LINKS } from "@/lib/site";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // The bar tightens and gains a shadow once the reader leaves the top, which
  // is the cheapest way to make a sticky header feel deliberate rather than
  // simply glued on.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navigating away must close the mobile menu, or the new page opens with
  // the old menu still covering it.
  useEffect(() => setOpen(false), [pathname]);

  // A menu left open behind a resize into desktop layout is a classic
  // mobile-nav bug; close it when the viewport crosses the breakpoint.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const close = () => setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, [open]);

  return (
    <header className="sticky top-0 z-40">
      {/* Contact bar in brand colour rather than near-black: it has to feel
          approachable, since the phone number on it is the main call. */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-violet-600 text-brand-100">
        <div className="shell relative flex h-11 items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-sm xl:gap-7">
            <a
              href={CONTACT.phoneHref}
              className="group flex items-center gap-2 font-semibold text-white transition hover:text-white"
            >
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[19px] text-white/80"
              >
                call
              </span>
              <span>{CONTACT.phoneDisplay}</span>
            </a>
            {/* All three are spelled out. An icon alone cannot say a phone
                number, an address or an email address — and this bar is where
                someone checks whether the business is near them before they
                read anything else. They drop out by width, not by preference:
                the email below sm, the address below lg. */}
            <a
              href={CONTACT.emailHref}
              className="hidden items-center gap-2 transition hover:text-white sm:flex"
            >
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[19px] text-white/80"
              >
                mail
              </span>
              <span>{CONTACT.email}</span>
            </a>
            <span className="hidden items-center gap-2 lg:flex">
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[19px] text-white/80"
              >
                location_on
              </span>
              <span>{CONTACT.location}</span>
            </span>
          </div>
          <SocialLinks tone="dark" />
        </div>
      </div>

      {/* Main bar */}
      <div
        className={`border-b bg-white/90 backdrop-blur transition-all duration-300 ${
          scrolled
            ? "border-slate-200 shadow-[0_10px_30px_-22px_rgba(10,17,40,0.55)]"
            : "border-transparent"
        }`}
      >
        <nav
          className={`shell flex items-center justify-between gap-3 transition-all duration-300 sm:gap-6 ${
            scrolled ? "h-16 sm:h-[68px]" : "h-[68px] sm:h-20"
          }`}
        >
          <Link
            href="/"
            aria-label="Nexvora Technologies — home"
            className="shrink-0"
          >
            <Image
              src="/logo-wordmark.png"
              alt="Nexvora Technologies"
              width={720}
              height={145}
              priority
              // max-w keeps the wordmark from squeezing the two contact
              // buttons off a 320px screen; it is the widest thing in the bar
              // and the only one that can afford to give ground.
              className={`w-auto max-w-[40vw] transition-all duration-300 sm:max-w-none ${
                scrolled ? "h-6 sm:h-8" : "h-7 sm:h-10"
              }`}
            />
          </Link>

          <div className="hidden items-center gap-8 lg:flex xl:gap-10">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={`nav-link ${pathname === l.href ? "is-current" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {/* Nearly every enquiry arrives on one of these two, so they are
                the only buttons in the bar. The handset and the WhatsApp mark
                are the two symbols an Indian phone user reads without being
                told, so the words come off and the tooltip carries them for
                anyone who hesitates. The aria-label stays regardless: the
                tooltip is a pseudo-element and a touch screen never hovers. */}
            <a
              href={CONTACT.phoneHref}
              aria-label={`Call ${CONTACT.phoneDisplay}`}
              data-tip={`Call ${CONTACT.phoneDisplay}`}
              className="tip grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lift ring-1 ring-inset ring-white/25 transition duration-300 hover:brightness-110"
            >
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[22px]"
              >
                call
              </span>
            </a>
            <a
              href={CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message us on WhatsApp"
              data-tip="Message us on WhatsApp"
              className="tip grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white shadow-lift ring-1 ring-inset ring-white/30 transition duration-300 hover:brightness-105"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-[21px] w-[21px] shrink-0"
                fill="currentColor"
              >
                <path d={WHATSAPP_PATH} />
              </svg>
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-300 text-slate-700 transition hover:border-brand-400 hover:text-brand-700 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <div
            id="mobile-nav"
            className="border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="shell flex flex-col py-2">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className={`group flex items-center justify-between border-b border-slate-100 py-3.5 text-base font-medium last:border-0 ${
                    pathname === l.href ? "text-brand-700" : "text-slate-700"
                  }`}
                >
                  {l.label}
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded text-[20px] text-slate-400"
                  >
                    chevron_right
                  </span>
                </Link>
              ))}
              <a
                href={CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="my-3 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d={WHATSAPP_PATH} />
                </svg>
                Message us on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
