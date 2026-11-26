import { Handshake } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { SCHOOL, gradeLabel } from '@/config/school';
import { MEETING_KINDS } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { MEETING_KIND_LABELS, MEETING_TONES, timeText } from '@/server/office/labels';
import { listMeetings } from '@/server/office/meetings';
import { requirePlan } from '@/server/platform';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { MeetingFormButton } from './meeting-tools';

export const metadata: Metadata = { title: 'Meetings' };

export default async function MeetingsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const params = await readSearch(searchParams);
  const data = await listMeetings(session, { kind: params.kind, q: params.q, page: params.page });
  const filtered = Boolean(params.kind || params.q);
  const grades = SCHOOL.grades.map((grade) => ({ grade, label: gradeLabel(grade, lang) }));

  return (
    <>
      <PageHeader
        title={t('Meetings')}
        description={t('Managing committee, staff and parent-teacher meetings: who came, the agenda and the resolutions.')}
        actions={<MeetingFormButton grades={grades} />}
      />
      <FilterBar>
        <SearchInput placeholder={t('Search title, agenda or minutes')} />
        <UrlSelect param="kind" label={t('Kind of meeting')} options={[{ value: '', label: t('All meetings') }, ...MEETING_KINDS.map((kind) => ({ value: kind, label: t(MEETING_KIND_LABELS[kind]) }))]} />
      </FilterBar>
      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Date')}</Th>
                  <Th>{t('Meeting')}</Th>
                  <Th>{t('Agenda')}</Th>
                  <Th>{t('Minutes')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id}>
                    <Td className="whitespace-nowrap">
                      <p className="font-medium text-ink-900">{formatDate(row.day)}</p>
                      {row.time ? <p className="tabular text-xs text-ink-500">{timeText(row.time)}</p> : null}
                    </Td>
                    <Td>
                      <Link href={`/admin/meetings/${row.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {row.title || t(MEETING_KIND_LABELS[row.kind])}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone={MEETING_TONES[row.kind]}>{t(MEETING_KIND_LABELS[row.kind])}</Badge>
                        {row.grade !== null ? <span className="text-xs text-ink-500">{gradeLabel(row.grade, lang)}</span> : null}
                      </p>
                    </Td>
                    <Td className="max-w-sm">
                      <p className="line-clamp-2 text-sm text-ink-700">{row.agenda}</p>
                    </Td>
                    <Td>{row.minutes ? <Badge tone="green">{t('Written')}</Badge> : <Badge tone="amber">{t('Not written yet')}</Badge>}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<Handshake size={26} />}
            title={filtered ? t('No meetings match') : t('No meetings yet')}
            text={t('Write each meeting with its agenda before, and the resolutions after. The minutes print on the school letterhead.')}
            action={filtered ? undefined : <MeetingFormButton grades={grades} />}
          />
        )}
      </Card>
    </>
  );
}
