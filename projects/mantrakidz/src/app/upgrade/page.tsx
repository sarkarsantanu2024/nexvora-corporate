import { ArrowLeft, Lock, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buttonClass } from '@/components/ui/core';
import { BRAND } from '@/config/brand';
import { getSession, homeFor } from '@/lib/auth';
import { PLAN_LABELS, PLATFORM_CONTACT, isPlan } from '@/lib/plans';
import { getT } from '@/lib/t';
import { waLink } from '@/lib/wa';
import { getPlatform } from '@/server/platform';

export const metadata: Metadata = { title: 'Not in your plan', robots: { index: false } };

/**
 * Where a screen above the client's plan sends people (src/server/platform.ts).
 * It stands on its own, outside the head office and school frames, because a
 * school login cannot open head office screens and the other way round.
 */
export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  const t = await getT();
  const { plan } = await getPlatform();
  const { need: raw } = await searchParams;
  const need = isPlan(raw) ? raw : 'platinum';
  const session = await getSession();
  const ask = waLink(PLATFORM_CONTACT.phone, `${BRAND.name}: we would like to move to the ${PLAN_LABELS[need]} plan.`);
  // Head office can still open the parts of its own area that the plan covers.
  const back = session && session.role.startsWith('hq') ? homeFor(session.role) : '/';

  return (
    <main className="app-ui grid min-h-dvh place-items-center bg-ink-50 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-7 text-center shadow-sm">
        <Image src={BRAND.mark} alt="" width={56} height={56} className="mx-auto h-14 w-14 object-contain" />
        <p className="mt-2 font-display text-lg font-bold text-ink-900">{BRAND.name}</p>
        <span className="mx-auto mt-6 grid size-14 place-items-center rounded-full bg-ink-100 text-ink-600">
          <Lock size={26} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">{t('Not in your plan')}</h1>
        <p className="mt-2 text-[15px] text-ink-600">{t('This part of the dashboard comes with the {need} plan. You are on the {plan} plan.', { need: t(PLAN_LABELS[need]), plan: t(PLAN_LABELS[plan]) })}</p>
        <p className="mt-2 text-sm text-ink-500">{t('Ask {name} to move you to the plan that has it. Nothing you have already saved is lost.', { name: PLATFORM_CONTACT.name })}</p>
        <div className="mt-6 flex flex-col gap-2">
          {ask ? (
            <a href={ask} target="_blank" rel="noreferrer" className={buttonClass('primary', 'md', 'w-full')}>
              <MessageCircle size={17} /> {t('Ask on WhatsApp')}
            </a>
          ) : null}
          <Link href={back} className={buttonClass('secondary', 'md', 'w-full')}>
            <ArrowLeft size={17} /> {t('Go back')}
          </Link>
        </div>
      </div>
    </main>
  );
}
