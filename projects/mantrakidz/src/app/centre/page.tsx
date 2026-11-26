import { AlertTriangle, Armchair, CalendarCheck, CheckCircle2, ChevronRight, FileText, IndianRupee, MessageSquareText, ReceiptIndianRupee, Users, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BarsChart, CHART_COLORS } from '@/components/ui/charts';
import { Card, CardBody, CardHeader, EmptyState, LinkButton, PageHeader, Stat, Table, Td, Th, Tr } from '@/components/ui/core';
import { SuggestionList } from '@/components/dash/suggestions';
import { CountUp } from '@/components/ui/motion';
import { requireCentre } from '@/lib/auth';
import { formatDate, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { METHOD_LABELS } from '@/server/centre/money/labels';
import { centreOverview } from '@/server/centre/money/overview';
import { schoolSuggestions } from '@/server/suggestions';

export const metadata: Metadata = { title: 'Overview' };

function TodoRow({ href, icon, text, count }: { href: string; icon: ReactNode; text: string; count?: number }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-brand-50/60">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sun-100 text-sun-700">{icon}</span>
      <span className="min-w-0 flex-1 text-[15px] font-medium text-ink-800">{text}</span>
      {count !== undefined ? <span className="tabular rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-700">{count}</span> : null}
      <ChevronRight size={18} className="shrink-0 text-ink-400" />
    </Link>
  );
}

export default async function OverviewPage() {
  const t = await getT();
  const ctx = await requireCentre();
  const [data, suggestions] = await Promise.all([centreOverview(ctx), schoolSuggestions(ctx, t)]);
  const { tiles, todo, manager } = data;
  const month = periodLabel(data.month);
  const nothingToDo = !todo.attendancePending.length && !todo.followUps && !todo.unbilled && !todo.overdue;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('Overview')}
        description={t("{today}. Fees, children and the day's work at a glance.", { today: formatDate(data.today) })}
        actions={
          <>
            <LinkButton href="/centre/fees/collect">
              <IndianRupee size={18} /> {t('Take a payment')}
            </LinkButton>
            <LinkButton href="/centre/fees?tab=dues" variant="secondary">
              {t('Who has not paid')}
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat label={t('Children on roll')} value={<CountUp value={tiles.onRoll} />} hint={t('{seats} seats in all', { seats: tiles.seats })} icon={<Users size={18} />} href="/centre/students" />
        <Stat
          label={t('Collected in {month}', { month })}
          value={<CountUp value={tiles.collectedMonth} prefix="₹" />}
          hint={manager && tiles.surplusMonth !== null ? t('{surplusMonth} left after expenses', { surplusMonth: inr(tiles.surplusMonth) }) : undefined}
          icon={<ReceiptIndianRupee size={18} />}
          tone="green"
          href="/centre/fees"
        />
        <Stat
          label={t('Dues outstanding')}
          value={<CountUp value={tiles.dues} prefix="₹" />}
          hint={tiles.childrenWithDues ? (tiles.childrenWithDues === 1 ? t('{n} child to pay', { n: tiles.childrenWithDues }) : t('{n} children to pay', { n: tiles.childrenWithDues })) : t('Nobody owes anything')}
          icon={<AlertTriangle size={18} />}
          tone={tiles.dues > 0 ? 'red' : 'green'}
          href="/centre/fees?tab=dues"
        />
        <Stat
          label={t('Collected today')}
          value={<CountUp value={tiles.collectedToday} prefix="₹" />}
          hint={tiles.receiptsToday === 1 ? t('{n} receipt today', { n: tiles.receiptsToday }) : t('{n} receipts today', { n: tiles.receiptsToday })}
          icon={<IndianRupee size={18} />}
          tone="blue"
          href="/centre/fees?tab=daybook"
        />
        {manager && tiles.expensesMonth !== null ? (
          <Stat label={t('Expenses in {month}', { month })} value={<CountUp value={tiles.expensesMonth} prefix="₹" />} icon={<Wallet size={18} />} tone="amber" href="/centre/expenses" />
        ) : null}
        <Stat label={t('Seats free')} value={<CountUp value={tiles.seatsFree} />} hint={t('Across all classes')} icon={<Armchair size={18} />} tone="violet" href="/centre/batches" />
      </div>

      <SuggestionList items={suggestions} title={t('What to do next')} className="mt-5" />

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-1">
          <CardHeader title={t('Today')} description={t('What needs doing')} />
          <CardBody className="px-2 pb-3 pt-2">
            {nothingToDo ? (
              <div className="flex items-center gap-3 px-3 py-4 text-[15px] font-medium text-mint-700">
                <CheckCircle2 size={22} /> {t('Nothing pending. All caught up.')}
              </div>
            ) : (
              <>
                {todo.attendancePending.length ? (
                  <TodoRow
                    href="/centre/attendance"
                    icon={<CalendarCheck size={18} />}
                    text={t('Attendance not marked: {classes}', { classes: todo.attendancePending.map((c) => c.name).join(', ') })}
                    count={todo.attendancePending.length}
                  />
                ) : null}
                {todo.followUps ? <TodoRow href="/centre/enquiries" icon={<MessageSquareText size={18} />} text={t('Enquiry follow-ups due')} count={todo.followUps} /> : null}
                {todo.unbilled ? (
                  <TodoRow
                    href={manager ? '/centre/fees/run' : '/centre/fees'}
                    icon={<FileText size={18} />}
                    text={manager ? t('{month} bills not raised yet', { month }) : t('{month} bills not raised yet (ask the school head)', { month })}
                    count={todo.unbilled}
                  />
                ) : null}
                {todo.overdue ? <TodoRow href="/centre/fees?status=overdue" icon={<AlertTriangle size={18} />} text={t('Bills past the due date')} count={todo.overdue} /> : null}
              </>
            )}
          </CardBody>
        </Card>

        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader title={manager ? t('Collection and expenses') : t('Collection')} description={t('Last 6 months')} />
          <CardBody>
            <BarsChart
              data={data.trend}
              money
              height={260}
              series={manager ? [{ key: 'collected', name: t('Collected') }, { key: 'spent', name: t('Spent'), color: CHART_COLORS[3] }] : [{ key: 'collected', name: t('Collected') }]}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-1">
          <CardHeader title={t('Children by class')} description={t('Filled seats and free seats')} />
          <CardBody>
            {data.classes.length ? (
              <BarsChart
                data={data.classes.map((c) => ({ label: c.name, children: c.children, free: Math.max(0, c.capacity - c.children) }))}
                stacked
                height={260}
                series={[{ key: 'children', name: t('Children') }, { key: 'free', name: t('Seats free'), color: '#c5c5d6' }]}
              />
            ) : (
              <EmptyState title={t('No classes yet')} text={t('Add a class to see how full each one is.')} action={<LinkButton href="/centre/batches">{t('Add a class')}</LinkButton>} />
            )}
          </CardBody>
        </Card>

        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader
            title={t('Latest receipts')}
            action={
              <Link href="/centre/fees?tab=daybook" className="text-sm font-semibold text-brand-700 hover:underline">
                {t('Day book')}
              </Link>
            }
          />
          <div className="mt-4">
            {data.latest.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>{t('Receipt')}</Th>
                    <Th>{t('Child')}</Th>
                    <Th>{t('For')}</Th>
                    <Th>{t('Method')}</Th>
                    <Th>{t('Date')}</Th>
                    <Th className="text-right">{t('Amount')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.latest.map((row) => (
                    <Tr key={row.id}>
                      <Td>
                        <Link href={`/centre/fees/receipts/${row.id}`} className="font-semibold text-brand-700 hover:underline">
                          {row.receiptNo}
                        </Link>
                      </Td>
                      <Td>{row.studentName}</Td>
                      <Td className="text-ink-500">{row.title}</Td>
                      <Td>{t(METHOD_LABELS[row.method])}</Td>
                      <Td className="whitespace-nowrap">{formatDate(row.paidOn)}</Td>
                      <Td className="tabular text-right font-semibold">{inr(row.amount)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState
                icon={<ReceiptIndianRupee size={26} />}
                title={t('No receipts yet')}
                text={t('When a parent pays, the receipt shows here.')}
                action={<LinkButton href="/centre/fees/collect">{t('Take a payment')}</LinkButton>}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
