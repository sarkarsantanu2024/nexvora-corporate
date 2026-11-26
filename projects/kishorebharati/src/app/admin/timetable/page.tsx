import { CalendarClock } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PrintButton, UrlSelect } from '@/components/ui/client';
import { Card, CardBody, CardHeader, EmptyState, LinkButton, PageHeader, TabLinks } from '@/components/ui/core';
import { DailyPrintHead, PrintSetup } from '@/components/school/daily-print-head';
import { SCHOOL, gradeLabel, sectionLabel } from '@/config/school';
import { getDb } from '@/db';
import { teachingAssignments } from '@/db/schema';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { todayIST, weekday } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/server/admin/shared';
import { visibleSections } from '@/server/daily/shared';
import { requirePlan } from '@/server/platform';
import { isOffice, staffOf } from '@/server/school/access';
import { SCHOOL_DAYS, clock, periodsFor } from '@/server/timetable/defaults';
import { getTimetableSettings, sectionTimetable, subjectsForSection, teacherChoices, teacherTimetable } from '@/server/timetable/service';
import { readSearch, type Search } from '../_ui/bits';
import { PeriodForm } from './period-form';
import { TimetableGrid, type GridCell } from './timetable-grid';

export const metadata: Metadata = { title: 'Timetable' };

type Tab = 'section' | 'teacher' | 'periods';

export default async function TimetablePage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const params = await readSearch(searchParams);
  const office = isOffice(session);
  const admin = isAdmin(session);
  const tab: Tab = params.tab === 'periods' && admin ? 'periods' : params.tab === 'section' ? 'section' : params.tab === 'teacher' ? 'teacher' : office ? 'section' : 'teacher';
  const visible = await visibleSections(session);
  const sectionId = visible.sections.some((row) => row.id === params.section) ? params.section : (visible.sections[0]?.id ?? '');
  const teachers = office ? await teacherChoices() : [];
  const staffId = office ? (teachers.some((row) => row.id === params.staff) ? params.staff : (teachers[0]?.id ?? '')) : '';

  if (tab === 'section' && sectionId && params.section !== sectionId) redirect(`/admin/timetable?tab=section&section=${sectionId}`);
  if (tab === 'teacher' && office && staffId && params.staff !== staffId) redirect(`/admin/timetable?tab=teacher&staff=${staffId}`);

  const dow = weekday(todayIST());
  return (
    <>
      {tab !== 'periods' ? <PrintSetup landscape /> : null}
      <PageHeader
        title={t('Timetable')}
        description={
          tab === 'periods'
            ? t('The times of the periods, and when each class goes home.')
            : office
              ? t('Tap a period to set the subject and the teacher. A teacher in two classes at the same time is caught before saving.')
              : t('Your periods for the week, and the timetable of your classes.')
        }
        actions={tab !== 'periods' ? <PrintButton /> : undefined}
      />
      <TabLinks
        active={tab}
        tabs={[
          { key: 'section', label: t('By class'), href: `/admin/timetable?tab=section${sectionId ? `&section=${sectionId}` : ''}` },
          { key: 'teacher', label: office ? t('By teacher') : t('My timetable'), href: '/admin/timetable?tab=teacher' },
          ...(admin ? [{ key: 'periods', label: t('Period times'), href: '/admin/timetable?tab=periods' }] : []),
        ]}
      />

      {tab === 'periods' ? (
        <Card className="max-w-4xl">
          <CardHeader title={t('Period times')} description={t('The day starts at 10.50 am. Class V goes home at 3.20 pm, Class VI at 4.00 pm, Classes VII to XII at 4.30 pm, and everyone at 1.30 pm on Saturday. The periods in between are a starting split: change them to the school’s own.')} />
          <CardBody>
            <PeriodForm initial={await getTimetableSettings()} grades={SCHOOL.grades.map((grade) => ({ grade, label: gradeLabel(grade, lang) }))} />
          </CardBody>
        </Card>
      ) : tab === 'section' ? (
        !sectionId ? (
          <Card>
            <EmptyState icon={<CalendarClock size={26} />} title={office ? t('No classes this year yet') : t('You have no class yet')} action={office ? <LinkButton href="/admin/classes">{t('Go to Classes and subjects')}</LinkButton> : undefined} />
          </Card>
        ) : (
          <SectionWeek sectionId={sectionId} options={visible.sections.map((row) => ({ value: row.id, label: sectionLabel(row, lang) }))} edit={office} today={dow} />
        )
      ) : (
        <TeacherWeek staffId={office ? staffId : undefined} options={teachers.map((row) => ({ value: row.id, label: row.name }))} today={dow} />
      )}
    </>
  );

  async function SectionWeek({ sectionId, options, edit, today }: { sectionId: string; options: { value: string; label: string }[]; edit: boolean; today: number }) {
    const data = await sectionTimetable(session, sectionId);
    const label = sectionLabel(data.section, lang);
    const days = SCHOOL_DAYS.map((day) => ({ day, periods: periodsFor(data.settings, data.section.grade, day) }));
    const cells: Record<string, GridCell> = {};
    for (const slot of data.slots) {
      cells[`${slot.day}:${slot.period}`] = { title: (lang === 'bn' && slot.subjectBn) || slot.subject || t('No subject'), sub: slot.teacher + (slot.room ? ` · ${slot.room}` : ''), subjectId: slot.subjectId, staffId: slot.staffId, room: slot.room };
    }
    let editProps: Parameters<typeof TimetableGrid>[0]['edit'];
    if (edit) {
      const db = await getDb();
      const [subjects, assigned] = await Promise.all([subjectsForSection(data.section), db.select().from(teachingAssignments).where(eq(teachingAssignments.sectionId, data.section.id))]);
      editProps = {
        sectionId: data.section.id,
        subjects: subjects.map((row) => ({ id: row.id, label: (lang === 'bn' && row.nameBn) || row.name })),
        teachers: teachers.map((row) => ({ id: row.id, label: row.name })),
        sectionNames: Object.fromEntries(visible.sections.map((row) => [row.id, sectionLabel(row, lang)])),
        suggested: Object.fromEntries(assigned.map((row) => [row.subjectId, row.staffId])),
      };
    }
    return (
      <>
        <div className="filter-bar no-print mb-4 flex flex-wrap items-center gap-2">
          <UrlSelect param="section" label={t('Class')} options={options} />
        </div>
        <Card className="print-plain p-3 sm:p-4">
          <DailyPrintHead title={t('Timetable')} subtitle={label} />
          <h2 className="mb-3 font-display text-lg font-bold text-ink-900 print:hidden">{label}</h2>
          <TimetableGrid days={days} cells={cells} edit={editProps} today={today} />
        </Card>
      </>
    );
  }

  async function TeacherWeek({ staffId, options, today }: { staffId?: string; options: { value: string; label: string }[]; today: number }) {
    if (office && !staffId) {
      return (
        <Card>
          <EmptyState icon={<CalendarClock size={26} />} title={t('No teachers on the list')} action={<LinkButton href="/admin/staff">{t('Go to Teachers and staff')}</LinkButton>} />
        </Card>
      );
    }
    if (!office && !(await staffOf(session))) {
      return (
        <Card>
          <EmptyState icon={<CalendarClock size={26} />} title={t('Your login is not linked to the staff list. Ask the office.')} />
        </Card>
      );
    }
    const data = await teacherTimetable(session, staffId);
    const settings = data.settings;
    // A teacher's week uses the longest day of the classes they teach.
    const grades = [...new Set(data.slots.map((slot) => slot.section.grade))];
    const longest = (day: number) => (grades.length ? grades.map((g) => periodsFor(settings, g, day)).sort((a, b) => b.length - a.length)[0] : day === 6 ? settings.saturday : settings.weekday);
    const days = SCHOOL_DAYS.map((day) => ({ day, periods: longest(day) }));
    const cells: Record<string, GridCell> = {};
    for (const slot of data.slots) {
      cells[`${slot.day}:${slot.period}`] = { title: sectionLabel(slot.section, lang), sub: (lang === 'bn' && slot.subjectBn) || slot.subject };
    }
    const count = data.slots.length;
    return (
      <>
        {office ? (
          <div className="filter-bar no-print mb-4 flex flex-wrap items-center gap-2">
            <UrlSelect param="staff" label={t('Teacher')} options={options} />
          </div>
        ) : null}
        <Card className="print-plain p-3 sm:p-4">
          <DailyPrintHead title={t('Timetable of {name}', { name: data.person.name })} />
          <div className="mb-3 print:hidden">
            <h2 className="font-display text-lg font-bold text-ink-900">{data.person.name}</h2>
            <p className="text-sm text-ink-500">
              {t('{n} periods a week', { n: count })} · {t('School starts at {time}', { time: clock(settings.weekday[0]?.start ?? '10:50') })}
            </p>
          </div>
          {count ? (
            <TimetableGrid days={days} cells={cells} today={today} />
          ) : (
            <EmptyState icon={<CalendarClock size={26} />} title={t('No periods yet')} text={t('The office sets the timetable class by class. Your periods show here once it is done.')} />
          )}
        </Card>
      </>
    );
  }
}
