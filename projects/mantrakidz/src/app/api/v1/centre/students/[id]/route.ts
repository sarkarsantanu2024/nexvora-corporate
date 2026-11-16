/** GET one child, PATCH to change some of the child's details. */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { getStudent, updateStudent } from '@/server/centre/children/students';

export const GET = handle(async (_req, { params }) => {
  const ctx = await apiCentre();
  return ok(await getStudent(ctx, (await params).id));
});

export const PATCH = handle(async (req, { params }) => {
  const ctx = await apiCentre();
  const { id } = await params;
  const { student } = await getStudent(ctx, id);
  const body = (await req.json()) as Record<string, unknown>;
  // A partial update: what was sent is laid over what is stored, then checked as a whole.
  return ok(
    await updateStudent(ctx, id, {
      name: student.name,
      dob: student.dob,
      gender: student.gender as '' | 'Girl' | 'Boy',
      photo: student.photo,
      programmeId: student.programmeId ?? '',
      batchId: student.batchId,
      admissionDate: student.admissionDate,
      monthlyFee: student.monthlyFee,
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
      ...body,
    }),
  );
});
