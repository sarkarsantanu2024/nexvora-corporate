import type { Metadata } from 'next';
import { Badge, Card, CardBody, CardHeader, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getT } from '@/lib/t';
import { loadSettings } from '@/server/hq/admin';
import { AddYear, FeeSettingsForm, MakeCurrent, OrgForm, RemoveSample, RoyaltyDayForm } from './settings-forms';

export const metadata: Metadata = { title: 'Settings' };

/** The year after the latest one, to save typing: 2026-27 → 2027-28 with the same dates a year on. */
function nextYear(latest?: { startDate: string; endDate: string }) {
  if (!latest) return { name: '', startDate: '', endDate: '' };
  const shift = (day: string) => `${Number(day.slice(0, 4)) + 1}${day.slice(4)}`;
  const start = shift(latest.startDate);
  const end = shift(latest.endDate);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return { name: sameYear ? start.slice(0, 4) : `${start.slice(0, 4)}-${end.slice(2, 4)}`, startDate: start, endDate: end };
}

export default async function SettingsPage() {
  const t = await getT();
  await requireSession(['hq_admin']);
  const data = await loadSettings();
  const hasSample = data.sample.centres > 0 || data.sample.leads > 0;

  return (
    <>
      <PageHeader title={t('Settings')} description={t('Details of the organisation and the defaults every centre starts from.')} />

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader title={t('Organisation')} description={t('Used on receipts, letters and reminders.')} />
          <CardBody>
            <OrgForm initial={data.org} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('Royalty')} />
          <CardBody>
            <RoyaltyDayForm dueDay={data.royalty.dueDay} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('Fee defaults')} description={t('What a centre starts with. A centre can set its own in its settings.')} />
          <CardBody>
            <FeeSettingsForm initial={{ dueDay: String(data.fees.dueDay), reminderTemplate: data.fees.reminderTemplate, receiptFooter: data.fees.receiptFooter }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('Academic years')} description={t('One year is current. New classes and admissions go into it.')} action={<AddYear suggestion={nextYear(data.years[0])} />} className="pb-4" />
          <Table className="min-w-[480px]">
            <thead>
              <tr>
                <Th>{t('Year')}</Th>
                <Th>{t('From')}</Th>
                <Th>{t('To')}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.years.map((year) => (
                <Tr key={year.id}>
                  <Td className="font-semibold text-ink-900">{year.name}</Td>
                  <Td className="whitespace-nowrap">{formatDate(year.startDate)}</Td>
                  <Td className="whitespace-nowrap">{formatDate(year.endDate)}</Td>
                  <Td className="text-right">{year.isCurrent ? <Badge tone="green">{t('Current year')}</Badge> : <MakeCurrent id={year.id} name={year.name} />}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {hasSample ? (
          <Card className="border-accent-200">
            <CardHeader
              title={t('Sample data')}
              description={t('The system came with {centres} and {leads}, so every screen could be seen working. Remove them before real work starts.', {
                centres: data.sample.centres === 1 ? t('{n} sample centre', { n: data.sample.centres }) : t('{n} sample centres', { n: data.sample.centres }),
                leads: data.sample.leads === 1 ? t('{n} sample franchise lead', { n: data.sample.leads }) : t('{n} sample franchise leads', { n: data.sample.leads }),
              })}
            />
            <CardBody>
              <RemoveSample centres={data.sample.centres} leads={data.sample.leads} />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
