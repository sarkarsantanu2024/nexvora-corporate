import type { Metadata } from 'next';
import { EmptyState, Notice, PageHeader } from '@/components/ui/core';
import { UrlSelect } from '@/components/ui/client';
import { IdCard } from 'lucide-react';
import { sectionLabel } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { getSetting } from '@/server/admin/shared';
import { requirePlan } from '@/server/platform';
import { sectionChoices, sectionRoster, studentsByIds } from '@/server/students/service';
import { FilterBar, readSearch, type Search } from '../../_ui/bits';
import { IdCardSheet, type CardStudent } from './id-card-sheet';

export const metadata: Metadata = { title: 'ID cards' };

export default async function IdCardsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const [choices, school] = await Promise.all([sectionChoices(session), getSetting('school')]);

  let rows: Awaited<ReturnType<typeof studentsByIds>> = [];
  if (params.ids) rows = await studentsByIds(session, params.ids.split(','));
  else if (params.section && choices.sections.some((s) => s.id === params.section)) rows = (await sectionRoster(session, params.section)).rows.filter((row) => row.status === 'active');

  const cards: CardStudent[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    nameBn: row.nameBn,
    photo: row.photo,
    admissionNo: row.admissionNo,
    bloodGroup: row.bloodGroup,
    phone: row.phone,
    dob: row.dob,
    rollNo: row.rollNo,
    className: row.grade !== null ? sectionLabel({ grade: row.grade, name: row.sectionName ?? '', stream: row.stream ?? '', shift: row.shift ?? 'day' }, lang) : '',
  }));

  return (
    <>
      <PageHeader
        title={t('ID cards')}
        back={{ href: '/admin/students', label: t('Students') }}
        description={t('Ten cards of 88 × 56 mm to an A4 sheet, with cut marks. Print on card paper and cut along the lines.')}
      />
      {params.ids ? null : (
        <FilterBar>
          <UrlSelect param="section" label={t('Section')} options={[{ value: '', label: t('Choose a section') }, ...choices.sections.map((s) => ({ value: s.id, label: sectionLabel(s, lang) }))]} />
        </FilterBar>
      )}
      {cards.length ? (
        <>
          {cards.some((card) => !card.photo) ? <Notice tone="amber" className="no-print mb-4">{t('Some students have no photo yet. Add it from the student’s page, or the card prints with initials.')}</Notice> : null}
          <IdCardSheet
            cards={cards}
            year={choices.year.name}
            school={{ name: school.high.name, nameBn: school.high.nameBn, address: school.high.address, phone: school.high.phone, udise: school.high.udise }}
          />
        </>
      ) : (
        <EmptyState
          icon={<IdCard size={26} />}
          title={params.ids || params.section ? t('No students to print') : t('Choose a section')}
          text={t('Pick a section to print the cards of its students. For one student, use ID card on his page.')}
        />
      )}
    </>
  );
}
