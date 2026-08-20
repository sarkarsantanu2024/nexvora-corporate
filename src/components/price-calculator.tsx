"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { CONTACT } from "@/lib/site";
import {
  NOT_INCLUDED,
  PACKAGES,
  PRICE_GROUPS,
  itemById,
  rupees,
} from "@/lib/pricing";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

/**
 * Work out your own price.
 *
 * The point is not the arithmetic — it is that a first-time buyer can find out
 * roughly what something costs without having to message a stranger and wait.
 * Most people will not send a first WhatsApp until they already know they can
 * afford the answer.
 *
 * The total is called an estimate wherever it appears, because it is one, and
 * the running costs that are never in it are listed inside the panel rather
 * than in a footnote. The button at the bottom hands the whole selection to
 * WhatsApp as a written list, which turns the calculator into an enquiry that
 * arrives already itemised.
 */
export function PriceCalculator() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [pkg, setPkg] = useState<string | null>(null);

  // Escape closes, and the page behind must not scroll while the panel is over
  // it — on a phone that is the difference between a panel and a mess.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Any button elsewhere on the page can open this by dispatching the event,
  // which keeps the panel a single instance rather than one per call to action.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("nexvora:open-calculator", onOpen);
    return () => window.removeEventListener("nexvora:open-calculator", onOpen);
  }, []);

  const chosenPackage = PACKAGES.find((p) => p.id === pkg) ?? null;

  const total = useMemo(() => {
    const items = picked.reduce(
      (sum, id) => sum + (itemById(id)?.price ?? 0),
      0,
    );
    return items + (chosenPackage?.price ?? 0);
  }, [picked, chosenPackage]);

  const count = picked.length + (chosenPackage ? 1 : 0);

  const toggle = (id: string) =>
    setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  const reset = () => {
    setPicked([]);
    setPkg(null);
  };

  // The enquiry, written out the way a person would write it.
  const whatsappHref = useMemo(() => {
    const lines: string[] = ["Hello, I worked out a price on your website."];
    if (chosenPackage) {
      lines.push(
        "",
        `Package: ${chosenPackage.name} — ${rupees(chosenPackage.price)}`,
      );
    }
    if (picked.length) {
      lines.push("", "Items:");
      for (const id of picked) {
        const item = itemById(id);
        if (item) lines.push(`• ${item.label} — ${rupees(item.price)}`);
      }
    }
    if (count) lines.push("", `Estimated total: ${rupees(total)}`);
    lines.push("", "Please tell me if this is right for what I need.");
    return `${CONTACT.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [chosenPackage, picked, total, count]);

  return (
    <>
      {/* The tab. Pinned to the right edge and set vertically so it takes
          almost no width from the page it sits over. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-2 rounded-l-2xl bg-gradient-to-b from-brand-600 to-violet-600 px-2.5 py-4 text-white shadow-lift ring-1 ring-inset ring-white/25 transition hover:brightness-110"
      >
        <span
          aria-hidden="true"
          className="material-symbols-rounded text-[22px]"
        >
          calculate
        </span>
        <span className="text-sm font-semibold [writing-mode:vertical-rl]">
          Work out my price
        </span>
        {count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-700">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close the price calculator"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/40 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Work out my price"
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 px-5 py-5 text-white sm:px-7">
              <div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Work out your own price
                </h2>
                <p className="mt-1 text-sm text-brand-100">
                  Tick what you need. Nothing here commits you to anything.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25 transition hover:bg-white/25"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {/* Packages first. They cost less than the same things ticked one
                  by one, so burying them below the list would be dishonest. */}
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Packages — cheaper than buying the pieces
              </p>
              <div className="mt-4 space-y-3">
                {PACKAGES.map((p) => {
                  const active = pkg === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPkg(active ? null : p.id)}
                      aria-pressed={active}
                      className={`w-full rounded-2xl border p-4 text-left transition sm:p-5 ${
                        active
                          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                          : "border-slate-200 bg-white hover:border-brand-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold tracking-tight">
                            {p.name}
                            {p.featured && (
                              <span className="ml-2 whitespace-nowrap rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Best value
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-600">
                            {p.tagline}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-bold tracking-tight">
                            {rupees(p.price)}
                          </p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm text-slate-700">
                        {p.includes.map((line) => (
                          <li key={line} className="flex gap-2">
                            <span
                              aria-hidden="true"
                              className="material-symbols-rounded mt-px shrink-0 text-[17px] text-brand-500"
                            >
                              check
                            </span>
                            <span className="leading-snug">{line}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <p className="mt-9 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Or pick jobs one by one
              </p>
              {PRICE_GROUPS.map((g) => (
                <div key={g.id} className="mt-6">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile-soft h-10 w-10">
                      <span
                        aria-hidden="true"
                        className="material-symbols-rounded text-[20px]"
                      >
                        {g.icon}
                      </span>
                    </span>
                    <h3 className="font-semibold tracking-tight">{g.title}</h3>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {g.items.map((item) => {
                      const active = picked.includes(item.id);
                      return (
                        <li key={item.id}>
                          <label
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                              active
                                ? "border-brand-500 bg-brand-50"
                                : "border-transparent hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggle(item.id)}
                              className="h-4 w-4 shrink-0 accent-brand-600"
                            />
                            <span className="min-w-0 flex-1 text-sm leading-snug text-slate-700">
                              {item.label}
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                              {rupees(item.price)}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {/* The part nobody else prints. */}
              <div className="mt-9 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="flex items-center gap-2 font-semibold tracking-tight text-amber-900">
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded text-[22px]"
                  >
                    info
                  </span>
                  What this total does not include
                </p>
                <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
                  These are running costs, paid to the provider in your own
                  name. I do not add anything on top of them, and I will tell
                  you what each one costs before you commit to it.
                </p>
                <ul className="mt-4 space-y-3">
                  {NOT_INCLUDED.map((row) => (
                    <li key={row.label} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="material-symbols-rounded shrink-0 text-[20px] text-amber-700"
                      >
                        {row.icon}
                      </span>
                      <span className="text-sm leading-snug text-amber-900">
                        <span className="font-semibold">{row.label}</span> —{" "}
                        {row.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-slate-600">
                This is an estimate, not a quotation. Something unusual about
                your job could move it either way. And if I think you are about
                to buy something you do not need, I will say so before you pay
                for it.
              </p>
            </div>

            {/* Total, pinned so it never scrolls out of sight. */}
            <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-8px_24px_-18px_rgba(10,17,40,0.5)] sm:px-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Estimated total
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    {rupees(total)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {count === 0
                      ? "Nothing selected yet"
                      : `${count} item${count > 1 ? "s" : ""} selected · domain and hosting extra`}
                  </p>
                </div>
                {count > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="pb-1 text-sm font-medium text-slate-500 underline underline-offset-4 transition hover:text-brand-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:brightness-105"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d={WHATSAPP_PATH} />
                </svg>
                {count > 0
                  ? "Send this list to me on WhatsApp"
                  : "Just message me instead"}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}