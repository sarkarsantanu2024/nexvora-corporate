import { UsersRound } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Avatar, Badge, Card, EmptyState, Notice, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDate, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { listStaff } from '@/server/centre/children/staff';
import { StaffFormButton, StaffRowActions } from './staff-ui';

export const metadata: Metadata = { title: 'Staff' };

export default async function StaffPage() {
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre');
  const rows = await listStaff(ctx);
  const today = todayIST();
  const working = rows.filter((r) => r.active);
  const salaryBill = working.reduce((sum, r) => sum + r.monthlySalary, 0);

  return (
    <>
      <PageHeader
        title="Staff"
        description={working.length ? `${working.length} on the staff list. Monthly salary bill ${inr(salaryBill)}.` : 'Your centre head, teachers and helpers.'}
        actions={<StaffFormButton today={today} />}
      />
      <Notice className="mb-4">
        Salary payments are entered under{' '}
        <Link href="/centre/expenses" className="font-bold underline">
          Expenses
        </Link>
        . This list holds who works here, what they are paid and who can log in.
      </Notice>

      <Card className="animate-fade-up overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={26} />}
            title="No staff added yet"
            text="Add your teachers and helpers. You can then set a class teacher, mark staff attendance and give the front desk a login."
            action={<StaffFormButton today={today} />}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Mobile</Th>
                <Th>Joined</Th>
                <Th className="text-right">Salary</Th>
                <Th>Login</Th>
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
                            {row.roleTitle}
                            {row.qualification ? `, ${row.qualification}` : ''}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="tabular whitespace-nowrap">{row.phone || <span className="text-ink-400">Not added</span>}</Td>
                    <Td className="whitespace-nowrap">
                      {row.joinedOn ? formatDate(row.joinedOn) : <span className="text-ink-400">Not added</span>}
                      {!row.active ? <p className="text-xs">Left {formatDate(row.leftOn)}</p> : null}
                    </Td>
                    <Td className="tabular whitespace-nowrap text-right font-semibold">{inr(row.monthlySalary)}</Td>
                    <Td>
                      {!row.active ? (
                        <Badge>Left</Badge>
                      ) : hasLogin ? (
                        <>
                          <Badge tone="green">Can log in</Badge>
                          <p className="tabular mt-0.5 text-xs text-ink-500">{row.username}</p>
                        </>
                      ) : (
                        <span className="text-ink-400">No login</span>
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
