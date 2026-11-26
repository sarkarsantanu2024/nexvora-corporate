'use server';

/**
 * Server actions for the children side of the centre dashboard. Each one
 * finds out who is asking, hands over to a service, and refreshes the screens
 * that show the changed data. The rules themselves live in the services.
 */
import { revalidatePath, revalidateTag } from 'next/cache';
import { action } from '@/lib/api';
import { requireCentre } from '@/lib/auth';
import * as attendance from './attendance';
import * as batches from './batches';
import * as enquiries from './enquiries';
import * as staff from './staff';
import * as students from './students';

// 'site-data' is the cache tag of the public website's centre and class reads.
const refresh = (...paths: string[]) => {
  paths.forEach((path) => revalidatePath(path, 'layout'));
  revalidateTag('site-data');
};

/* enquiries */

export const createEnquiryAction = action(async (input: enquiries.EnquiryInput) => {
  const row = await enquiries.createEnquiry(await requireCentre(), input);
  refresh('/centre/enquiries');
  return { id: row.id };
});

export const updateEnquiryAction = action(async (id: string, input: enquiries.EnquiryInput) => {
  await enquiries.updateEnquiry(await requireCentre(), id, input);
  refresh('/centre/enquiries');
});

export const setEnquiryStageAction = action(async (id: string, input: enquiries.StageInput) => {
  await enquiries.setEnquiryStage(await requireCentre(), id, input);
  refresh('/centre/enquiries');
});

export const setEnquiryFollowUpAction = action(async (id: string, nextFollowUp: string) => {
  await enquiries.setEnquiryFollowUp(await requireCentre(), id, { nextFollowUp });
  refresh('/centre/enquiries');
});

export const addEnquiryNoteAction = action(async (id: string, note: string) => {
  await enquiries.addEnquiryNote(await requireCentre(), id, { note });
  refresh('/centre/enquiries');
});

export const deleteEnquiryAction = action(async (id: string) => {
  await enquiries.deleteEnquiry(await requireCentre(), id);
  refresh('/centre/enquiries');
});

/* children */

export const admitStudentAction = action(async (input: students.StudentInput, enquiryId?: string | null) => {
  const row = await students.admitStudent(await requireCentre(), input, { enquiryId });
  refresh('/centre');
  return { id: row.id };
});

export const updateStudentAction = action(async (id: string, input: students.StudentInput) => {
  await students.updateStudent(await requireCentre(), id, input);
  refresh('/centre');
});

export const moveStudentAction = action(async (id: string, batchId: string) => {
  const result = await students.moveStudent(await requireCentre(), id, { batchId });
  refresh('/centre');
  return result;
});

export const markStudentLeftAction = action(async (id: string, input: { leftOn: string; reason: string }) => {
  await students.markStudentLeft(await requireCentre(), id, input);
  refresh('/centre');
});

export const readmitStudentAction = action(async (id: string) => {
  await students.readmitStudent(await requireCentre(), id);
  refresh('/centre');
});

export const deleteStudentAction = action(async (id: string) => {
  await students.deleteStudent(await requireCentre(), id);
  refresh('/centre');
});

export const importChildrenAction = action(async (rows: Record<string, string>[]) => {
  const result = await students.importChildren(await requireCentre(), rows);
  refresh('/centre');
  return result;
});

export const addStudentNoteAction = action(async (id: string, note: string) => {
  await students.addStudentNote(await requireCentre(), id, { note });
  refresh('/centre/students');
});

export const createParentLoginAction = action(async (studentId: string) => {
  const result = await students.createParentLogin(await requireCentre(), studentId);
  refresh('/centre/students');
  return { username: result.username, password: result.password, children: result.children };
});

export const resetParentPasswordAction = action(async (studentId: string) => {
  const result = await students.resetParentPassword(await requireCentre(), studentId);
  refresh('/centre/students');
  return result;
});

export const promoteStudentsAction = action(async (input: students.PromoteInput) => {
  const result = await students.promoteStudents(await requireCentre(), input);
  refresh('/centre');
  return result;
});

/* classes */

export const createBatchAction = action(async (input: batches.BatchInput) => {
  await batches.createBatch(await requireCentre(), input);
  refresh('/centre');
});

export const updateBatchAction = action(async (id: string, input: batches.BatchInput) => {
  await batches.updateBatch(await requireCentre(), id, input);
  refresh('/centre');
});

export const setBatchActiveAction = action(async (id: string, active: boolean) => {
  await batches.setBatchActive(await requireCentre(), id, active);
  refresh('/centre');
});

export const deleteBatchAction = action(async (id: string) => {
  await batches.deleteBatch(await requireCentre(), id);
  refresh('/centre');
});

/* attendance */

export const saveAttendanceAction = action(async (input: attendance.SaveAttendanceInput) => {
  const result = await attendance.saveAttendance(await requireCentre(), input);
  refresh('/centre');
  return result;
});

export const markHolidayAction = action(async (input: { day: string; batchId?: string | null }) => {
  const result = await attendance.markHoliday(await requireCentre(), input);
  refresh('/centre');
  return result;
});

export const saveStaffAttendanceAction = action(async (input: { day: string; marks: { staffId: string; status: 'present' | 'absent' | 'leave' }[] }) => {
  const result = await attendance.saveStaffAttendance(await requireCentre(), input);
  refresh('/centre/attendance');
  return result;
});

/* staff, logins, settings */

export const createStaffAction = action(async (input: staff.StaffInput) => {
  await staff.createStaff(await requireCentre(), input);
  refresh('/centre');
});

export const updateStaffAction = action(async (id: string, input: staff.StaffInput) => {
  await staff.updateStaff(await requireCentre(), id, input);
  refresh('/centre');
});

export const markStaffLeftAction = action(async (id: string, leftOn: string) => {
  await staff.markStaffLeft(await requireCentre(), id, { leftOn });
  refresh('/centre');
});

export const rejoinStaffAction = action(async (id: string) => {
  await staff.rejoinStaff(await requireCentre(), id);
  refresh('/centre');
});

export const deleteStaffAction = action(async (id: string) => {
  await staff.deleteStaff(await requireCentre(), id);
  refresh('/centre');
});

export const proposeUsernameAction = action(async (name: string) => staff.proposeUsername(await requireCentre(), name));

export const createStaffLoginAction = action(async (staffId: string, username: string) => {
  const result = await staff.createStaffLogin(await requireCentre(), staffId, { username });
  refresh('/centre/staff', '/centre/settings');
  return result;
});

export const removeStaffLoginAction = action(async (staffId: string) => {
  await staff.removeStaffLogin(await requireCentre(), staffId);
  refresh('/centre/staff', '/centre/settings');
});

export const resetLoginPasswordAction = action(async (userId: string) => {
  const result = await staff.resetLoginPassword(await requireCentre(), userId);
  refresh('/centre/settings');
  return result;
});

export const setLoginActiveAction = action(async (userId: string, active: boolean) => {
  await staff.setLoginActive(await requireCentre(), userId, active);
  refresh('/centre/staff', '/centre/settings');
});

export const updateCentreProfileAction = action(async (input: staff.CentreProfileInput) => {
  await staff.updateCentreProfile(await requireCentre(), input);
  refresh('/centre');
});
