import { UsersRound } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Avatar, Badge, Card, EmptyState, Notice, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDate, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { rich } from '@/i18n/rich';
import { getT } from '@/lib/t';
import { listStaff } from '@/server/centre/children/staff';
import { StaffFormButton, StaffRowActions } from './staff-ui';

export const metadata: Metadata = { title: 'Staff' };

export default async function StaffPage() {
  const t = await getT();
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre');
  const rows = await listStaff(ctx);
  const today = todayIST();
  const working = rows.filter((r) => r.active);
  const salaryBill = working.reduce((sum, r) => sum + r.monthlySalary, 0);

  return (
    <>
      <PageHeader
        title={t('Staff')}
        description={working.length ? t('{n} on the staff list. Monthly salary bill {salaryBill}.', { n: working.length, salaryBill: inr(salaryBill) }) : t('Your school head, teachers and helpers.')}
        actions={<StaffFormButton today={today} />}
      />
      <Notice className="mb-4">
        {rich(t('Salary payments are entered under {link}. This list holds who works here, what they are paid and who can log in.'), {
          link: (
            <Link href="/centre/expenses" className="font-bold underline">
              {t('Expenses')}
            </Link>
          ),
        })}
      </Notice>

      <Card className="animate-fade-up overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={26} />}
            title={t('No staff added yet')}
            text={t('Add your teachers and helpers. You can then set a class teacher, mark staff attendance and give the front desk a login.')}
            action={<StaffFormButton today={today} />}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Mobile')}</Th>
                <Th>{t('Joined')}</Th>
                <Th className="text-right">{t('Salary')}</Th>
                <Th>{t('Login')}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const hasLogin = Boolean(row.userId && row.loginActive);
                return (
                  <Tr key={row.id} className={cn(!row.active && 'text-ink-500')}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={row.name} size={38} />
                        <div>
                          <p className="font-semibold text-ink-900">{row.name}</p>
                          <p className="text-xs text-ink-500">
                            {t(row.roleTitle)}
                            {row.qualification ? `, ${row.qualification}` : ''}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="tabular whitespace-nowrap">{row.phone || <span className="text-ink-400">{t('Not added')}</span>}</Td>
                    <Td className="whitespace-nowrap">
                      {row.joinedOn ? formatDate(row.joinedOn) : <span className="text-ink-400">{t('Not added')}</span>}
                      {!row.active ? <p className="text-xs">{t('Left {leftOn}', { leftOn: formatDate(row.leftOn) })}</p> : null}
                    </Td>
                    <Td className="tabular whitespace-nowrap text-right font-semibold">{inr(row.monthlySalary)}</Td>
                    <Td>
                      {!row.active ? (
                        <Badge>{t('Left')}</Badge>
                      ) : hasLogin ? (
                        <>
                          <Badge tone="green">{t('Can log in')}</Badge>
                          <p className="tabular mt-0.5 text-xs text-ink-500">{row.username}</p>
                        </>
                      ) : (
                        <span className="text-ink-400">{t('No login')}</span>
                      )}
                    </Td>
                    <Td>
                      <StaffRowActions
                        today={today}
                        row={{
                          id: row.id,
                          name: row.name,
                          active: row.active,
                          joinedOn: row.joinedOn,
                          hasLogin,
                          username: row.username,
                          values: {
                            name: row.name,
                            roleTitle: row.roleTitle,
                            phone: row.phone,
                            email: row.email,
                            qualification: row.qualification,
                            joinedOn: row.joinedOn ?? '',
                            monthlySalary: String(row.monthlySalary),
                          },
                        }}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
