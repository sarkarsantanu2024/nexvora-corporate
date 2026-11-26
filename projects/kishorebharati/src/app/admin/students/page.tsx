import { CalendarCheck2, Download, GraduationCap, IdCard, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Avatar, Card, EmptyState, LinkButton, PageHeader, StatusBadge, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { SCHOOL, gradeLabel, sectionLabel } from '@/config/school';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { STUDENT_STATUS_LABELS } from '@/server/students/constants';
import { listStudents, sectionChoices } from '@/server/students/service';
import { ContactLinks, FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { StudentImport } from './student-import';

export const metadata: Metadata = { title: 'Students' };

export default async function StudentsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const office = isOffice(session);
  const [data, choices] = await Promise.all([listStudents(session, params), sectionChoices(session)]);
  const grades = [...new Set(choices.sections.map((s) => s.grade))];
  const sectionOptions = choices.sections.filter((s) => !params.grade || String(s.grade) === params.grade);
  const filtered = Boolean(params.q || params.grade || params.section || params.status || params.phone);

  return (
    <>
      <PageHeader
        title={t('Students')}
        description={
          office
            ? t('The admission register of {year}. Open a student for the full record, the parent login and certificates.', { year: data.year.name })
            : t('Students of your classes in {year}.', { year: data.year.name })
        }
        actions={
          office ? (
            <>
              <StudentImport />
              <LinkButton href="/admin/students/new">
                <Plus size={18} /> {t('Admit a student')}
              </LinkButton>
            </>
          ) : undefined
        }
      />

      {office ? (
        <div className="no-print mb-3 flex flex-wrap gap-2">
          <Link href={`/admin/students/id-cards${query({ section: params.section })}`} className={buttonClass('secondary', 'sm')}>
            <IdCard size={16} /> {t('ID cards')}
          </Link>
          <Link href={`/admin/students/promote${query({ section: params.section })}`} className={buttonClass('secondary', 'sm')}>
            <CalendarCheck2 size={16} /> {t('Year end')}
          </Link>
          <a href={`/admin/students/export${query({ q: params.q, grade: params.grade, section: params.section, status: params.status, phone: params.phone })}`} className={buttonClass('secondary', 'sm')}>
            <Download size={16} /> {t('Download list')}
          </a>
        </div>
      ) : null}

      <FilterBar>
        <SearchInput placeholder={t('Search name, admission number or mobile')} />
        <UrlSelect param="grade" label={t('Class')} options={[{ value: '', label: t('All classes') }, ...grades.map((g) => ({ value: String(g), label: gradeLabel(g, lang) }))]} />
        <UrlSelect param="section" label={t('Section')} options={[{ value: '', label: t('All sections') }, ...sectionOptions.map((s) => ({ value: s.id, label: sectionLabel(s, lang) }))]} />
        <UrlSelect
          param="status"
          label={t('Status')}
          options={[
            { value: '', label: t('On roll') },
            { value: 'left', label: t('Left') },
            { value: 'passed_out', label: t('Passed out') },
            { value: 'all', label: t('Everyone') },
          ]}
        />
        {params.phone === 'none' ? (
          <Link href={`/admin/students${query({ ...params, phone: '', page: '' })}`} className="text-sm font-semibold text-brand-700 hover:underline">
            {t('Showing students with no mobile number')} ×
          </Link>
        ) : null}
      </FilterBar>

      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Student')}</Th>
                  <Th>{t('Class')}</Th>
                  <Th>{t('Roll')}</Th>
                  <Th>{t('Guardian')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <Link href={`/admin/students/${row.id}`} className="flex items-center gap-3">
                        <Avatar name={row.name} src={row.photo} size={36} />
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink-900 hover:text-brand-700">{row.name}</span>
                          <span className="block text-xs text-ink-500">{[row.nameBn, row.admissionNo].filter(Boolean).join(' · ')}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">{row.grade !== null ? sectionLabel({ grade: row.grade, name: row.sectionName ?? '', stream: row.stream ?? '', shift: row.shift ?? 'day' }, lang) : <span className="text-ink-400">{t('No class this year')}</span>}</Td>
                    <Td className="tabular">{row.rollNo ?? ''}</Td>
                    <Td>
                      <p className="text-ink-800">{row.guardianName || row.fatherName}</p>
                      <p className="tabular text-xs text-ink-500">{row.phone || t('No mobile number')}</p>
                    </Td>
                    <Td>
                      <StatusBadge status={row.status} label={t(STUDENT_STATUS_LABELS[row.status])} />
                    </Td>
                    <Td className="text-right">
                      <ContactLinks phone={row.phone} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<GraduationCap size={26} />}
            title={filtered ? t('No students match') : office ? t('No students yet') : t('No students in your classes yet')}
            text={
              filtered
                ? t('Try another class, status or search.')
                : office
                  ? t('Admit students one by one, or bring the whole register in from a spreadsheet. Classes {from} to {to} are set up in Classes and subjects.', { from: SCHOOL.grades[0], to: SCHOOL.grades[SCHOOL.grades.length - 1] })
                  : t('The office places students in your classes.')
            }
            action={
              !filtered && office ? (
                <LinkButton href="/admin/students/new">
                  <Plus size={18} /> {t('Admit a student')}
                </LinkButton>
              ) : undefined
            }
          />
        )}
      </Card>
    </>
  );
}
