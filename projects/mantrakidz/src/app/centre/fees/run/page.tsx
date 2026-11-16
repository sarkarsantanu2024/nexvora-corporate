import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, Card, EmptyState, LinkButton, Notice, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { addMonths, currentPeriod, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import { period as periodSchema } from '@/lib/validators';
import { previewRun } from '@/server/centre/money/bills';
import { feeSettings } from '@/server/centre/money/shared';
import { UrlPick } from '../pickers';
import { RunButton } from './run-button';

export const metadata: Metadata = { title: 'Monthly bills' };

export default async function RunPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre/fees');
  const { month: wanted } = await searchParams;
  const latest = addMonths(currentPeriod(), 1);
  const month = wanted && periodSchema.safeParse(wanted).success && wanted <= latest ? wanted : currentPeriod();
  const [preview, settings] = await Promise.all([previewRun(ctx, month), feeSettings()]);
  const label = periodLabel(month);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Monthly bills"
        description="Raises the month's fee bill for every child on roll who does not have one. Running it again adds nothing twice."
        back={{ href: '/centre/fees', label: 'Fees' }}
      />

      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink-700">Month</p>
              <UrlPick param="month" type="month" fallback={currentPeriod()} max={latest} label="Month" />
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-2 pb-1">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">To raise</dt>
                <dd className="tabular font-display text-xl font-bold text-ink-900">
                  {preview.toRaise} {preview.toRaise === 1 ? 'bill' : 'bills'} · {inr(preview.toRaiseAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Already billed</dt>
                <dd className="tabular font-display text-xl font-bold text-ink-900">{preview.alreadyBilled}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Due date</dt>
                <dd className="font-display text-xl font-bold text-ink-900">
                  {settings.dueDay} {label}
                </dd>
              </div>
            </dl>
          </div>
          <RunButton month={month} label={label} count={preview.toRaise} amount={preview.toRaiseAmount} />
        </div>
        {preview.noFee ? (
          <Notice tone="amber" className="mt-4">
            {preview.noFee} {preview.noFee === 1 ? 'child has' : 'children have'} no monthly fee and will be left out. Set the fee on the child, or add a monthly{' '}
            <Link href="/centre/fees?tab=heads" className="font-bold underline">
              fee head
            </Link>{' '}
            for the programme.
          </Notice>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        {preview.rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Child</Th>
                <Th>Class</Th>
                <Th className="text-right">Monthly fee</Th>
                <Th>Fee from</Th>
                <Th>{label} bill</Th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <Tr key={row.studentId}>
                  <Td>
                    <Link href={`/centre/students/${row.studentId}`} className="font-semibold text-ink-900 hover:underline">
                      {row.name}
                    </Link>
                    <span className="block text-xs text-ink-500">{row.admissionNo}</span>
                  </Td>
                  <Td>{row.batchName ?? <span className="text-ink-400">No class</span>}</Td>
                  <Td className="tabular text-right font-semibold">{row.amount == null ? '' : inr(row.amount)}</Td>
                  <Td>
                    {row.source === 'child' ? "Child's own fee" : row.source === 'fee head' ? 'Fee head' : <Badge tone="amber">No fee found</Badge>}
                  </Td>
                  <Td>
                    {row.invoiceId ? (
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <Link href={`/centre/fees/bills/${row.invoiceId}`} className="whitespace-nowrap font-semibold text-brand-700 hover:underline">
                          {row.invoiceNo}
                        </Link>
                        {row.invoiceStatus ? <StatusBadge status={row.invoiceStatus} label={row.invoiceStatus === 'partial' ? 'Part paid' : undefined} /> : null}
                      </span>
                    ) : row.amount == null ? (
                      <span className="text-ink-400">Left out</span>
                    ) : (
                      <Badge tone="blue">Will be raised</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<Users size={26} />}
            title="No children on roll"
            text={`Nobody was admitted on or before the end of ${label}. Admit a child first, then raise the bills.`}
            action={<LinkButton href="/centre/students">Children</LinkButton>}
          />
        )}
      </Card>
    </div>
  );
}
