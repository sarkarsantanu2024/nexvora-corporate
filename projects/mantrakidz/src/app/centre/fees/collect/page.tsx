import { CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Avatar, Card, EmptyState, LinkButton, PageHeader } from '@/components/ui/core';
import { requireCentre } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { getChild, openBills } from '@/server/centre/money/bills';
import { ChildPicker } from '../child-picker';
import { CollectForm } from './collect-form';

export const metadata: Metadata = { title: 'Take a payment' };

export default async function CollectPage({ searchParams }: { searchParams: Promise<{ student?: string; q?: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const { student, q } = await searchParams;
  const child = student ? await getChild(ctx, student) : null;

  if (!child) {
    return (
      <div className="animate-fade-up">
        <PageHeader title={t('Take a payment')} description={t('Find the child first.')} back={{ href: '/centre/fees', label: t('Fees') }} />
        <ChildPicker ctx={ctx} q={q ?? ''} to="/centre/fees/collect" hint={t('Children with the most to pay are listed first.')} />
      </div>
    );
  }

  const bills = await openBills(ctx, child.id);
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('Take a payment')} back={{ href: '/centre/fees/collect', label: t('Choose another child') }} />
      <div className="mx-auto max-w-3xl">
        <Card className="mb-5 flex items-center gap-4 p-4">
          <Avatar name={child.name} src={child.photo} size={52} />
          <div className="min-w-0 flex-1">
            <Link href={`/centre/students/${child.id}`} className="block truncate font-display text-xl font-bold text-ink-900 hover:underline">
              {child.name}
            </Link>
            <p className="truncate text-sm text-ink-500">
              {child.batchName ?? t('No class')} · {child.admissionNo}
              {child.guardianPhone ? ` · ${child.guardianPhone}` : ''}
            </p>
          </div>
        </Card>

        {bills.length ? (
          <CollectForm
            studentId={child.id}
            today={todayIST()}
            bills={bills.map((bill) => ({ id: bill.id, invoiceNo: bill.invoiceNo, title: bill.title, dueDate: bill.dueDate, total: bill.total, paid: bill.paid }))}
          />
        ) : (
          <Card>
            <EmptyState
              icon={<CheckCircle2 size={26} />}
              title={t('Nothing due')}
              text={t('{name} has no unpaid bill. To take money for something new, raise a bill first.', { name: child.name })}
              action={<LinkButton href={`/centre/fees/new?student=${child.id}`}>{t('New bill')}</LinkButton>}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
