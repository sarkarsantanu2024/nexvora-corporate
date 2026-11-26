import type { Metadata } from 'next';
import Image from 'next/image';
import { BRAND } from '@/config/brand';
import { Cloud, PaperPlane, Star } from '@/components/site/art';
import { SiteI18n, SiteLink } from '@/components/site/i18n/client';
import { getSite } from '@/components/site/i18n/server';
import { Drift, Enter } from '@/components/site/motion-kit';
import { Cta } from '@/components/site/ui';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getSite();
  return { title: t.notFound.title, robots: { index: false } };
}

/**
 * Shown for any address that does not exist, in the dashboards as well as on
 * the website, so it stands on its own: no header, no database read. It
 * speaks the language of the address that was asked for (/en/…, /bn/…).
 */
export default async function NotFound() {
  const { lang, t } = await getSite();
  return (
    <SiteI18n lang={lang}>
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-b from-brand-50 to-white px-5 py-16 text-center">
        <Drift className="absolute left-[6%] top-[12%] w-28 text-white sm:w-40" bob={8} duration={9}>
          <Cloud className="drop-shadow-[0_6px_10px_rgba(63,52,143,.12)]" />
        </Drift>
        <Drift className="absolute right-[8%] top-[20%] w-20 text-white sm:w-32" bob={12} duration={7} delay={1}>
          <Cloud className="drop-shadow-[0_6px_10px_rgba(63,52,143,.12)]" />
        </Drift>
        <Drift className="absolute right-[12%] top-[8%] hidden w-44 text-brand-400 md:block" bob={14} duration={7} rotate={3}>
          <PaperPlane />
        </Drift>
        <Drift className="absolute bottom-[14%] left-[12%] w-8 text-sun-400" rotate={16} duration={5}>
          <Star />
        </Drift>

        <div className="relative max-w-xl">
          <Enter y={12}>
            <SiteLink href="/" aria-label={t.nav.home} className="inline-block">
              <Image src={BRAND.mark} alt="" width={72} height={72} priority />
            </SiteLink>
          </Enter>
          <Enter delay={0.08}>
            <p aria-hidden className="mt-4 font-display text-[7rem] font-extrabold leading-none text-brand-700 sm:text-[10rem]">
              404
            </p>
          </Enter>
          <Enter delay={0.16}>
            <h1 className="mt-4 text-balance font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{t.notFound.heading}</h1>
            <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-ink-600">{t.notFound.text}</p>
          </Enter>
          <Enter delay={0.24}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Cta href="/" arrow className="w-full sm:w-auto">
                {t.notFound.home}
              </Cta>
              <Cta href="/contact" variant="outline" className="w-full sm:w-auto">
                {t.notFound.contact}
              </Cta>
            </div>
          </Enter>
        </div>
      </main>
    </SiteI18n>
  );
}
