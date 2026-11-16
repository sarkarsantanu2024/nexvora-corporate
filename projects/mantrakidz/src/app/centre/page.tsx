import { AlertTriangle, Armchair, CalendarCheck, CheckCircle2, ChevronRight, FileText, IndianRupee, MessageSquareText, Receipt, Users, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BarsChart, CHART_COLORS } from '@/components/ui/charts';
import { Card, CardBody, CardHeader, EmptyState, LinkButton, PageHeader, Stat, Table, Td, Th, Tr } from '@/components/ui/core';
import { CountUp } from '@/components/ui/motion';
import { requireCentre } from '@/lib/auth';
import { formatDate, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import { METHOD_LABELS } from '@/server/centre/money/labels';
import { centreOverview } from '@/server/centre/money/overview';

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
  const ctx = await requireCentre();
  const data = await centreOverview(ctx);
  const { tiles, todo, manager } = data;
  const month = periodLabel(data.month);
  const nothingToDo = !todo.attendancePending.length && !todo.followUps && !todo.unbilled && !todo.overdue;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Overview"
        description={`${formatDate(data.today)}. Fees, children and the day's work at a glance.`}
        actions={
          <>
            <LinkButton href="/centre/fees/collect">
              <IndianRupee size={18} /> Take a payment
            </LinkButton>
            <LinkButton href="/centre/fees?tab=dues" variant="secondary">
              Who has not paid
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat label="Children on roll" value={<CountUp value={tiles.onRoll} />} hint={`${tiles.seats} seats in all`} icon={<Users size={18} />} href="/centre/students" />
        <Stat
          label={`Collected in ${month}`}
          value={<CountUp value={tiles.collectedMonth} prefix="₹" />}
          hint={manager && tiles.surplusMonth !== null ? `${inr(tiles.surplusMonth)} left after expenses` : undefined}
          icon={<Receipt size={18} />}
          tone="green"
          href="/centre/fees"
        />
        <Stat
          label="Dues outstanding"
          value={<CountUp value={tiles.dues} prefix="₹" />}
          hint={tiles.childrenWithDues ? `${tiles.childrenWithDues} ${tiles.childrenWithDues === 1 ? 'child' : 'children'} to pay` : 'Nobody owes anything'}
          icon={<AlertTriangle size={18} />}
          tone={tiles.dues > 0 ? 'red' : 'green'}
          href="/centre/fees?tab=dues"
        />
        <Stat
          label="Collected today"
          value={<CountUp value={tiles.collectedToday} prefix="₹" />}
          hint={`${tiles.receiptsToday} receipt${tiles.receiptsToday === 1 ? '' : 's'} today`}
          icon={<IndianRupee size={18} />}
          tone="blue"
          href="/centre/fees?tab=daybook"
        />
        {manager && tiles.expensesMonth !== null ? (
          <Stat label={`Expenses in ${month}`} value={<CountUp value={tiles.expensesMonth} prefix="₹" />} icon={<Wallet size={18} />} tone="amber" href="/centre/expenses" />
        ) : null}
        <Stat label="Seats free" value={<CountUp value={tiles.seatsFree} />} hint="Across all classes" icon={<Armchair size={18} />} tone="violet" href="/centre/batches" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-1">
          <CardHeader title="Today" description="What needs doing" />
          <CardBody className="px-2 pb-3 pt-2">
            {nothingToDo ? (
              <div className="flex items-center gap-3 px-3 py-4 text-[15px] font-medium text-mint-700">
                <CheckCircle2 size={22} /> Nothing pending. All caught up.
              </div>
            ) : (
              <>
                {todo.attendancePending.length ? (
                  <TodoRow
                    href="/centre/attendance"
                    icon={<CalendarCheck size={18} />}
                    text={`Attendance not marked: ${todo.attendancePending.map((c) => c.name).join(', ')}`}
                    count={todo.attendancePending.length}
                  />
                ) : null}
                {todo.followUps ? <TodoRow href="/centre/enquiries" icon={<MessageSquareText size={18} />} text="Enquiry follow-ups due" count={todo.followUps} /> : null}
                {todo.unbilled ? (
                  <TodoRow
                    href={manager ? '/centre/fees/run' : '/centre/fees'}
                    icon={<FileText size={18} />}
                    text={`${month} bills not raised yet${manager ? '' : ' (ask the centre head)'}`}
                    count={todo.unbilled}
                  />
                ) : null}
                {todo.overdue ? <TodoRow href="/centre/fees?status=overdue" icon={<AlertTriangle size={18} />} text="Bills past the due date" count={todo.overdue} /> : null}
              </>
            )}
          </CardBody>
        </Card>

        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader title={manager ? 'Collection and expenses' : 'Collection'} description="Last 6 months" />
          <CardBody>
            <BarsChart
              data={data.trend}
              money
              height={260}
              series={manager ? [{ key: 'collected', name: 'Collected' }, { key: 'spent', name: 'Spent', color: CHART_COLORS[3] }] : [{ key: 'collected', name: 'Collected' }]}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-1">
          <CardHeader title="Children by class" description="Filled seats and free seats" />
          <CardBody>
            {data.classes.length ? (
              <BarsChart
                data={data.classes.map((c) => ({ label: c.name, children: c.children, free: Math.max(0, c.capacity - c.children) }))}
                stacked
                height={260}
                series={[{ key: 'children', name: 'Children' }, { key: 'free', name: 'Seats free', color: '#c5c5d6' }]}
              />
            ) : (
              <EmptyState title="No classes yet" text="Add a class to see how full each one is." action={<LinkButton href="/centre/batches">Add a class</LinkButton>} />
            )}
          </CardBody>
        </Card>

        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader
            title="Latest receipts"
            action={
              <Link href="/centre/fees?tab=daybook" className="text-sm font-semibold text-brand-700 hover:underline">
                Day book
              </Link>
            }
          />
          <div className="mt-4">
            {data.latest.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Receipt</Th>
                    <Th>Child</Th>
                    <Th>For</Th>
                    <Th>Method</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Amount</Th>
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
                      <Td>{METHOD_LABELS[row.method]}</Td>
                      <Td className="whitespace-nowrap">{formatDate(row.paidOn)}</Td>
                      <Td className="tabular text-right font-semibold">{inr(row.amount)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState
                icon={<Receipt size={26} />}
                title="No receipts yet"
                text="When a parent pays, the receipt shows here."
                action={<LinkButton href="/centre/fees/collect">Take a payment</LinkButton>}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
