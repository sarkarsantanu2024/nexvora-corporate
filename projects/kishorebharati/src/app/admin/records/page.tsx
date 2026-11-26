import { ClipboardList } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DailyPrintHead } from '@/components/school/daily-print-head';
import { DeleteRecordButton, RecordFormButton } from '@/components/school/student-record-form';
import { RECORD_ICONS, RECORD_TONES, RecordDetails } from '@/components/school/student-records';
import { Pagination, PrintButton, SearchInput, UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { SCHOOL, gradeLabel, sectionLabel } from '@/config/school';
import { STUDENT_RECORD_KINDS } from '@/db/schema';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { RECORD_KIND_LABELS } from '@/server/office/labels';
import { listRecords } from '@/server/office/records';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { FilterBar, readSearch, type Search } from '../_ui/bits';

export const metadata: Metadata = { title: 'Student records' };

export default async function RecordsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const params = await readSearch(searchParams);
  const office = isOffice(session);
  const data = await listRecords(session, { kind: params.kind, grade: params.grade, q: params.q, page: params.page });
  const filtered = Boolean(params.kind || params.grade || params.q);

  return (
    <>
      <PageHeader
        title={t('Student records')}
        description={office ? t('Achievements, discipline notes and health check-ups of the students.') : t('Achievements, discipline notes and health check-ups of the boys in your classes.')}
        actions={
          <>
            {/* Printing is a desk job; on a phone the add button keeps the heading row. */}
            <span className="max-sm:hidden">
              <PrintButton />
            </span>
            {office ? <RecordFormButton /> : null}
          </>
        }
      />
      <FilterBar>
        <SearchInput placeholder={t('Search name or admission number')} />
        <UrlSelect param="kind" label={t('Kind of record')} options={[{ value: '', label: t('All kinds') }, ...STUDENT_RECORD_KINDS.map((kind) => ({ value: kind, label: t(RECORD_KIND_LABELS[kind]) }))]} />
        <UrlSelect param="grade" label={t('Class')} options={[{ value: '', label: t('All classes') }, ...SCHOOL.grades.map((grade) => ({ value: String(grade), label: gradeLabel(grade, lang) }))]} />
      </FilterBar>
      <DailyPrintHead
        title={params.kind && params.kind in RECORD_KIND_LABELS ? t(RECORD_KIND_LABELS[params.kind as keyof typeof RECORD_KIND_LABELS]) : t('Student records')}
        subtitle={params.grade ? gradeLabel(Number(params.grade), lang) : undefined}
      />
      <Card className="print:border-0 print:shadow-none">
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Student')}</Th>
                  <Th>{t('Kind')}</Th>
                  <Th>{t('Date')}</Th>
                  <Th>{t('Details')}</Th>
                  {office ? <Th className="no-print" /> : null}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.record.id}>
                    <Td>
                      <Link href={`/admin/students/${row.record.studentId}`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {row.studentName}
                      </Link>
                      <p className="text-xs text-ink-500">
                        {row.grade !== null ? sectionLabel({ grade: row.grade, name: row.sectionName ?? '', stream: row.stream ?? '', shift: row.shift ?? 'day' }, lang) : row.admissionNo}
                      </p>
                    </Td>
                    <Td>
                      <Badge tone={RECORD_TONES[row.record.kind]}>
                        {RECORD_ICONS[row.record.kind]} {t(RECORD_KIND_LABELS[row.record.kind])}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap">{formatDate(row.record.day)}</Td>
                    <Td className="min-w-[220px] max-w-lg">
                      <RecordDetails record={row.record} t={t} />
                    </Td>
                    {office ? (
                      <Td className="no-print text-right">
                        <DeleteRecordButton id={row.record.id} />
                      </Td>
                    ) : null}
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<ClipboardList size={26} />}
            title={filtered ? t('No records match') : t('No records yet')}
            text={office ? t('Add a prize won, a discipline note or a health check-up. It also shows on the student’s own page.') : t('Records the office adds for the boys of your classes show here.')}
            action={office && !filtered ? <RecordFormButton /> : undefined}
          />
        )}
      </Card>
    </>
  );
}
