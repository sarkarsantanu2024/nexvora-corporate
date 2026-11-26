import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { requirePlan } from '@/server/platform';
import { getStudent, sectionChoices } from '@/server/students/service';
import { StudentForm } from '../../student-form';

export const metadata: Metadata = { title: 'Edit student' };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const { id } = await params;
  const [found, choices] = await Promise.all([getStudent(session, id), sectionChoices(session)]);
  if (!found) notFound();
  const { student, current } = found;
  return (
    <>
      <PageHeader title={t('Edit {name}', { name: student.name })} back={{ href: `/admin/students/${student.id}`, label: student.name }} />
      <StudentForm
        studentId={student.id}
        sections={choices.sections}
        today={todayIST()}
        admissionHint=""
        initial={{
          name: student.name,
          nameBn: student.nameBn,
          gender: student.gender,
          dob: student.dob ?? '',
          photo: student.photo,
          fatherName: student.fatherName,
          motherName: student.motherName,
          guardianName: student.guardianName,
          guardianRelation: student.guardianRelation,
          phone: student.phone,
          altPhone: student.altPhone,
          email: student.email,
          address: student.address,
          category: student.category,
          religion: student.religion,
          bloodGroup: student.bloodGroup,
          portalId: student.portalId,
          admittedOn: student.admittedOn ?? '',
          admissionNo: student.admissionNo,
          sectionId: current?.sectionId ?? '',
          rollNo: current ? String(current.rollNo) : '',
        }}
      />
    </>
  );
}
