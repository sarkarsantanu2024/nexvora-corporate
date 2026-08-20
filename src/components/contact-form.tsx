"use client";

import { useMemo, useState } from "react";
import { CONTACT } from "@/lib/site";
import { rupees } from "@/lib/pricing";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

const NEEDS = [
  "A website for my business",
  "An online shop",
  "Google / Facebook / YouTube setup",
  "Logo, visiting card or printing",
  "Social media posts",
  "Software for my business",
  "A small job (poster, bio-data, Excel, presentation)",
  "I am not sure yet",
];

const BUDGETS = [
  "Under ₹5,000",
  `${rupees(5000)} – ${rupees(15000)}`,
  `${rupees(15000)} – ${rupees(30000)}`,
  "Over ₹30,000",
  "I don't know yet — tell me",
];

const field =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const label = "block text-sm font-semibold tracking-tight text-slate-800";

/**
 * The enquiry form.
 *
 * There is no server behind this site, and adding one just to receive a form
 * post would be a lie about how the business runs — every real enquiry arrives
 * on WhatsApp anyway. So the form writes the message for you and hands it to
 * WhatsApp, which means nothing is submitted to anybody, no data leaves the
 * browser until the customer presses the button, and the enquiry lands in the
 * one inbox that is actually watched.
 *
 * It exists because a blank "message me" is intimidating. Given fields, a
 * first-time buyer knows what I need to hear from them.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [place, setPlace] = useState("");
  const [need, setNeed] = useState("");
  const [budget, setBudget] = useState("");
  const [detail, setDetail] = useState("");

  const message = useMemo(() => {
    const lines = ["Hello, I would like to enquire about my business."];
    if (name) lines.push(`Name: ${name}`);
    if (business) lines.push(`Business: ${business}`);
    if (place) lines.push(`Place: ${place}`);
    if (need) lines.push(`What I need: ${need}`);
    if (budget) lines.push(`Budget: ${budget}`);
    if (detail) lines.push("", detail);
    return lines.join("\n");
  }, [name, business, place, need, budget, detail]);

  const whatsappHref = `${CONTACT.whatsappHref}?text=${encodeURIComponent(message)}`;
  const mailHref = `${CONTACT.emailHref}?subject=${encodeURIComponent(
    "Enquiry from nexvoratechnologies.co.in",
  )}&body=${encodeURIComponent(message)}`;

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="shell grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 2xl:py-24">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Tell me about it
          </p>
          <h2 className="mt-3 text-[clamp(1.7rem,3.4vw,2.6rem)] font-bold leading-tight tracking-tight">
            Fill this in and it writes the message for you
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Nothing here is sent anywhere on its own. When you press the button
            it opens WhatsApp with the message already written, and you can read
            it and change it before you send it. Every box is optional.
          </p>

          <form
            className="mt-9 grid gap-5 sm:grid-cols-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <div>
              <label htmlFor="cf-name" className={label}>
                Your name
              </label>
              <input
                id="cf-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Santanu Sarkar"
                className={field}
              />
            </div>

            <div>
              <label htmlFor="cf-business" className={label}>
                Your business
              </label>
              <input
                id="cf-business"
                type="text"
                autoComplete="organization"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Sarkar Tailors"
                className={field}
              />
            </div>

            <div>
              <label htmlFor="cf-place" className={label}>
                Town or city
              </label>
              <input
                id="cf-place"
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Barrackpore, Kolkata"
                className={field}
              />
            </div>

            <div>
              <label htmlFor="cf-budget" className={label}>
                Budget, if you have one in mind
              </label>
              <select
                id="cf-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={field}
              >
                <option value="">Prefer not to say</option>
                {BUDGETS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cf-need" className={label}>
                What do you need?
              </label>
              <select
                id="cf-need"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                className={field}
              >
                <option value="">Choose one, or leave it blank</option>
                {NEEDS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cf-detail" className={label}>
                Anything else you want to tell me
              </label>
              <textarea
                id="cf-detail"
                rows={5}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="I have a sweet shop and want people to see my items and order on WhatsApp."
                className={`${field} resize-y`}
              />
              <p className="mt-2 text-sm text-slate-500">
                In Bengali, Hindi or English — whichever is easiest for you.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:brightness-105"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0"
                  fill="currentColor"
                >
                  <path d={WHATSAPP_PATH} />
                </svg>
                Send this on WhatsApp
              </a>
              <a
                href={mailHref}
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[20px]"
                >
                  mail
                </span>
                Send it by email instead
              </a>
            </div>
          </form>
        </div>

        {/* What the customer is about to send, shown before they send it. */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              This is what will be sent
            </p>
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-4 font-sans text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
              {message}
            </pre>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              You can edit every word of it in WhatsApp before it reaches me. I
              reply the same working day.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
