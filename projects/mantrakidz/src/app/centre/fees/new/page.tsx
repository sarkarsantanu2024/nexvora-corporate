import type { Metadata } from 'next';
import Link from 'next/link';
import { Avatar, Card, PageHeader } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { getChild, listFeeHeads } from '@/server/centre/money/bills';
import { ChildPicker } from '../child-picker';
import { BillForm } from './bill-form';

export const metadata: Metadata = { title: 'New bill' };

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ student?: string; q?: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const { student, q } = await searchParams;
  const child = student ? await getChild(ctx, student) : null;

  if (!child) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title={t('New bill')}
          description={t('For an admission fee, the yearly kit or anything outside the monthly fee. Find the child first.')}
          back={{ href: '/centre/fees', label: t('Fees') }}
        />
        <ChildPicker ctx={ctx} q={q ?? ''} to="/centre/fees/new" hint={t('Search for the child to bill.')} />
      </div>
    );
  }

  const heads = (await listFeeHeads(ctx, { activeOnly: true })).filter((head) => head.kind !== 'monthly');
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('New bill')} description={t('Monthly fees are raised from Monthly bills, not here.')} back={{ href: '/centre/fees/new', label: t('Choose another child') }} />
      <div className="mx-auto max-w-3xl">
        <Card className="mb-5 flex items-center gap-4 p-4">
          <Avatar name={child.name} src={child.photo} size={52} />
          <div className="min-w-0 flex-1">
            <Link href={`/centre/students/${child.id}`} className="block truncate font-display text-xl font-bold text-ink-900 hover:underline">
              {child.name}
            </Link>
            <p className="truncate text-sm text-ink-500">
              {child.batchName ?? t('No class')} · {child.admissionNo}
            </p>
          </div>
        </Card>
        <BillForm
          studentId={child.id}
          today={todayIST()}
          manager={canManageCentre(ctx.session)}
          heads={heads.map((head) => ({ id: head.id, name: head.name, amount: head.amount }))}
        />
      </div>
    </div>
  );
}
