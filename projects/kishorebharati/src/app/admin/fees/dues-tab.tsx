import { PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, LinkButton, Table, Td, Th, Tr } from '@/components/ui/core';
import { formatDate, todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import type { Session } from '@/lib/session-token';
import { getT } from '@/lib/t';
import { fillTemplate, telLink, waLink } from '@/lib/wa';
import { getSetting } from '@/server/admin/shared';
import { listDues, listSections } from '@/server/money/bills';
import { paymentText } from '@/server/money/labels';
import { getPaymentDetails, parentName, schoolHeader } from '@/server/money/shared';
import { wordingOf } from '@/server/reminders/service';
import { FilterBar } from '../_ui/bits';
import { WhatsAppLink } from './bits';
import { classOf } from './shared';

export async function DuesTab({ session, sort, section, q }: { session: Session; sort: string; section: string; q: string }) {
  const t = await getT();
  const lang = await getLang();
  const [rows, sections, reminders, pay, school] = await Promise.all([listDues(session, { sort, section, q }), listSections(), getSetting('reminders'), getPaymentDetails(), schoolHeader()]);
  const today = todayIST();
  // How to pay goes at the end of every reminder, once the school has set it up.
  const howToPay = paymentText(pay);
  const wording = wordingOf(reminders, 'fee_overdue');
  const total = rows.reduce((sum, row) => sum + row.due, 0);

  return (
    <>
      <FilterBar>
        <SearchInput placeholder={t('Student, admission no or mobile')} />
        <UrlSelect param="section" label={t('Class')} options={[{ value: '', label: t('All classes') }, ...sections.map((row) => ({ value: row.id, label: classOf({ grade: row.grade, sectionName: row.name, stream: row.stream, shift: row.shift }, lang) }))]} />
        <UrlSelect
          param="sort"
          label={t('Sort')}
          options={[
            { value: '', label: t('Highest amount first') },
            { value: 'age', label: t('Oldest due first') },
            { value: 'class', label: t('By class and roll') },
          ]}
        />
      </FilterBar>

      <Card className="overflow-hidden">
        {rows.length ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-100 px-4 py-3">
              <p className="text-sm font-medium text-ink-600">{rows.length === 1 ? t('1 student has fees to pay') : t('{n} students have fees to pay', { n: rows.length })}</p>
              <p className="tabular font-display text-xl font-bold text-accent-600">{inr(total)}</p>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Student')}</Th>
                  <Th>{t('Pending')}</Th>
                  <Th>{t('Oldest due')}</Th>
                  <Th>{t('Mobile')}</Th>
                  <Th className="text-right">{t('Total due')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const pending = row.pending.join(', ');
                  const message = [
                    fillTemplate(wording, { parent: parentName(row), student: row.name, bill: pending, amount: inr(row.due), date: formatDate(row.oldestDue), school: school.nameBn || school.name }),
                    howToPay,
                  ]
                    .filter(Boolean)
                    .join('\n\n');
                  const place = classOf(row, lang);
                  return (
                    <Tr key={row.studentId}>
                      <Td>
                        <Link href={`/admin/fees?tab=bills&student=${row.studentId}&status=due`} className="font-semibold text-ink-900 hover:underline">
                          {row.name}
                        </Link>
                        <span className="block text-xs text-ink-500">
                          {[place, row.rollNo ? t('Roll {n}', { n: row.rollNo }) : '', row.admissionNo].filter(Boolean).join(' · ')}
                        </span>
                      </Td>
                      <Td>
                        <span className="tabular font-medium">{row.bills === 1 ? t('1 bill') : t('{n} bills', { n: row.bills })}</span>
                        <span className="block max-w-[220px] text-xs text-ink-500">{pending}</span>
                      </Td>
                      <Td className={`whitespace-nowrap ${row.oldestDue < today ? 'font-semibold text-accent-600' : ''}`}>{formatDate(row.oldestDue)}</Td>
                      <Td className="whitespace-nowrap">
                        {row.phone ? (
                          <a href={telLink(row.phone)} className="tabular hover:underline">
                            {row.phone}
                          </a>
                        ) : (
                          <span className="text-ink-400">{t('Not added')}</span>
                        )}
                      </Td>
                      <Td className="tabular text-right text-base font-bold">{inr(row.due)}</Td>
                      <Td>
                        <div className="no-print flex flex-wrap justify-end gap-2">
                          <WhatsAppLink href={waLink(row.phone, message)} label={t('Remind')} />
                          <LinkButton href={`/admin/fees/collect?student=${row.studentId}`} size="sm">
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
            title={q || section ? t('Nobody here owes anything') : t('No dues')}
            text={t('Every student with an unpaid or part paid bill shows here, with a WhatsApp reminder ready to send.')}
          />
        )}
      </Card>
    </>
  );
}
