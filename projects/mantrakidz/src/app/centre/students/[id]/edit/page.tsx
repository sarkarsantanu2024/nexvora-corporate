import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/core';
import { requireCentre } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getStudent } from '@/server/centre/children/students';
import { orNotFound, studentFormData } from '../../form-data';
import { StudentForm } from '../../student-form';

export const metadata: Metadata = { title: 'Edit child' };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCentre();
  const { id } = await params;
  const { student } = await orNotFound(getStudent(ctx, id));
  const form = await studentFormData(ctx, student.batchId);

  return (
    <>
      <PageHeader back={{ href: `/centre/students/${student.id}`, label: student.name }} title={`Edit ${student.name}`} description={`Admission number ${student.admissionNo}`} />
      <StudentForm
        {...form}
        today={todayIST()}
        studentId={student.id}
        cancelHref={`/centre/students/${student.id}`}
        initial={{
          name: student.name,
          dob: student.dob ?? '',
          gender: student.gender,
          photo: student.photo,
          programmeId: student.programmeId ?? '',
          batchId: student.batchId ?? '',
          admissionDate: student.admissionDate,
          monthlyFee: student.monthlyFee === null ? '' : String(student.monthlyFee),
          fatherName: student.fatherName,
          motherName: student.motherName,
          guardianPhone: student.guardianPhone,
          altPhone: student.altPhone,
          email: student.email,
          address: student.address,
          bloodGroup: student.bloodGroup,
          medicalNotes: student.medicalNotes,
          pickupPerson: student.pickupPerson,
          tshirtSize: student.tshirtSize,
        }}
      />
    </>
  );
}
