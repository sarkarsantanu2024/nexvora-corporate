import Image from "next/image";
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { SERVICES } from "@/lib/services";

const YEAR = 2026;

// The shorthand people search for and scan for. Kept in the hero so nobody
// has to read three paragraphs to find out whether we do the thing they want.
const CAPABILITIES = [
  "Website",
  "Web app",
  "SaaS",
  "PWA",
  "Database",
  "AI",
  "Web design",
  "Graphic design",
  "Domain and hosting",
  "Digital marketing",
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <nav className="shell flex items-center justify-between py-4">
          <a href="/" aria-label="Nexvora Technologies — home">
            <Image
              src="/logo-wordmark.png"
              alt="Nexvora Technologies"
              width={720}
              height={145}
              priority
              className="h-8 w-auto sm:h-9"
            />
          </a>
          <div className="hidden gap-8 text-sm font-medium text-slate-600 sm:flex lg:gap-10">
            <a href="#products" className="hover:text-brand-600">
              Products
            </a>
            <a href="#services" className="hover:text-brand-600">
              Services
            </a>
            <a href="#about" className="hover:text-brand-600">
              About
            </a>
            <a href="#contact" className="hover:text-brand-600">
              Contact
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
          <div className="shell py-20 sm:py-28 2xl:py-36">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-600">
              Nexvora Technologies
            </p>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl 2xl:max-w-5xl 2xl:text-7xl">
              Software that does the{" "}
              <span className="text-brand-600">unglamorous work</span> for
              growing businesses.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 2xl:max-w-3xl 2xl:text-xl">
              We build focused products for Indian businesses — social media
              automation, school management, health records and more. Each one
              solves a job somebody was doing by hand.
            </p>
            {/* The two calls to action the whole page is built around: our
                flagship product, and everything else we build to order. */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="https://eduflow.nexvoratechnologies.co.in"
                className="group inline-flex items-center gap-3 rounded-xl bg-brand-600 px-6 py-4 text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[26px]"
                >
                  school
                </span>
                <span className="text-left">
                  <span className="block text-base font-semibold leading-tight">
                    EduFlow
                  </span>
                  <span className="block text-sm text-brand-100">
                    Student management software
                  </span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#contact"
                className="group inline-flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-6 py-4 text-slate-800 transition hover:border-brand-300 hover:shadow-md"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[26px] text-brand-600"
                >
                  handyman
                </span>
                <span className="text-left">
                  <span className="block text-base font-semibold leading-tight">
                    Need custom software?
                  </span>
                  <span className="block text-sm text-slate-500">
                    Tell us what you are stuck with
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </a>
            </div>

            {/* What we actually build, said plainly — people scan this line
                before they read anything else on the page. */}
            <ul className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-medium text-slate-700">
              {CAPABILITIES.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 backdrop-blur transition hover:border-brand-300 hover:text-brand-700"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="shell scroll-mt-20 py-20 2xl:py-28">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Our products
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Each product runs independently, with its own login and its own
            data. Nothing is shared between them.
          </p>

          <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {PRODUCTS.map((p) => {
              const card = (
                <>
                  <div
                    className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${p.accent}`}
                  />
                  <div className="mt-5 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {p.name}
                    </h3>
                    {p.href ? (
                      <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-brand-600" />
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-brand-600">
                    {p.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {p.blurb}
                  </p>
                </>
              );

              const base =
                "group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition";

              return p.href ? (
                <a
                  key={p.name}
                  href={p.href}
                  className={`${base} hover:-translate-y-1 hover:border-brand-300 hover:shadow-md`}
                >
                  {card}
                </a>
              ) : (
                <div key={p.name} className={`${base} opacity-75`}>
                  {card}
                </div>
              );
            })}
          </div>
        </section>

        {/* Services */}
        <section
          id="services"
          className="scroll-mt-20 border-y border-slate-200 bg-slate-50"
        >
          <div className="shell py-20 2xl:py-28">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                What we take on for clients
              </h2>
              <p className="mt-3 text-slate-600">
                Alongside our own products we do a limited amount of build work
                for other companies. This is the sort we say yes to — and the
                same team that ships our products does it.
              </p>
            </div>

            <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s, i) => (
                <div
                  key={s.title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-md 2xl:p-8"
                >
                  <span className="pointer-events-none absolute right-5 top-4 text-4xl font-bold tabular-nums text-slate-100 transition group-hover:text-brand-50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <span
                      aria-hidden="true"
                      className="material-symbols-rounded text-[26px]"
                    >
                      {s.icon}
                    </span>
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-20 border-b border-slate-200">
          <div className="shell grid gap-12 py-20 lg:grid-cols-2 lg:gap-16 2xl:py-28">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                About Nexvora
              </h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                Nexvora Technologies is a product company based in West Bengal,
                India. Our own software comes first — every product we launch
                keeps getting maintained, supported and improved long after
                launch — and we take on a limited amount of client work
                alongside it.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                Our customers are schools, coaching centres, clinics, print
                shops and local businesses. The common thread is simple: they
                have real work to do and no appetite for complicated software.
              </p>
              <p className="mt-8 text-sm text-slate-500">
                Registered MSME · Udyam UDYAM-WB-10-021416
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-6 self-start">
              {[
                ["7", "products built"],
                ["300+", "centres served"],
                ["100%", "in-house engineering"],
                ["India", "built and hosted for"],
              ].map(([stat, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <dt className="text-3xl font-bold tracking-tight text-brand-600">
                    {stat}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-600">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Who you are actually dealing with. A company page with no face on
            it reads as a shell, so this one names the person and shows how to
            check him out elsewhere. */}
        <section
          id="founder"
          className="scroll-mt-20 border-b border-slate-200 bg-slate-50"
        >
          <div className="shell grid items-start gap-12 py-20 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16 2xl:py-28">
            <div className="max-w-[320px]">
              <Image
                src="/santanu-sarkar.jpg"
                alt="Santanu Sarkar, founder of Nexvora Technologies"
                width={640}
                height={640}
                className="w-full rounded-2xl border border-slate-200 object-cover shadow-sm"
              />
              <p className="mt-5 text-lg font-semibold tracking-tight">
                Santanu Sarkar
              </p>
              <p className="text-sm text-slate-600">
                Founder · Frontend architect
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {[
                  {
                    label: "Portfolio",
                    href: "https://santanu-portfolio-frontend.vercel.app/",
                  },
                  {
                    label: "LinkedIn",
                    href: "https://www.linkedin.com/in/santanusarkar86/",
                  },
                  {
                    label: "GitHub",
                    href: "https://github.com/sarkarsantanu2024",
                  },
                ].map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
                Come and check before you commit — the portfolio, the GitHub
                account, the products already running on this page. Call the
                number below and you will get me, not a queue.
              </p>

              <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  {
                    icon: "call",
                    term: "Phone and WhatsApp",
                    value: "+91 98042 43159",
                    href: "https://wa.me/919804243159",
                  },
                  {
                    icon: "mail",
                    term: "Email",
                    value: "sarkarsantanu69@gmail.com",
                    href: "mailto:sarkarsantanu69@gmail.com",
                  },
                  {
                    icon: "location_on",
                    term: "Based in",
                    value: "Kolkata, West Bengal, India",
                    href: null,
                  },
                  {
                    icon: "verified_user",
                    term: "Registered MSME",
                    value: "Udyam UDYAM-WB-10-021416",
                    href: null,
                  },
                ].map((row) => (
                  <div key={row.term} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="material-symbols-rounded mt-0.5 text-[22px] text-brand-600"
                    >
                      {row.icon}
                    </span>
                    <div>
                      <dt className="text-sm font-semibold">{row.term}</dt>
                      <dd className="mt-0.5 break-all text-sm text-slate-600">
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
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="shell scroll-mt-20 py-20 2xl:py-28">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get in touch
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Interested in one of our products, or want something built? Send us
            a note and we will reply within a working day.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <a
              href="mailto:sarkarsantanu69@gmail.com"
              className="flex items-start gap-3 rounded-2xl border border-slate-200 p-5 transition hover:border-brand-300"
            >
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span>
                <span className="block text-sm font-semibold">Email</span>
                <span className="mt-0.5 block break-all text-sm text-slate-600">
                  sarkarsantanu69@gmail.com
                </span>
              </span>
            </a>
            <a
              href="tel:+919804243159"
              className="flex items-start gap-3 rounded-2xl border border-slate-200 p-5 transition hover:border-brand-300"
            >
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span>
                <span className="block text-sm font-semibold">Phone</span>
                <span className="mt-0.5 block text-sm text-slate-600">
                  +91 98042 43159
                </span>
              </span>
            </a>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-5">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span>
                <span className="block text-sm font-semibold">Location</span>
                <span className="mt-0.5 block text-sm text-slate-600">
                  Kolkata, West Bengal, India
                </span>
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="shell border-b border-slate-200 py-7">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600">
            {CAPABILITIES.map((c, i) => (
              <span key={c} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden="true" className="text-slate-300">
                    |
                  </span>
                )}
                {c}
              </span>
            ))}
          </p>
        </div>
        <div className="shell flex flex-col gap-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt=""
              width={512}
              height={512}
              className="h-8 w-8"
            />
            <p>© {YEAR} Nexvora Technologies. All rights reserved.</p>
          </div>
          <p>Udyam UDYAM-WB-10-021416</p>
        </div>
      </footer>
    </>
  );
}
