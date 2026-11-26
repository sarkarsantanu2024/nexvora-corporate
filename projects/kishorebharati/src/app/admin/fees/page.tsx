import { FilePlus2, IndianRupee } from 'lucide-react';
import type { Metadata } from 'next';
import { LinkButton, PageHeader } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { listFeeHeads } from '@/server/money/bills';
import { getPaymentDetails } from '@/server/money/shared';
import { requirePlan } from '@/server/platform';
import { readSearch, type Search } from '../_ui/bits';
import { BillsTab } from './bills-tab';
import { DayBookTab } from './daybook-tab';
import { DuesTab } from './dues-tab';
import { FeeHeads } from './fee-heads';
import { PaymentForm } from './payment-form';
import { FeesTabs, type FeesTab } from './tabs';

export const metadata: Metadata = { title: 'Fees' };

export default async function FeesPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const admin = isAdmin(session);
  const wanted = params.tab;
  const tab: FeesTab = wanted === 'bills' || wanted === 'daybook' || ((wanted === 'heads' || wanted === 'pay') && admin) ? wanted : 'dues';
  const student = params.student ?? '';

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={t('Fees')}
          description={t('Bills, money received and who still has to pay.')}
          actions={
            <>
              <LinkButton href={`/admin/fees/collect${student ? `?student=${student}` : ''}`}>
                <IndianRupee size={18} /> {t('Take payment')}
              </LinkButton>
              <LinkButton href={`/admin/fees/new${student ? `?student=${student}` : ''}`} variant="secondary">
                <FilePlus2 size={18} /> {t('New bill')}
              </LinkButton>
            </>
          }
        />
        <FeesTabs session={session} active={tab} />
      </div>

      {tab === 'dues' ? <DuesTab session={session} sort={params.sort ?? ''} section={params.section ?? ''} q={params.q ?? ''} /> : null}
      {tab === 'bills' ? (
        <BillsTab session={session} filter={{ q: params.q, status: params.status, period: params.period, section: params.section, student, page: params.page }} />
      ) : null}
      {tab === 'daybook' ? <DayBookTab session={session} day={params.day ?? ''} /> : null}
      {tab === 'heads' ? <FeeHeads heads={await listFeeHeads()} /> : null}
      {tab === 'pay' ? <PaymentForm initial={await getPaymentDetails()} /> : null}
    </>
  );
}
