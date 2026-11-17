import { UsersRound } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, EmptyState, LinkButton, PageHeader } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { currentPeriod, periodLabel, todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { salarySheet } from '@/server/centre/money/expenses';
import { UrlPick } from '../../fees/pickers';
import { SalaryForm } from './salary-form';

export const metadata: Metadata = { title: 'Pay salaries' };

export default async function SalariesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre');
  const { month } = await searchParams;
  const sheet = await salarySheet(ctx, month && month <= currentPeriod() ? month : undefined);
  const label = periodLabel(sheet.month);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('Pay salaries')}
        description={t('Tick the staff you are paying. Each payment is saved as a Salary expense, and nobody can be paid twice for one month.')}
        back={{ href: '/centre/expenses', label: t('Expenses') }}
      />
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Salary for the month of')}</p>
          <UrlPick param="month" type="month" fallback={currentPeriod()} max={currentPeriod()} label={t('Month')} />
        </div>
      </div>

      {sheet.rows.length ? (
        // Keyed by month so the ticks and amounts start fresh when the month changes.
        <SalaryForm key={sheet.month} month={sheet.month} label={label} today={todayIST()} rows={sheet.rows} paidTotal={sheet.paidTotal} />
      ) : (
        <Card>
          <EmptyState
            icon={<UsersRound size={26} />}
            title={t('No staff yet')}
            text={t("Add the centre's teachers and helpers with their monthly salary, then pay them from here.")}
            action={<LinkButton href="/centre/staff">{t('Staff')}</LinkButton>}
          />
        </Card>
      )}
    </div>
  );
}
