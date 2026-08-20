import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { CONTACT } from "@/lib/site";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

export type Banner = {
  eyebrow: string;
  title: string;
  intro: string;
  /** Main motif, and the smaller icons that orbit it. Material Symbols names. */
  icon: string;
  motif: string[];
  /** A real photograph or screenshot, where one exists for this page. */
  image?: { src: string; alt: string };
};

/**
 * The banner at the top of every inner page.
 *
 * It carries the page's h1, so the section beneath it keeps its own heading at
 * h2 and the document has exactly one h1 per route.
 *
 * The artwork is built from the same icon set the rest of the site uses rather
 * than from a photograph. That is deliberate: there are no honest photographs
 * of "a pricing page", and buying stock images of models pretending to be
 * Indian shopkeepers would undo the thing this site is trying to be. Pages
 * that do have something real to show — a face, a screenshot — pass `image`
 * and get that instead.
 *
 * Sizing is fluid rather than stepped: the heading uses clamp() so it scales
 * continuously from a 320px phone to a 4K monitor instead of jumping at
 * breakpoints, and the motif is hidden below `lg` where the text needs the
 * full width more than the decoration does.
 */
export function PageBanner({ eyebrow, title, intro, icon, motif, image }: Banner) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(45rem_28rem_at_50%_0%,black,transparent)]" />
        <div className="animate-drift absolute -left-40 -top-48 h-[26rem] w-[26rem] rounded-full bg-brand-300/30 blur-[110px]" />
        <div className="animate-drift absolute -right-28 -top-10 h-[22rem] w-[22rem] rounded-full bg-violet-400/20 blur-[110px] [animation-delay:-6s]" />
      </div>

      <div className="shell relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,38%)] lg:gap-14 lg:py-20 2xl:py-24">
        <Reveal className="min-w-0">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-brand-100 bg-white py-1.5 pl-2 pr-4 text-[0.7rem] font-semibold uppercase tracking-widest text-brand-700 shadow-sm sm:text-xs">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50">
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[16px] text-brand-600"
              >
                {icon}
              </span>
            </span>
            {eyebrow}
          </p>

          {/* clamp() rather than breakpoints: no width between 320px and 4K
              gets a heading that is too big for its line or too small for the
              column it sits in. */}
          <h1 className="mt-5 text-[clamp(1.9rem,5.2vw,4rem)] font-bold leading-[1.1] tracking-tight">
            {title}
          </h1>

          <p className="mt-5 max-w-2xl text-[clamp(0.98rem,1.4vw,1.2rem)] leading-relaxed text-slate-600">
            {intro}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:brightness-105"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 shrink-0"
                fill="currentColor"
              >
                <path d={WHATSAPP_PATH} />
              </svg>
              Tell me what you need
            </a>
            <Link
              href="/price"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
            >
              See what it costs
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {/* A real photograph earns its place at every width. The decorative
            icon motif does not, so it stands down below lg where the words
            matter more and vertical space is expensive. */}
        <Reveal delay={120} className={image ? "min-w-0" : "hidden lg:block"}>
          {image ? (
            <div className="relative overflow-hidden rounded-[1.75rem] bg-white p-2 shadow-lift ring-1 ring-slate-200">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.4rem] sm:aspect-[2/1] lg:aspect-[4/3]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="relative mx-auto aspect-square w-full max-w-[22rem]"
            >
              {/* One large tile for the page's own subject, with the related
                  ideas orbiting it. */}
              <div className="animate-float-slow absolute inset-[18%] grid place-items-center rounded-[2rem] bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lift ring-1 ring-inset ring-white/25">
                <span className="material-symbols-rounded text-[clamp(3rem,5vw,4.5rem)]">
                  {icon}
                </span>
              </div>

              {motif.slice(0, 6).map((m, i) => {
                // Evenly spaced around the centre tile, starting at the top.
                const angle = (i / Math.min(motif.length, 6)) * 2 * Math.PI - Math.PI / 2;
                const left = 50 + 42 * Math.cos(angle);
                const top = 50 + 42 * Math.sin(angle);
                return (
                  <span
                    key={m}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      animationDelay: `${i * -1.3}s`,
                    }}
                    className="animate-float-slow absolute grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-slate-200 bg-white text-brand-600 shadow-sm"
                  >
                    <span className="material-symbols-rounded text-[24px]">
                      {m}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
