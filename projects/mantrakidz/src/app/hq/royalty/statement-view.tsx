/**
 * One centre's royalty statement: terms, month by month, payments, balance.
 * Head office sees it with the cancel button; the centre head sees it read-only.
 */
import { Badge, Card, CardBody, CardHeader, Detail, EmptyState, Stat, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { formatDate, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import type { royaltyStatement } from '@/server/hq/royalty';
import { NUM, royaltyRate } from '../_ui/bits';
import { CancelPayment } from './royalty-tools';

type Statement = Awaited<ReturnType<typeof royaltyStatement>>;

export async function StatementView({ data, canCancel = false }: { data: Statement; canCancel?: boolean }) {
  const t = await getT();
  const { centre, rows, payments, totals } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label={t('Royalty raised')} value={inr(totals.amount)} hint={rows.length === 1 ? t('{n} month', { n: rows.length }) : t('{n} months', { n: rows.length })} />
        <Stat label={t('Paid')} value={inr(totals.paid)} tone="green" />
        <Stat label={t('Balance')} value={inr(totals.balance)} tone={totals.balance > 0 ? 'amber' : 'green'} />
        <Stat label={t('Overdue')} value={inr(totals.overdue)} tone={totals.overdue > 0 ? 'red' : 'green'} hint={t('Past the due date')} />
      </div>

      <Card>
        <CardHeader title={t('Terms')} />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Detail empty={t('Not added')} label={t('Royalty')}>{centre.isCompanyOwned ? t('None, company-owned centre') : royaltyRate(t, centre.royaltyType, centre.royaltyValue)}</Detail>
            <Detail empty={t('Not added')} label={t('Agreement')}>
              {centre.agreementStart || centre.agreementEnd ? t('{from} to {to}', { from: formatDate(centre.agreementStart) || t('Start not set'), to: formatDate(centre.agreementEnd) || t('end not set') }) : null}
            </Detail>
            <Detail empty={t('Not added')} label={t('How it is worked out')}>
              {centre.royaltyType === 'percent' && !centre.isCompanyOwned
                ? t('On the fees received in the month. Cancelled receipts are left out.')
                : centre.isCompanyOwned
                  ? null
                  : t('The same amount every month.')}
            </Detail>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t('Month by month')} />
        <div className="mt-4">
          {rows.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>{t('Month')}</Th>
                  <Th className="text-right">{t('Fee collection')}</Th>
                  <Th>{t('Rate')}</Th>
                  <Th className="text-right">{t('Royalty')}</Th>
                  <Th className="text-right">{t('Paid')}</Th>
                  <Th className="text-right">{t('Balance')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th>{t('Due')}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Tr key={row.id}>
                    <Td className="whitespace-nowrap font-semibold text-ink-900">{periodLabel(row.period)}</Td>
                    <Td className={NUM}>{inr(row.basisAmount)}</Td>
                    <Td className="whitespace-nowrap">{royaltyRate(t, row.royaltyType, row.royaltyValue)}</Td>
                    <Td className={`${NUM} font-semibold`}>{inr(row.amount)}</Td>
                    <Td className={NUM}>{inr(row.paid)}</Td>
                    <Td className={`${NUM} font-semibold ${row.balance > 0 ? 'text-accent-600' : ''}`}>{inr(row.balance)}</Td>
                    <Td>
                      <StatusBadge t={t} status={row.status} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatDate(row.dueDate)}
                      {row.overdue ? (
                        <Badge tone="red" className="ml-1.5">
                          {t('Overdue')}
                        </Badge>
                      ) : null}
                    </Td>
                  </Tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-ink-50/60 font-bold text-ink-900">
                  <Td colSpan={3}>{t('Total')}</Td>
                  <Td className={NUM}>{inr(totals.amount)}</Td>
                  <Td className={NUM}>{inr(totals.paid)}</Td>
                  <Td className={NUM}>{inr(totals.balance)}</Td>
                  <Td colSpan={2} />
                </tr>
              </tfoot>
            </Table>
          ) : (
            <EmptyState title={t('No royalty raised yet')} text={t('Head office raises royalty after each month ends. The months show here once it has.')} />
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={t('Payments')} />
        <div className="mt-4">
          {payments.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>{t('Date')}</Th>
                  <Th>{t('For')}</Th>
                  <Th className="text-right">{t('Amount')}</Th>
                  <Th>{t('Paid by')}</Th>
                  <Th>{t('Reference')}</Th>
                  {canCancel ? <Th /> : null}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <Tr key={payment.id} className={payment.reversal || payment.reversed ? 'text-ink-400' : undefined}>
                    <Td className="whitespace-nowrap">{formatDate(payment.paidOn)}</Td>
                    <Td className="whitespace-nowrap">{payment.period ? periodLabel(payment.period) : ''}</Td>
                    <Td className={`${NUM} font-semibold`}>{inr(payment.amount).replace('₹-', '-₹')}</Td>
                    <Td className="capitalize">{t(payment.method)}</Td>
                    <Td>
                      {payment.reference}
                      {payment.reversed ? (
                        <Badge tone="neutral" className="ml-1.5">
                          {t('Cancelled')}
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
            <EmptyState title={t('No payments yet')} text={t('Royalty payments received by head office are listed here.')} />
          )}
        </div>
      </Card>
    </div>
  );
}
