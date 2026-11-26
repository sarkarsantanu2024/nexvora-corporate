'use server';

/** Server actions of the Students screens: who is asking, the service, then refresh. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { ADMIN_ONLY, TEAM_ROLES, requireSession } from '@/lib/auth';
import * as promotion from './promotion';
import * as service from './service';

// The overview counts students too, so the whole area is refreshed.
const refresh = () => revalidatePath('/admin', 'layout');

export const admitStudentAction = action(async (input: service.StudentInput) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await service.admitStudent(session, input);
  refresh();
  return result;
});

export const updateStudentAction = action(async (id: string, input: service.StudentInput) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await service.updateStudent(session, id, input);
  refresh();
  return result;
});

export const setStudentPhotoAction = action(async (id: string, photo: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.setStudentPhoto(session, id, photo);
  refresh();
});

export const markStudentLeftAction = action(async (id: string, input: { leftOn: string; reason: string }) => {
  const session = await requireSession(TEAM_ROLES);
  await service.markStudentLeft(session, id, input);
  refresh();
});

export const markStudentBackAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.markStudentBack(session, id);
  refresh();
});

export const trashStudentAction = action(async (id: string) => {
  const session = await requireSession(ADMIN_ONLY);
  await service.trashStudent(session, id);
  refresh();
});

export const setParentLoginAction = action(async (id: string, input: { password: string }) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await service.setParentLogin(session, id, input);
  refresh();
  return result;
});

export const unlinkParentAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.unlinkParent(session, id);
  refresh();
});

export const importStudentsAction = action(async (rows: Record<string, string>[]) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await service.importStudents(session, rows);
  refresh();
  return result;
});

export const findStudentsAction = action(async (q: string) => {
  const session = await requireSession(TEAM_ROLES);
  return service.findStudents(session, q);
});

export const sectionRosterAction = action(async (sectionId: string) => {
  const session = await requireSession(TEAM_ROLES);
  const { rows } = await service.sectionRoster(session, sectionId);
  return rows.map((row) => ({ id: row.id, name: row.name, admissionNo: row.admissionNo, rollNo: row.rollNo, status: row.status }));
});

export const runPromotionAction = action(
  async (sectionId: string, input: { rows: { studentId: string; result: promotion.PromotionResult; targetSectionId: string | null }[] }) => {
    const session = await requireSession(TEAM_ROLES);
    const result = await promotion.runPromotion(session, sectionId, input);
    refresh();
    return result;
  },
);

export const saveStudentSettingsAction = action(async (input: { admissionFormat: string }) => {
  const session = await requireSession(ADMIN_ONLY);
  await service.saveStudentSettings(session, input);
  refresh();
});
