import type { Metadata } from 'next';
import { Badge, Card, CardBody, CardHeader, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
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
  await requireSession(['hq_admin']);
  const data = await loadSettings();
  const hasSample = data.sample.centres > 0 || data.sample.leads > 0;

  return (
    <>
      <PageHeader title="Settings" description="Details of the organisation and the defaults every centre starts from." />

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader title="Organisation" description="Used on receipts, letters and reminders." />
          <CardBody>
            <OrgForm initial={data.org} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Royalty" />
          <CardBody>
            <RoyaltyDayForm dueDay={data.royalty.dueDay} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fee defaults" description="What a centre starts with. A centre can set its own in its settings." />
          <CardBody>
            <FeeSettingsForm initial={{ dueDay: String(data.fees.dueDay), reminderTemplate: data.fees.reminderTemplate, receiptFooter: data.fees.receiptFooter }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Academic years" description="One year is current. New classes and admissions go into it." action={<AddYear suggestion={nextYear(data.years[0])} />} className="pb-4" />
          <Table className="min-w-[480px]">
            <thead>
              <tr>
                <Th>Year</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.years.map((year) => (
                <Tr key={year.id}>
                  <Td className="font-semibold text-ink-900">{year.name}</Td>
                  <Td className="whitespace-nowrap">{formatDate(year.startDate)}</Td>
                  <Td className="whitespace-nowrap">{formatDate(year.endDate)}</Td>
                  <Td className="text-right">{year.isCurrent ? <Badge tone="green">Current year</Badge> : <MakeCurrent id={year.id} name={year.name} />}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {hasSample ? (
          <Card className="border-accent-200">
            <CardHeader
              title="Sample data"
              description={`The system came with ${data.sample.centres} sample ${data.sample.centres === 1 ? 'centre' : 'centres'} and ${data.sample.leads} sample franchise ${data.sample.leads === 1 ? 'lead' : 'leads'}, so every screen could be seen working. Remove them before real work starts.`}
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
