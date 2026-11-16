/**
 * One centre's royalty statement: terms, month by month, payments, balance.
 * Head office sees it with the cancel button; the centre head sees it read-only.
 */
import { Badge, Card, CardBody, CardHeader, Detail, EmptyState, Stat, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { formatDate, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import type { royaltyStatement } from '@/server/hq/royalty';
import { royaltyRateLabel } from '@/server/hq/shared';
import { NUM } from '../_ui/bits';
import { CancelPayment } from './royalty-tools';

type Statement = Awaited<ReturnType<typeof royaltyStatement>>;

export function StatementView({ data, canCancel = false }: { data: Statement; canCancel?: boolean }) {
  const { centre, rows, payments, totals } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Royalty raised" value={inr(totals.amount)} hint={`${rows.length} ${rows.length === 1 ? 'month' : 'months'}`} />
        <Stat label="Paid" value={inr(totals.paid)} tone="green" />
        <Stat label="Balance" value={inr(totals.balance)} tone={totals.balance > 0 ? 'amber' : 'green'} />
        <Stat label="Overdue" value={inr(totals.overdue)} tone={totals.overdue > 0 ? 'red' : 'green'} hint="Past the due date" />
      </div>

      <Card>
        <CardHeader title="Terms" />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Detail label="Royalty">{centre.isCompanyOwned ? 'None, company-owned centre' : royaltyRateLabel(centre.royaltyType, centre.royaltyValue)}</Detail>
            <Detail label="Agreement">
              {centre.agreementStart || centre.agreementEnd ? `${formatDate(centre.agreementStart) || 'Start not set'} to ${formatDate(centre.agreementEnd) || 'end not set'}` : null}
            </Detail>
            <Detail label="How it is worked out">
              {centre.royaltyType === 'percent' && !centre.isCompanyOwned
                ? 'On the fees received in the month. Cancelled receipts are left out.'
                : centre.isCompanyOwned
                  ? null
                  : 'The same amount every month.'}
            </Detail>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Month by month" />
        <div className="mt-4">
          {rows.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Month</Th>
                  <Th className="text-right">Fee collection</Th>
                  <Th>Rate</Th>
                  <Th className="text-right">Royalty</Th>
                  <Th className="text-right">Paid</Th>
                  <Th className="text-right">Balance</Th>
                  <Th>Status</Th>
                  <Th>Due</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Tr key={row.id}>
                    <Td className="whitespace-nowrap font-semibold text-ink-900">{periodLabel(row.period)}</Td>
                    <Td className={NUM}>{inr(row.basisAmount)}</Td>
                    <Td className="whitespace-nowrap">{royaltyRateLabel(row.royaltyType, row.royaltyValue)}</Td>
                    <Td className={`${NUM} font-semibold`}>{inr(row.amount)}</Td>
                    <Td className={NUM}>{inr(row.paid)}</Td>
                    <Td className={`${NUM} font-semibold ${row.balance > 0 ? 'text-accent-600' : ''}`}>{inr(row.balance)}</Td>
                    <Td>
                      <StatusBadge status={row.status} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatDate(row.dueDate)}
                      {row.overdue ? (
                        <Badge tone="red" className="ml-1.5">
                          Overdue
                        </Badge>
                      ) : null}
                    </Td>
                  </Tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-ink-50/60 font-bold text-ink-900">
                  <Td colSpan={3}>Total</Td>
                  <Td className={NUM}>{inr(totals.amount)}</Td>
                  <Td className={NUM}>{inr(totals.paid)}</Td>
                  <Td className={NUM}>{inr(totals.balance)}</Td>
                  <Td colSpan={2} />
                </tr>
              </tfoot>
            </Table>
          ) : (
            <EmptyState title="No royalty raised yet" text="Head office raises royalty after each month ends. The months show here once it has." />
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Payments" />
        <div className="mt-4">
          {payments.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>For</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Paid by</Th>
                  <Th>Reference</Th>
                  {canCancel ? <Th /> : null}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <Tr key={payment.id} className={payment.reversal || payment.reversed ? 'text-ink-400' : undefined}>
                    <Td className="whitespace-nowrap">{formatDate(payment.paidOn)}</Td>
                    <Td className="whitespace-nowrap">{payment.period ? periodLabel(payment.period) : ''}</Td>
                    <Td className={`${NUM} font-semibold`}>{inr(payment.amount).replace('₹-', '-₹')}</Td>
                    <Td className="capitalize">{payment.method}</Td>
                    <Td>
                      {payment.reference}
                      {payment.reversed ? (
                        <Badge tone="neutral" className="ml-1.5">
                          Cancelled
                        </Badge>
                      ) : null}
                    </Td>
                    {canCancel ? (
                      <Td className="text-right">{payment.reversal || payment.reversed ? null : <CancelPayment paymentId={payment.id} amount={payment.amount} />}</Td>
                    ) : null}
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No payments yet" text="Royalty payments received by head office are listed here." />
          )}
        </div>
      </Card>
    </div>
  );
}
