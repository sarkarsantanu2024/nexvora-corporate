import { Lock, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, CardBody, PageHeader, buttonClass } from '@/components/ui/core';
import { BRAND } from '@/config/brand';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { PLAN_LABELS, PLATFORM_CONTACT, isPlan } from '@/lib/plans';
import { getT } from '@/lib/t';
import { waLink } from '@/lib/wa';
import { getPlatform } from '@/server/platform';
import { readSearch, type Search } from '../_ui/bits';

export const metadata: Metadata = { title: 'Not in your plan' };

/** Where a screen above the client's plan sends them. */
export default async function UpgradePage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  await requireSession(TEAM_ROLES);
  const { plan } = await getPlatform();
  const params = await readSearch(searchParams);
  const need = isPlan(params.need) ? params.need : 'platinum';
  const ask = waLink(PLATFORM_CONTACT.phone, `${BRAND.name}: we would like to move to the ${PLAN_LABELS[need]} plan.`);

  return (
    <>
      <PageHeader title={t('Not in your plan')} />
      <Card className="max-w-2xl">
        <CardBody className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600">
              <Lock size={20} />
            </span>
            <div>
              <p className="text-[15px] text-ink-800">{t('This part of the dashboard comes with the {need} plan. You are on the {plan} plan.', { need: t(PLAN_LABELS[need]), plan: t(PLAN_LABELS[plan]) })}</p>
              <p className="mt-1 text-sm text-ink-500">{t('Ask {name} to move you to the plan that has it. Nothing you have already saved is lost.', { name: PLATFORM_CONTACT.name })}</p>
            </div>
          </div>
          {ask ? (
            <a href={ask} target="_blank" rel="noreferrer" className={buttonClass('primary', 'md')}>
              <MessageCircle size={17} /> {t('Ask on WhatsApp')}
            </a>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
