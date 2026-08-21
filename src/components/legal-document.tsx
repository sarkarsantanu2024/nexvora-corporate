import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { CONTACT } from "@/lib/site";
import { LEGAL_UPDATED, type LegalDoc } from "@/lib/legal";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

/** "How long I keep it" -> "how-long-i-keep-it", for the jump links. */
function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * The body of a legal page.
 *
 * One component for all five, because the thing that makes these pages
 * trustworthy is that they look like each other and like the rest of the site
 * — not like a document pasted in from somewhere else.
 *
 * Two decisions worth keeping. The reading column is capped at about 68
 * characters, which is narrower than the marketing bands on purpose: this is
 * the only text on the site somebody reads top to bottom. And there is a
 * contents list at the top, because the honest use of a page like this is
 * jumping straight to the one paragraph that is worrying you.
 */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <section className="band band-plain">
        <div className="shell grid gap-10 py-14 sm:py-16 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-16 2xl:py-20">
          {/* Contents, and the date. Sticky on a wide screen so the trail back
              to another section never scrolls away. */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              On this page
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {doc.sections.map((s) => (
                <li key={s.heading}>
                  <a
                    href={`#${slugify(s.heading)}`}
                    className="text-slate-500 transition hover:text-brand-700"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
              Last changed {LEGAL_UPDATED}. Written in plain English on purpose
              — if any of it is unclear, ask me and I will explain it.
            </p>
          </aside>

          <div className="min-w-0 max-w-[68ch]">
            {doc.sections.map((section, i) => (
              // The rule that separates one section from the next lives on the
              // wrapper, keyed off the index, rather than on a :first-child
              // selector inside it — every section is the only child of its
              // own Reveal, so a first-child rule would match all of them and
              // the headings would sit straight on the paragraph above.
              <Reveal
                key={section.heading}
                delay={i === 0 ? 0 : 60}
                className={
                  i === 0 ? "" : "mt-14 border-t border-slate-200 pt-12"
                }
              >
                <section
                  id={slugify(section.heading)}
                  className="scroll-mt-28"
                >
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {section.heading}
                  </h2>

                  {section.blocks.map((block, j) => {
                    if ("p" in block) {
                      return (
                        <p
                          key={j}
                          className="mt-4 leading-relaxed text-slate-600"
                        >
                          {block.p}
                        </p>
                      );
                    }

                    if ("callout" in block) {
                      return (
                        <p
                          key={j}
                          className="mt-5 rounded-2xl border-l-4 border-brand-500 bg-brand-50/60 px-5 py-4 font-medium text-slate-800"
                        >
                          {block.callout}
                        </p>
                      );
                    }

                    return (
                      <ul key={j} className="mt-4 space-y-3 text-slate-600">
                        {block.list.map((line) => (
                          <li key={line} className="flex gap-3 leading-relaxed">
                            <span
                              aria-hidden="true"
                              className="material-symbols-rounded mt-0.5 shrink-0 text-[20px] text-brand-500"
                            >
                              chevron_right
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })}
                </section>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nobody finishes a page like this feeling reassured. The way to fix
          that is a person to ask, not another paragraph. */}
      <section className="band band-tint">
        <div className="shell py-14 sm:py-16">
          <Reveal className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Anything on this page you are not happy with?
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Ask me before you commit to anything. Most of it can be
              discussed, and I would far rather explain it now than have you
              agree to something you did not understand.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:brightness-105"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0"
                  fill="currentColor"
                >
                  <path d={WHATSAPP_PATH} />
                </svg>
                Ask me on WhatsApp
              </a>
              <a
                href={CONTACT.emailHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
              >
                {CONTACT.email}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
