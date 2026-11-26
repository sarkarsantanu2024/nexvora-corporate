import { LogOut, MessageCircle, PauseCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { buttonClass } from '@/components/ui/core';
import { BRAND } from '@/config/brand';
import { getSession, homeFor } from '@/lib/auth';
import { PLATFORM_CONTACT } from '@/lib/plans';
import { getT } from '@/lib/t';
import { waLink } from '@/lib/wa';
import { getPlatform } from '@/server/platform';
import { logout } from '@/server/session-actions';

export const metadata: Metadata = { title: 'Account paused', robots: { index: false } };

/**
 * Every dashboard screen sends here while Nexvora has paused the account
 * (src/server/platform.ts). The website itself stays up. Nothing private is
 * shown, so this page needs no login of its own.
 */
export default async function SuspendedPage() {
  const t = await getT();
  const { status, note } = await getPlatform();
  if (status !== 'suspended') {
    const session = await getSession();
    redirect(session ? homeFor(session.role) : '/login');
  }
  const session = await getSession();
  const ask = waLink(PLATFORM_CONTACT.phone, `${BRAND.name}: our dashboard shows "Account paused". Please help.`);

  return (
    <main className="app-ui grid min-h-dvh place-items-center bg-ink-50 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-7 text-center shadow-sm">
        <Image src={BRAND.mark} alt="" width={56} height={56} className="mx-auto h-14 w-14 object-contain" />
        <p className="mt-2 font-display text-lg font-bold text-ink-900">{BRAND.name}</p>
        <span className="mx-auto mt-6 grid size-14 place-items-center rounded-full bg-sun-100 text-sun-700">
          <PauseCircle size={28} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">{t('Account paused')}</h1>
        <p className="mt-2 text-[15px] text-ink-600">{t('The dashboard is switched off for now. Your website is still open to visitors, and none of your data is lost.')}</p>
        {note ? <p className="mt-3 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700">{note}</p> : null}
        <p className="mt-3 text-sm text-ink-500">{t('To switch it back on, contact {name}.', { name: PLATFORM_CONTACT.name })}</p>
        <div className="mt-6 flex flex-col gap-2">
          {ask ? (
            <a href={ask} target="_blank" rel="noreferrer" className={buttonClass('primary', 'md', 'w-full')}>
              <MessageCircle size={17} /> {t('Ask on WhatsApp')}
            </a>
          ) : null}
          {session ? (
            <form action={logout}>
              <button type="submit" className={buttonClass('secondary', 'md', 'w-full')}>
                <LogOut size={17} /> {t('Log out')}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
