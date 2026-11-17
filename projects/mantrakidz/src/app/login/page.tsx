import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usingNeon } from '@/db';
import { InstallBanner } from '@/components/pwa/install-banner';
import { UiLangProvider } from '@/components/ui/lang';
import { uiDict } from '@/i18n/ui';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Log in', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const { next = '' } = await searchParams;
  return (
    // The forms here are client components outside the dashboard frame, so they get their words from this.
    <UiLangProvider lang={lang} dict={uiDict(lang)}>
    <div className="app-ui grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <InstallBanner />
      {/* brand side */}
      <div className="relative hidden overflow-hidden bg-brand-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="relative flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-1.5">
            <Image src="/brand/mark.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
          </span>
          <span>
            <span className="block font-display text-2xl font-bold leading-tight">Mantra Kidz</span>
            <span className="block text-sm text-brand-200">{t('A Play School')}</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight text-white">{t('One place to run every school.')}</h1>
          <p className="mt-4 text-lg text-brand-100">
            {t('Admissions, attendance, fees, royalty and the website, for head office, every franchise school and every parent.')}
          </p>
        </div>
        <p className="relative text-sm text-brand-300">{t('A unit of Mind Mantra Abacus')}</p>
      </div>

      {/* form side */}
      <div className="flex items-center justify-center bg-white px-5 py-10">
        <div className="w-full max-w-sm animate-fade-up">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/brand/mark.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
            <span className="font-display text-2xl font-bold text-brand-800">Mantra Kidz</span>
          </Link>
          <h2 className="font-display text-3xl font-bold text-ink-900">{t('Welcome back')}</h2>
          <p className="mt-1 text-ink-500">{t('Log in to your Mantra Kidz account.')}</p>

          <LoginForm next={next} showDemo={!usingNeon()} />

          <p className="mt-8 text-center text-sm text-ink-500">
            <Link href="/" className="font-semibold text-brand-700 hover:underline">
              {t('← Back to the website')}
            </Link>
          </p>
        </div>
      </div>
    </div>
    </UiLangProvider>
  );
}
