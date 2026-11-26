import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/core';
import { SCHOOL } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { getSetting } from '@/server/admin/shared';
import { requirePlan } from '@/server/platform';
import { formatAdmissionNo } from '@/server/students/constants';
import { sectionChoices } from '@/server/students/service';
import { StudentForm } from '../student-form';

export const metadata: Metadata = { title: 'Admit a student' };

export default async function NewStudentPage() {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const [choices, settings] = await Promise.all([sectionChoices(session), getSetting('students')]);
  const today = todayIST();
  return (
    <>
      <PageHeader title={t('Admit a student')} back={{ href: '/admin/students', label: t('Students') }} description={t('Admission for the school year {year}.', { year: choices.year.name })} />
      <StudentForm
        sections={choices.sections}
        today={today}
        admissionHint={formatAdmissionNo(settings.admissionFormat, 215, choices.year.name)}
        initial={{
          name: '',
          nameBn: '',
          gender: SCHOOL.students === 'girls' ? 'female' : 'male',
          dob: '',
          photo: '',
          fatherName: '',
          motherName: '',
          guardianName: '',
          guardianRelation: '',
          phone: '',
          altPhone: '',
          email: '',
          address: '',
          category: 'GEN',
          religion: '',
          bloodGroup: '',
          portalId: '',
          admittedOn: today,
          admissionNo: '',
          sectionId: '',
          rollNo: '',
        }}
      />
    </>
  );
}
