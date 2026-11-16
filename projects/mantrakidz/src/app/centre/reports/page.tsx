import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { PrintButton } from '@/components/ui/client';
import { Card, Meter, PageHeader, TabLinks, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { addMonths, currentPeriod, formatDate, periodRange, todayIST } from '@/lib/date';
import { inr, percent } from '@/lib/money';
import { METHOD_LABELS } from '@/server/centre/money/labels';
import { admissionsAndWithdrawals, attendanceByClass, collectionByMethod, duesAgeing, incomeStatement, rangeFrom } from '@/server/centre/money/reports';
import type { Ctx } from '@/server/centre/money/shared';
import { PrintHeading } from '../fees/daybook-tab';
import { UrlPick } from '../fees/pickers';

export const metadata: Metadata = { title: 'Reports' };

const REPORTS = [
  { key: 'statement', label: 'Income and expenses' },
  { key: 'methods', label: 'Collection by method' },
  { key: 'ageing', label: 'Dues by age' },
  { key: 'admissions', label: 'Admissions and withdrawals' },
  { key: 'attendance', label: 'Attendance by class' },
] as const;
type ReportKey = (typeof REPORTS)[number]['key'];

const Money = ({ children, bold }: { children: number; bold?: boolean }) => <Td className={`tabular text-right ${bold ? 'text-base font-bold' : ''}`}>{inr(children)}</Td>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="min-w-0 overflow-hidden print-plain">
      <h2 className="border-b border-ink-100 px-5 py-3.5 text-base font-bold text-ink-900">{title}</h2>
      {children}
    </Card>
  );
}

const Empty = ({ text }: { text: string }) => <p className="px-5 py-6 text-sm text-ink-500">{text}</p>;

async function Statement({ ctx, range }: { ctx: Ctx; range: { from: string; to: string } }) {
  const data = await incomeStatement(ctx, range);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title="Fees collected">
        <Table className="!min-w-0">
          <tbody>
            {data.income.map((row) => (
              <Tr key={row.key}>
                <Td>{row.label}</Td>
                <Money>{row.amount}</Money>
              </Tr>
            ))}
            <tr>
              <Td className="font-semibold">Total collected</Td>
              <Money bold>{data.collection}</Money>
            </tr>
          </tbody>
        </Table>
        <p className="px-5 py-3 text-xs text-ink-500">Receipts by the date the money came in, void receipts left out. Royalty to head office is worked out on this figure.</p>
      </Section>
      <Section title="Expenses">
        {data.expenses.length ? (
          <Table className="!min-w-0">
            <tbody>
              {data.expenses.map((row) => (
                <Tr key={row.category}>
                  <Td>{row.category}</Td>
                  <Money>{row.amount}</Money>
                </Tr>
              ))}
              <tr>
                <Td className="font-semibold">Total spent</Td>
                <Money bold>{data.expenseTotal}</Money>
              </tr>
            </tbody>
          </Table>
        ) : (
          <Empty text="No expenses written down in these dates." />
        )}
      </Section>
      <Card className={`print-plain p-5 lg:col-span-2 ${data.surplus < 0 ? 'border-accent-200 bg-accent-50' : 'border-mint-100 bg-mint-50'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[15px] font-semibold text-ink-800">
            {data.surplus < 0 ? 'Shortfall' : 'Surplus'}: collected {inr(data.collection)} less spent {inr(data.expenseTotal)}
          </p>
          <p className={`tabular font-display text-3xl font-bold ${data.surplus < 0 ? 'text-accent-600' : 'text-mint-700'}`}>{inr(Math.abs(data.surplus))}</p>
        </div>
      </Card>
    </div>
  );
}

async function Methods({ ctx, range }: { ctx: Ctx; range: { from: string; to: string } }) {
  const data = await collectionByMethod(ctx, range);
  return (
    <Section title="Collection by method">
      <Table className="!min-w-[420px]">
        <thead>
          <tr>
            <Th>Method</Th>
            <Th className="text-right">Receipts</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Share</Th>
          </tr>
        </thead>
        <tbody>
          {data.methods.map((m) => (
            <Tr key={m.method}>
              <Td>{METHOD_LABELS[m.method]}</Td>
              <Td className="tabular text-right">{m.count}</Td>
              <Money>{m.amount}</Money>
              <Td className="tabular text-right">{percent(m.amount, data.total)}%</Td>
            </Tr>
          ))}
          <tr>
            <Td className="font-semibold">Total</Td>
            <Td className="tabular text-right font-semibold">{data.count}</Td>
            <Money bold>{data.total}</Money>
            <Td />
          </tr>
        </tbody>
      </Table>
    </Section>
  );
}

async function Ageing({ ctx }: { ctx: Ctx }) {
  const data = await duesAgeing(ctx);
  return (
    <Section title={`Dues by age, as on ${formatDate(data.asOf)}`}>
      {data.rows.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Child</Th>
              <Th className="text-right">Not yet due</Th>
              <Th className="text-right">0 to 30 days late</Th>
              <Th className="text-right">31 to 60 days</Th>
              <Th className="text-right">61 days and more</Th>
              <Th className="text-right">Total due</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <Tr key={row.studentId}>
                <Td>
                  <Link href={`/centre/fees?student=${row.studentId}&status=due`} className="font-semibold text-ink-900 hover:underline">
                    {row.name}
                  </Link>
                  <span className="block text-xs text-ink-500">
                    {row.batchName ?? 'No class'} · {row.guardianPhone}
                  </span>
                </Td>
                <Td className="tabular text-right">{row.notDue ? inr(row.notDue) : ''}</Td>
                <Td className="tabular text-right">{row.d0 ? inr(row.d0) : ''}</Td>
                <Td className="tabular text-right text-sun-700">{row.d31 ? inr(row.d31) : ''}</Td>
                <Td className="tabular text-right font-semibold text-accent-600">{row.d61 ? inr(row.d61) : ''}</Td>
                <Money bold>{row.total}</Money>
              </Tr>
            ))}
            <tr>
              <Td className="font-semibold">Total</Td>
              <Money>{data.totals.notDue}</Money>
              <Money>{data.totals.d0}</Money>
              <Money>{data.totals.d31}</Money>
              <Money>{data.totals.d61}</Money>
              <Money bold>{data.totals.total}</Money>
            </tr>
          </tbody>
        </Table>
      ) : (
        <Empty text="Nobody owes anything." />
      )}
    </Section>
  );
}

async function Admissions({ ctx, range }: { ctx: Ctx; range: { from: string; to: string } }) {
  const data = await admissionsAndWithdrawals(ctx, range);
  const list = (rows: typeof data.admitted, kind: 'in' | 'out') => (
    <Table className="!min-w-[420px]">
      <thead>
        <tr>
          <Th>Child</Th>
          <Th>Class</Th>
          <Th>{kind === 'in' ? 'Admitted on' : 'Left on'}</Th>
          {kind === 'out' ? <Th>Reason</Th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Tr key={row.id}>
            <Td>
              <Link href={`/centre/students/${row.id}`} className="font-semibold text-ink-900 hover:underline">
                {row.name}
              </Link>
              <span className="block text-xs text-ink-500">{row.admissionNo}</span>
            </Td>
            <Td>{row.batchName}</Td>
            <Td className="whitespace-nowrap">{formatDate(kind === 'in' ? row.admissionDate : row.leftOn)}</Td>
            {kind === 'out' ? <Td>{row.leftReason}</Td> : null}
          </Tr>
        ))}
      </tbody>
    </Table>
  );
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title={`Admissions: ${data.admitted.length}`}>{data.admitted.length ? list(data.admitted, 'in') : <Empty text="No child was admitted in these dates." />}</Section>
      <Section title={`Withdrawals: ${data.left.length}`}>{data.left.length ? list(data.left, 'out') : <Empty text="No child left in these dates." />}</Section>
    </div>
  );
}

async function AttendanceReport({ ctx, range }: { ctx: Ctx; range: { from: string; to: string } }) {
  const data = await attendanceByClass(ctx, range);
  return (
    <Section title={`Attendance by class: ${data.overall}% overall`}>
      {data.rows.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Class</Th>
              <Th className="text-right">Days marked</Th>
              <Th className="text-right">Present</Th>
              <Th className="text-right">Absent</Th>
              <Th className="text-right">Leave</Th>
              <Th className="w-56">Attendance</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <Tr key={row.batchId ?? 'none'}>
                <Td className="font-semibold">{row.batchName ?? 'No class'}</Td>
                <Td className="tabular text-right">{row.days}</Td>
                <Td className="tabular text-right">{row.present}</Td>
                <Td className="tabular text-right">{row.absent}</Td>
                <Td className="tabular text-right">{row.leave}</Td>
                <Td>
                  <span className="flex items-center gap-3">
                    <Meter value={row.percent} tone={row.percent >= 85 ? 'green' : row.percent >= 70 ? 'amber' : 'red'} />
                    <span className="tabular w-10 shrink-0 text-right font-semibold">{row.percent}%</span>
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Empty text="No attendance was marked in these dates." />
      )}
    </Section>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ report?: string; from?: string; to?: string; month?: string }> }) {
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre');
  const params = await searchParams;
  const report: ReportKey = REPORTS.some((r) => r.key === params.report) ? (params.report as ReportKey) : 'statement';
  const range = rangeFrom(params);
  const today = todayIST();
  const dates = `from=${range.from}&to=${range.to}`;
  const title = REPORTS.find((r) => r.key === report)!.label;

  const thisMonth = periodRange(currentPeriod());
  const lastMonth = periodRange(addMonths(currentPeriod(), -1));
  const fyStartYear = Number(today.slice(5, 7)) >= 4 ? Number(today.slice(0, 4)) : Number(today.slice(0, 4)) - 1;
  const quick = [
    { label: 'This month', from: thisMonth.from, to: thisMonth.to },
    { label: 'Last month', from: lastMonth.from, to: lastMonth.to },
    { label: 'This financial year', from: `${fyStartYear}-04-01`, to: today },
  ];

  return (
    <div className="animate-fade-up">
      <div className="no-print">
        <PageHeader
          title="Reports"
          description="Where the centre stands, for any dates."
          actions={
            <>
              <a href={`/centre/reports/export?report=${report}&${dates}`} className={buttonClass('secondary')}>
                <Download size={18} /> CSV
              </a>
              <PrintButton />
            </>
          }
        />
      </div>
      <PrintHeading centre={ctx.centre.name} title={title} sub={report === 'ageing' ? `As on ${formatDate(today)}` : `${formatDate(range.from)} to ${formatDate(range.to)}`} />
      <TabLinks active={report} tabs={REPORTS.map((r) => ({ key: r.key, label: r.label, href: `/centre/reports?report=${r.key}&${dates}` }))} />

      {report === 'ageing' ? null : (
        <div className="no-print mb-5 flex flex-wrap items-center gap-2">
          <UrlPick param="from" fallback={range.from} max={range.to} label="From" />
          <span className="text-sm text-ink-500">to</span>
          <UrlPick param="to" fallback={range.to} max={today} label="To" />
          <span className="flex flex-wrap gap-1.5 sm:ml-2">
            {quick.map((q) => {
              const active = q.from === range.from && q.to === range.to;
              return (
                <Link
                  key={q.label}
                  href={`/centre/reports?report=${report}&from=${q.from}&to=${q.to}`}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${active ? 'bg-brand-700 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50'}`}
                >
                  {q.label}
                </Link>
              );
            })}
          </span>
        </div>
      )}

      {report === 'statement' ? <Statement ctx={ctx} range={range} /> : null}
      {report === 'methods' ? <Methods ctx={ctx} range={range} /> : null}
      {report === 'ageing' ? <Ageing ctx={ctx} /> : null}
      {report === 'admissions' ? <Admissions ctx={ctx} range={range} /> : null}
      {report === 'attendance' ? <AttendanceReport ctx={ctx} range={range} /> : null}
    </div>
  );
}
