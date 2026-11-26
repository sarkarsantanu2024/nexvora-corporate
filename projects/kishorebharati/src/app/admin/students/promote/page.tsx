import { CalendarCheck2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, Notice, PageHeader } from '@/components/ui/core';
import { sectionLabel } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { requirePlan } from '@/server/platform';
import { isBoardGrade, loadPromotion, nextGrade } from '@/server/students/promotion';
import { sectionChoices } from '@/server/students/service';
import { FilterBar, readSearch, type Search } from '../../_ui/bits';
import { PromoteForm } from './promote-form';

export const metadata: Metadata = { title: 'Year end' };

export default async function PromotePage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const choices = await sectionChoices(session);
  const chosen = choices.sections.find((s) => s.id === params.section);
  const data = chosen ? await loadPromotion(session, chosen.id) : null;

  return (
    <>
      <PageHeader
        title={t('Year end')}
        back={{ href: '/admin/students', label: t('Students') }}
        description={t('One section at a time: mark each student promoted, detained, passed or left, and give him his class for next year. New roll numbers follow the old ones. You can open a section again and change it.')}
      />
      <FilterBar>
        <UrlSelect
          param="section"
          label={t('Section')}
          options={[{ value: '', label: t('Choose a section') }, ...choices.sections.map((s) => ({ value: s.id, label: `${sectionLabel(s, lang)} (${s.students})` }))]}
        />
      </FilterBar>

      {!data ? (
        <Card>
          <EmptyState icon={<CalendarCheck2 size={26} />} title={t('Choose a section')} text={t('Do this at the end of {year}, after the final results.', { year: choices.year.name })} />
        </Card>
      ) : !data.next ? (
        <Notice tone="amber">
          {t('Next year is not added yet.')}{' '}
          <Link href="/admin/classes?tab=years" className="font-semibold underline">
            {t('Add it from Classes and subjects')}
          </Link>
        </Notice>
      ) : !data.rows.length ? (
        <Card>
          <EmptyState icon={<CalendarCheck2 size={26} />} title={t('No students in this section')} />
        </Card>
      ) : !data.nextSections.length ? (
        <Notice tone="amber">
          {t('{year} has no sections yet.', { year: data.next.name })}{' '}
          <Link href={`/admin/classes?tab=sections&year=${data.next.id}`} className="font-semibold underline">
            {t('Add them from Classes and subjects')}
          </Link>
        </Notice>
      ) : (
        <PromoteForm
          sectionId={data.section.id}
          grade={data.section.grade}
          stream={data.section.stream}
          name={data.section.name}
          nextGrade={nextGrade(data.section.grade)}
          boardGrade={isBoardGrade(data.section.grade)}
          nextYear={data.next.name}
          nextSections={data.nextSections.map((s) => ({ id: s.id, grade: s.grade, label: sectionLabel(s, lang), name: s.name, stream: s.stream }))}
          rows={data.rows.map((row) => ({ ...row, placedIn: data.placed.find((p) => p.studentId === row.studentId)?.sectionId ?? '' }))}
        />
      )}
    </>
  );
}
