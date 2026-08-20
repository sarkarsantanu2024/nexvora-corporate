"use client";

import { useEffect, useState } from "react";
import { CONTACT } from "@/lib/site";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

/**
 * WhatsApp and call, always within reach.
 *
 * Nearly every enquiry arrives on one of these two, so neither is allowed to
 * scroll away. On a phone they sit as a full-width bar under the thumb, always
 * visible. From the small breakpoint up they float at the bottom left, but only
 * once the reader has left the hero — up there the hero already carries both
 * calls, and a floating pair would sit on top of them.
 */
export function ContactDock() {
  const [past, setPast] = useState(false);

  useEffect(() => {
    // Passive: this only reads scrollY and must never hold up the scroll.
    const onScroll = () => setPast(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Keeps the last line of the footer clear of the mobile bar. */}
      <div aria-hidden="true" className="h-[4.75rem] sm:hidden" />

      <div
        className={`fixed inset-x-0 bottom-0 z-40 flex gap-px border-t border-slate-200 bg-slate-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(10,17,40,0.5)] transition duration-300 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:flex-col sm:items-start sm:gap-3 sm:border-0 sm:bg-transparent sm:pb-0 sm:shadow-none ${
          past
            ? "sm:translate-y-0 sm:opacity-100"
            : "sm:pointer-events-none sm:translate-y-4 sm:opacity-0"
        }`}
      >
        {/* Two shapes for two situations. On a phone this is a labelled bar
            under the thumb — there is no hover on a touch screen, so a bare
            icon there would have nothing to fall back on. From sm up, where a
            cursor exists, each one becomes a plain round button and the words
            move into the tooltip. */}
        <a
          href={CONTACT.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message me on WhatsApp"
          data-tip="WhatsApp me"
          className="tip tip-right flex flex-1 items-center justify-center gap-2.5 bg-[#25D366] py-4 text-[0.95rem] font-semibold text-white transition sm:h-14 sm:w-14 sm:flex-none sm:gap-0 sm:rounded-full sm:py-0 sm:shadow-lift sm:ring-1 sm:ring-inset sm:ring-white/30 sm:hover:brightness-105"
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center sm:h-7 sm:w-7">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[22px] w-[22px] sm:h-7 sm:w-7"
              fill="currentColor"
            >
              <path d={WHATSAPP_PATH} />
            </svg>
          </span>
          <span className="sm:hidden">WhatsApp me</span>
        </a>

        <a
          href={CONTACT.phoneHref}
          aria-label={`Call ${CONTACT.phoneDisplay}`}
          data-tip={CONTACT.phoneDisplay}
          className="tip tip-right flex flex-1 items-center justify-center gap-2.5 bg-gradient-to-br from-brand-600 to-violet-600 py-4 text-[0.95rem] font-semibold text-white transition sm:h-14 sm:w-14 sm:flex-none sm:gap-0 sm:rounded-full sm:py-0 sm:shadow-lift sm:ring-1 sm:ring-inset sm:ring-white/25 sm:hover:brightness-110"
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center sm:h-7 sm:w-7">
            <span
              aria-hidden="true"
              className="material-symbols-rounded text-[22px] sm:text-[26px]"
            >
              call
            </span>
          </span>
          <span className="sm:hidden">Call me</span>
        </a>
      </div>
    </>
  );
}
