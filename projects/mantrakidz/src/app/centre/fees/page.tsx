import { CalendarPlus, FilePlus2, IndianRupee } from 'lucide-react';
import type { Metadata } from 'next';
import { LinkButton, PageHeader, TabLinks } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { listFeeHeads, listProgrammes } from '@/server/centre/money/bills';
import { paymentDetailsOf } from '@/server/centre/money/payment-info';
import { BillsTab } from './bills-tab';
import { DayBookTab } from './daybook-tab';
import { DuesTab } from './dues-tab';
import { FeeHeads } from './fee-heads';
import { PaymentForm } from './payment-form';

export const metadata: Metadata = { title: 'Fees' };

type Search = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';

export default async function FeesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const ctx = await requireCentre();
  const params = await searchParams;
  const manager = canManageCentre(ctx.session);
  const wanted = one(params.tab);
  const tab = wanted === 'dues' || wanted === 'daybook' || ((wanted === 'heads' || wanted === 'pay') && manager) ? wanted : 'bills';
  const student = one(params.student);

  const tabs = [
    { key: 'bills', label: 'Bills', href: '/centre/fees' },
    { key: 'dues', label: 'Dues', href: '/centre/fees?tab=dues' },
    { key: 'daybook', label: 'Day book', href: '/centre/fees?tab=daybook' },
    ...(manager
      ? [
          { key: 'heads', label: 'Fee heads', href: '/centre/fees?tab=heads' },
          { key: 'pay', label: 'Payment details', href: '/centre/fees?tab=pay' },
        ]
      : []),
  ];

  return (
    <div className="animate-fade-up">
      <div className="no-print">
        <PageHeader
          title="Fees"
          description="Bills raised, money received and who still has to pay."
          actions={
            <>
              <LinkButton href={`/centre/fees/collect${student ? `?student=${student}` : ''}`}>
                <IndianRupee size={18} /> Take a payment
              </LinkButton>
              <LinkButton href={`/centre/fees/new${student ? `?student=${student}` : ''}`} variant="secondary">
                <FilePlus2 size={18} /> New bill
              </LinkButton>
              {manager ? (
                <LinkButton href="/centre/fees/run" variant="secondary">
                  <CalendarPlus size={18} /> Monthly bills
                </LinkButton>
              ) : null}
            </>
          }
        />
      </div>
      <TabLinks tabs={tabs} active={tab} />

      {tab === 'bills' ? (
        <BillsTab
          ctx={ctx}
          filter={{ q: one(params.q), status: one(params.status), month: one(params.month), batch: one(params.batch), student, page: one(params.page) }}
        />
      ) : null}
      {tab === 'dues' ? <DuesTab ctx={ctx} sort={one(params.sort)} batch={one(params.batch)} q={one(params.q)} /> : null}
      {tab === 'daybook' ? <DayBookTab ctx={ctx} day={one(params.day)} /> : null}
      {tab === 'pay' ? <PaymentForm initial={paymentDetailsOf(ctx.centre)} /> : null}
      {tab === 'heads' ? <FeeHeads heads={await listFeeHeads(ctx)} programmes={await listProgrammes()} /> : null}
    </div>
  );
}
