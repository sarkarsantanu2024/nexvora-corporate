import { Download, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, LinkButton, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { formatDate, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { fillTemplate, telLink, waLink } from '@/lib/wa';
import { listClasses, listDues } from '@/server/centre/money/bills';
import { paymentDetailsOf, paymentText } from '@/server/centre/money/payment-info';
import { feeSettings, parentName, type Ctx } from '@/server/centre/money/shared';
import { WhatsAppLink } from './pickers';

export async function DuesTab({ ctx, sort, batch, q }: { ctx: Ctx; sort: string; batch: string; q: string }) {
  const t = await getT();
  const [rows, classes, settings] = await Promise.all([listDues(ctx, { sort, batch, q }), listClasses(ctx), feeSettings()]);
  const today = todayIST();
  // How to pay goes at the end of every reminder, when the centre has set it up.
  const howToPay = paymentText(paymentDetailsOf(ctx.centre));
  const total = rows.reduce((sum, row) => sum + row.due, 0);
  const query = new URLSearchParams({ type: 'dues', ...(sort ? { sort } : {}), ...(batch ? { batch } : {}), ...(q ? { q } : {}) });

  return (
    <>
      <div className="no-print mb-4 filter-bar flex flex-wrap items-center gap-2">
        <SearchInput placeholder={t('Child, admission no or mobile')} />
        <UrlSelect param="batch" label={t('Class')} options={[{ value: '', label: t('All classes') }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
        <UrlSelect
          param="sort"
          label={t('Sort')}
          options={[
            { value: '', label: t('Highest amount first') },
            { value: 'age', label: t('Oldest due first') },
          ]}
        />
        {rows.length ? (
          <a href={`/centre/fees/export?${query}`} className={buttonClass('secondary', 'md', 'sm:ml-auto')}>
            <Download size={18} /> {t('CSV')}
          </a>
        ) : null}
      </div>

      <Card className="overflow-hidden">
        {rows.length ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-100 px-4 py-3">
              <p className="text-sm font-medium text-ink-600">
                {rows.length === 1 ? t('{n} child has fees to pay', { n: rows.length }) : t('{n} children have fees to pay', { n: rows.length })}
              </p>
              <p className="tabular font-display text-xl font-bold text-accent-600">{inr(total)}</p>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Child')}</Th>
                  <Th>{t('Pending')}</Th>
                  <Th>{t('Oldest due')}</Th>
                  <Th>{t('Mobile')}</Th>
                  <Th className="text-right">{t('Total due')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const month = row.pending.join(', ');
                  const reminder = [
                    fillTemplate(settings.reminderTemplate, { parent: parentName(row), child: row.name, amount: inr(row.due), month, centre: ctx.centre.name }),
                    howToPay,
                  ]
                    .filter(Boolean)
                    .join('\n\n');
                  return (
                    <Tr key={row.studentId}>
                      <Td>
                        <Link href={`/centre/fees?student=${row.studentId}&status=due`} className="whitespace-nowrap font-semibold text-ink-900 hover:underline">
                          {row.name}
                        </Link>
                        <span className="block text-xs text-ink-500">
                          {row.batchName ?? t('No class')} · {row.admissionNo}
                        </span>
                      </Td>
                      <Td>
                        <span className="tabular font-medium">
                          {row.bills === 1 ? t('{n} bill', { n: row.bills }) : t('{n} bills', { n: row.bills })}
                        </span>
                        <span className="block max-w-[220px] text-xs text-ink-500">{month}</span>
                      </Td>
                      <Td className={`whitespace-nowrap ${row.oldestDue < today ? 'font-semibold text-accent-600' : ''}`}>{formatDate(row.oldestDue)}</Td>
                      <Td className="whitespace-nowrap">
                        {row.guardianPhone ? (
                          <a href={telLink(row.guardianPhone)} className="tabular hover:underline">
                            {row.guardianPhone}
                          </a>
                        ) : (
                          <span className="text-ink-400">{t('Not added')}</span>
                        )}
                      </Td>
                      <Td className="tabular text-right text-base font-bold">{inr(row.due)}</Td>
                      <Td>
                        <div className="no-print flex justify-end gap-2">
                          <WhatsAppLink href={waLink(row.guardianPhone, reminder)} label={t('Remind')} />
                          <LinkButton href={`/centre/fees/collect?student=${row.studentId}`} size="sm">
                            {t('Take payment')}
                          </LinkButton>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        ) : (
          <EmptyState
            icon={<PartyPopper size={26} />}
            title={q || batch ? t('Nobody here owes anything') : t('No dues')}
            text={t('Every child with an unpaid or part paid bill shows here, with a WhatsApp reminder ready to send.')}
          />
        )}
      </Card>
    </>
  );
}
