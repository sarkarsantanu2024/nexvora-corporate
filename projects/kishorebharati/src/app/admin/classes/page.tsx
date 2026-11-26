import { BookOpen, School } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, StatusBadge, TabLinks, Table, Td, Th, Tr } from '@/components/ui/core';
import { STREAM_LABELS, gradeLabel, sectionLabel } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { listAssignments, listSections, listSubjects, listYears, teachingStaff } from '@/server/classes/service';
import { requirePlan } from '@/server/platform';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { AssignmentPicker, DeleteSection, MakeCurrent, SectionForm, SubjectForm, SubjectSwitch, YearForm } from './class-tools';

export const metadata: Metadata = { title: 'Classes and subjects' };

const TABS = ['sections', 'years', 'subjects', 'teachers'] as const;

export default async function ClassesPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const l = lang === 'bn' ? 'bn' : 'en';
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const tab = (TABS as readonly string[]).includes(params.tab) ? params.tab : 'sections';
  const years = await listYears(session);
  const current = years.find((y) => y.isCurrent) ?? years[years.length - 1];
  const year = years.find((y) => y.id === params.year) ?? current;
  const teachers = await teachingStaff();
  const teacherOptions = teachers.map((row) => ({ id: row.id, name: lang === 'bn' && row.nameBn ? row.nameBn : row.name }));

  const tabs = [
    { key: 'sections', label: t('Sections'), href: `/admin/classes?tab=sections${year && year !== current ? `&year=${year.id}` : ''}` },
    { key: 'years', label: t('School years'), href: '/admin/classes?tab=years' },
    { key: 'subjects', label: t('Subjects'), href: '/admin/classes?tab=subjects' },
    { key: 'teachers', label: t('Who teaches what'), href: '/admin/classes?tab=teachers' },
  ];

  let body: ReactNode = null;

  if (!year) {
    body = (
      <Card>
        <EmptyState icon={<School size={26} />} title={t('No school year yet')} text={t('Add the school year first; its sections come next.')} action={<YearForm suggested={String(new Date().getFullYear())} hasCurrent={false} />} />
      </Card>
    );
  } else if (tab === 'years') {
    body = (
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>{t('Year')}</Th>
              <Th>{t('Runs')}</Th>
              <Th>{t('Sections')}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {[...years].reverse().map((row) => (
              <Tr key={row.id}>
                <Td className="tabular font-semibold">
                  {row.name} {row.isCurrent ? <Badge tone="green">{t('Current')}</Badge> : null}
                </Td>
                <Td className="whitespace-nowrap">
                  {formatDate(row.startsOn)} – {formatDate(row.endsOn)}
                </Td>
                <Td>
                  <Link href={`/admin/classes?tab=sections&year=${row.id}`} className="font-semibold text-brand-700 hover:underline">
                    {t('{n} sections', { n: row.sections })}
                  </Link>
                </Td>
                <Td className="text-right">{row.isCurrent ? null : <MakeCurrent id={row.id} name={row.name} />}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    );
  } else if (tab === 'sections') {
    const sections = await listSections(session, year.id);
    body = (
      <>
        {years.length > 1 ? (
          <FilterBar>
            <UrlSelect param="year" label={t('Year')} options={[...years].reverse().map((y) => ({ value: y.id === current?.id ? '' : y.id, label: y.isCurrent ? `${y.name} (${t('Current')})` : y.name }))} />
          </FilterBar>
        ) : null}
        <Card>
          {sections.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>{t('Section')}</Th>
                  <Th>{t('Class teacher')}</Th>
                  <Th>{t('Room')}</Th>
                  <Th>{t('Students')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {sections.map((row) => (
                  <Tr key={row.id}>
                    <Td className="font-semibold text-ink-900">
                      <Link href={`/admin/students?section=${row.id}`} className="hover:text-brand-700">
                        {sectionLabel(row, lang)}
                      </Link>
                    </Td>
                    <Td>{row.classTeacherId ? (teacherOptions.find((x) => x.id === row.classTeacherId)?.name ?? row.classTeacher) : <span className="text-ink-400">{t('Not chosen')}</span>}</Td>
                    <Td>{row.room}</Td>
                    <Td className="tabular">
                      {row.students} / {row.capacity}
                    </Td>
                    <Td className="text-right">
                      <span className="inline-flex gap-1.5">
                        <SectionForm yearId={year.id} section={row} teachers={teacherOptions} />
                        {row.students === 0 ? <DeleteSection id={row.id} label={sectionLabel(row, lang)} /> : null}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon={<School size={26} />} title={t('No sections in {year}', { year: year.name })} text={t('Add a section for each class: Class 5 A, Class 5 B and so on.')} action={<SectionForm yearId={year.id} teachers={teacherOptions} />} />
          )}
        </Card>
      </>
    );
  } else if (tab === 'subjects') {
    const subjects = await listSubjects(session);
    body = (
      <Card>
        {subjects.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t('Subject')}</Th>
                <Th>{t('Classes')}</Th>
                <Th>{t('Stream')}</Th>
                <Th>{t('Status')}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {subjects.map((row) => (
                <Tr key={row.id} className={row.active ? '' : 'opacity-60'}>
                  <Td>
                    <p className="font-semibold text-ink-900">{lang === 'bn' && row.nameBn ? row.nameBn : row.name}</p>
                    <p className="text-xs text-ink-500">{[lang === 'bn' ? (row.nameBn ? row.name : '') : row.nameBn, row.code, row.optional ? t('Optional') : ''].filter(Boolean).join(' · ')}</p>
                  </Td>
                  <Td className="whitespace-nowrap">{row.fromGrade === row.toGrade ? gradeLabel(row.fromGrade, lang) : `${gradeLabel(row.fromGrade, lang)} – ${gradeLabel(row.toGrade, lang)}`}</Td>
                  <Td>{row.stream ? STREAM_LABELS[row.stream][l] : t('All')}</Td>
                  <Td>
                    <StatusBadge status={row.active ? 'active' : 'inactive'} label={row.active ? t('Taught') : t('Switched off')} />
                  </Td>
                  <Td className="text-right">
                    <span className="inline-flex gap-1.5">
                      <SubjectForm subject={row} />
                      <SubjectSwitch id={row.id} active={row.active} />
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={<BookOpen size={26} />} title={t('No subjects yet')} action={<SubjectForm />} />
        )}
      </Card>
    );
  } else {
    const sections = await listSections(session, year.id);
    const chosen = sections.find((s) => s.id === params.section) ?? sections[0];
    const data = chosen ? await listAssignments(session, chosen.id) : null;
    body = (
      <>
        <FilterBar>
          <UrlSelect param="section" label={t('Section')} options={sections.map((s) => ({ value: s.id === sections[0]?.id ? '' : s.id, label: sectionLabel(s, lang) }))} />
        </FilterBar>
        <Card>
          {data && data.rows.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>{t('Subject')}</Th>
                  <Th>{t('Teacher')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(({ subject, staffId }) => (
                  <Tr key={subject.id}>
                    <Td className="font-semibold text-ink-900">{lang === 'bn' && subject.nameBn ? subject.nameBn : subject.name}</Td>
                    <Td>
                      <AssignmentPicker sectionId={data.section.id} subjectId={subject.id} staffId={staffId} teachers={teacherOptions} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon={<BookOpen size={26} />} title={t('No subjects for this section')} text={t('Add subjects for this class in the Subjects tab.')} />
          )}
        </Card>
        <p className="mt-3 text-sm text-ink-500">{t('A teacher sees the sections where he teaches a subject, and can enter marks and the diary for that subject. The class teacher also takes the register.')}</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('Classes and subjects')}
        description={year ? t('School year {year}. The sections, the subjects and who teaches them.', { year: year.name }) : undefined}
        actions={
          year && tab === 'sections' ? (
            <SectionForm yearId={year.id} teachers={teacherOptions} />
          ) : tab === 'years' ? (
            <YearForm suggested={String(Number(years[years.length - 1]?.name ?? new Date().getFullYear()) + 1)} hasCurrent={Boolean(current)} />
          ) : tab === 'subjects' ? (
            <SubjectForm />
          ) : undefined
        }
      />
      <TabLinks tabs={tabs} active={tab} />
      {body}
    </>
  );
}
