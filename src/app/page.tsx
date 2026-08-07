import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { PRODUCTS } from "@/lib/products";

const YEAR = 2026;

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-base font-bold text-white">
              N
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Nexvora Technologies
            </span>
          </a>
          <div className="hidden gap-7 text-sm font-medium text-slate-600 sm:flex">
            <a href="#products" className="hover:text-brand-600">
              Products
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
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-600">
              Nexvora Technologies
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Software that does the{" "}
              <span className="text-brand-600">unglamorous work</span> for
              growing businesses.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              We build focused products for Indian businesses — social media
              automation, school management, health records and more. Each one
              solves a job somebody was doing by hand.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#products"
                className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Explore our products
              </a>
              <a
                href="#contact"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Talk to us
              </a>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Our products
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Each product runs independently, with its own login and its own
            data. Nothing is shared between them.
          </p>

          <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* About */}
        <section id="about" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                About Nexvora
              </h2>
              <p className="mt-5 leading-relaxed text-slate-600">
                Nexvora Technologies is a product company based in West Bengal,
                India. We build and operate our own software rather than taking
                on client projects — which means every product gets maintained,
                supported and improved long after launch.
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

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-6xl px-5 py-20">
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
                  West Bengal, India
                </span>
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {YEAR} Nexvora Technologies. All rights reserved.
          </p>
          <p>Udyam UDYAM-WB-10-021416</p>
        </div>
      </footer>
    </>
  );
}
