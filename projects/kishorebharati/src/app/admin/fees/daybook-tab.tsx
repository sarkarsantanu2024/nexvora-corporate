import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { PrintButton } from '@/components/ui/client';
import { Badge, Card, EmptyState, LinkButton, Table, Td, Th, Tr } from '@/components/ui/core';
import { formatDate, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import type { Session } from '@/lib/session-token';
import { getT } from '@/lib/t';
import { METHOD_LABELS } from '@/server/money/labels';
import { dayBook } from '@/server/money/payments';
import { UrlPick } from './bits';
import { SchoolPrintHeader } from './print-header';
import { billName } from './shared';

export async function DayBookTab({ session, day }: { session: Session; day: string }) {
  const t = await getT();
  const today = todayIST();
  const book = await dayBook(session, day && day <= today ? day : today);

  return (
    <>
      <SchoolPrintHeader onlyOnPaper title={t('Day book')} sub={formatDate(book.day)} />
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <UrlPick param="day" fallback={today} max={today} label={t('Day')} />
        <div className="sm:ml-auto">
          <PrintButton />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {book.byMethod.map((m) => (
          <Card key={m.method} className="p-4">
            <p className="text-sm font-medium text-ink-500">{t(METHOD_LABELS[m.method])}</p>
            <p className="tabular mt-1 font-display text-xl font-bold text-ink-900">{inr(m.amount)}</p>
            <p className="text-xs text-ink-500">{m.count === 1 ? t('1 receipt') : t('{n} receipts', { n: m.count })}</p>
          </Card>
        ))}
        <Card className="border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">{t('Total for the day')}</p>
          <p className="tabular mt-1 font-display text-xl font-bold text-brand-900">{inr(book.total)}</p>
          <p className="text-xs text-brand-700">{book.count === 1 ? t('1 receipt') : t('{n} receipts', { n: book.count })}</p>
        </Card>
      </div>

      <Card className="print-plain overflow-hidden">
        {book.rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t('Receipt')}</Th>
                <Th>{t('Student')}</Th>
                <Th>{t('For')}</Th>
                <Th>{t('Method')}</Th>
                <Th>{t('Reference')}</Th>
                <Th>{t('Received by')}</Th>
                <Th className="text-right">{t('Amount')}</Th>
              </tr>
            </thead>
            <tbody>
              {book.rows.map((row) => (
                <Tr key={row.id} className={row.voidedAt ? 'text-ink-400' : ''}>
                  <Td>
                    <Link href={`/admin/fees/receipts/${row.id}`} className="tabular whitespace-nowrap font-semibold text-brand-700 hover:underline">
                      {row.receiptNo}
                    </Link>
                    {row.voidedAt ? (
                      <Badge tone="red" className="ml-2">
                        {t('Void')}
                      </Badge>
                    ) : null}
                  </Td>
                  <Td>
                    {row.studentName}
                    <span className="block text-xs text-ink-500">{row.admissionNo}</span>
                  </Td>
                  <Td>{billName(row, t)}</Td>
                  <Td>{t(METHOD_LABELS[row.method])}</Td>
                  <Td>{row.reference}</Td>
                  <Td>{row.receivedBy}</Td>
                  <Td className={`tabular text-right font-semibold ${row.voidedAt ? 'line-through' : ''}`}>{inr(row.amount)}</Td>
                </Tr>
              ))}
              <tr>
                <Td colSpan={6} className="text-right font-semibold">
                  {book.voided ? t('Total (void receipts left out)') : t('Total')}
                </Td>
                <Td className="tabular text-right text-base font-bold">{inr(book.total)}</Td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<BookOpen size={26} />}
            title={t('No receipts on {day}', { day: formatDate(book.day) })}
            text={t('The day book lists every receipt of a day with cash, UPI, bank and cheque totals, to tally against the cash box.')}
            action={book.day === today ? <LinkButton href="/admin/fees/collect">{t('Take payment')}</LinkButton> : undefined}
          />
        )}
      </Card>
    </>
  );
}
