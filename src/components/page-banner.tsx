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
  /**
   * Set on /price itself. The second button sends people to the price page,
   * which is nothing but a step backwards for someone already reading it.
   */
  onPricePage?: boolean;
};

/**
 * The banner at the top of every inner page.
 *
 * It carries the page's h1, so the section beneath it keeps its own heading at
 * h2 and the document has exactly one h1 per route.
 *
 * Deliberately built as a different object from the home hero. The home page is
 * a tall, pale, two-column split with a framed photograph and figures pinned to
 * it — it is the shop window and it is allowed the space. An inner page is
 * somewhere you arrived on purpose, so this is a short dark band: the words on
 * a single wide column, the photograph bled into the right edge behind them
 * rather than framed beside them, and a coloured rule closing the band off.
 * A reader can tell which kind of page they are on before reading a word, and
 * the fold arrives sooner so the actual content of the page is visible.
 *
 * The photograph is decorative here — the same subject is described in the
 * heading and intro beside it — so it is marked aria-hidden rather than
 * repeating itself to a screen reader. Pages with no photograph get the icon
 * motif instead, ghosted into the same corner.
 */
export function PageBanner({
  eyebrow,
  title,
  intro,
  icon,
  motif,
  image,
  onPricePage,
}: Banner) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      {/* The photograph, bled into the right edge and faded into the band
          rather than sitting in a frame of its own. Hidden below lg, where
          there is no width to bleed into. */}
      {image ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] lg:block"
        >
          <Image
            src={image.src}
            alt=""
            fill
            sizes="52vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/50" />
        </div>
      ) : null}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark [mask-image:linear-gradient(to_right,black,transparent_70%)]" />
        <div className="animate-drift absolute -left-32 -top-40 h-[24rem] w-[24rem] rounded-full bg-brand-500/30 blur-[110px]" />
        <div className="animate-drift absolute -bottom-32 left-1/3 h-[20rem] w-[20rem] rounded-full bg-violet-500/20 blur-[110px] [animation-delay:-6s]" />
      </div>

      <div className="shell relative py-11 sm:py-14 lg:py-16">
        <Reveal className="max-w-3xl">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 py-1.5 pl-2 pr-4 text-[0.7rem] font-semibold uppercase tracking-widest text-brand-100 backdrop-blur-sm sm:text-xs">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15">
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[16px] text-white"
              >
                {icon}
              </span>
            </span>
            {eyebrow}
          </p>

          {/* Smaller than the home h1 on purpose: this one introduces a
              section, it does not have to sell the whole business. */}
          <h1 className="mt-4 text-[clamp(1.7rem,3.6vw,3rem)] font-bold leading-[1.12] tracking-tight">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-[clamp(0.95rem,1.15vw,1.1rem)] leading-relaxed text-slate-300">
            {intro}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
              Tell me what you need
            </a>
            {onPricePage ? null : (
              <Link
                href="/price"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10"
              >
                See what it costs
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </Reveal>

        {/* No photograph for this page: the icon motif takes the same corner,
            ghosted back so it stays behind the words. */}
        {image ? null : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 hidden items-end gap-3 pr-8 lg:flex 2xl:pr-14"
          >
            {motif.slice(0, 5).map((m, i) => (
              <span
                key={m}
                style={{ animationDelay: `${i * -1.3}s` }}
                className="animate-float-slow grid h-16 w-16 translate-y-4 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/40 backdrop-blur-sm"
              >
                <span className="material-symbols-rounded text-[26px]">{m}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Closes the band off and picks up the logo's blue-into-violet. */}
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-brand-500 via-violet-500 to-brand-500"
      />
    </section>
  );
}
