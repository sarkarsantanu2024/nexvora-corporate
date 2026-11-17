import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, Card, EmptyState, LinkButton, Notice, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { addMonths, currentPeriod, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import { rich } from '@/i18n/rich';
import { getT } from '@/lib/t';
import { period as periodSchema } from '@/lib/validators';
import { previewRun } from '@/server/centre/money/bills';
import { feeSettings } from '@/server/centre/money/shared';
import { UrlPick } from '../pickers';
import { RunButton } from './run-button';

export const metadata: Metadata = { title: 'Monthly bills' };

export default async function RunPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const t = await getT();
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
        title={t('Monthly bills')}
        description={t("Raises the month's fee bill for every child on roll who does not have one. Running it again adds nothing twice.")}
        back={{ href: '/centre/fees', label: t('Fees') }}
      />

      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Month')}</p>
              <UrlPick param="month" type="month" fallback={currentPeriod()} max={latest} label={t('Month')} />
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-2 pb-1">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('To raise')}</dt>
                <dd className="tabular font-display text-xl font-bold text-ink-900">
                  {preview.toRaise === 1 ? t('{n} bill', { n: preview.toRaise }) : t('{n} bills', { n: preview.toRaise })} · {inr(preview.toRaiseAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Already billed')}</dt>
                <dd className="tabular font-display text-xl font-bold text-ink-900">{preview.alreadyBilled}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Due date')}</dt>
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
            {rich(
              preview.noFee === 1
                ? t('{n} child has no monthly fee and will be left out. Set the fee on the child, or add a monthly {link} for the programme.', { n: preview.noFee })
                : t('{n} children have no monthly fee and will be left out. Set the fee on the child, or add a monthly {link} for the programme.', { n: preview.noFee }),
              {
                link: (
                  <Link href="/centre/fees?tab=heads" className="font-bold underline">
                    {t('fee head')}
                  </Link>
                ),
              },
            )}
          </Notice>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        {preview.rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t('Child')}</Th>
                <Th>{t('Class')}</Th>
                <Th className="text-right">{t('Monthly fee')}</Th>
                <Th>{t('Fee from')}</Th>
                <Th>{t('{label} bill', { label })}</Th>
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
                  <Td>{row.batchName ?? <span className="text-ink-400">{t('No class')}</span>}</Td>
                  <Td className="tabular text-right font-semibold">{row.amount == null ? '' : inr(row.amount)}</Td>
                  <Td>
                    {row.source === 'child' ? t("Child's own fee") : row.source === 'fee head' ? t('Fee head') : <Badge tone="amber">{t('No fee found')}</Badge>}
                  </Td>
                  <Td>
                    {row.invoiceId ? (
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <Link href={`/centre/fees/bills/${row.invoiceId}`} className="whitespace-nowrap font-semibold text-brand-700 hover:underline">
                          {row.invoiceNo}
                        </Link>
                        {row.invoiceStatus ? <StatusBadge t={t} status={row.invoiceStatus} label={row.invoiceStatus === 'partial' ? t('Part paid') : undefined} /> : null}
                      </span>
                    ) : row.amount == null ? (
                      <span className="text-ink-400">{t('Left out')}</span>
                    ) : (
                      <Badge tone="blue">{t('Will be raised')}</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<Users size={26} />}
            title={t('No children on roll')}
            text={t('Nobody was admitted on or before the end of {label}. Admit a child first, then raise the bills.', { label })}
            action={<LinkButton href="/centre/students">{t('Children')}</LinkButton>}
          />
        )}
      </Card>
    </div>
  );
}
