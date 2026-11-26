'use server';

/** Server actions of the exams screens: who is asking, the service, then refresh. */
import { revalidatePath } from 'next/cache';
import type { ExamStatus } from '@/db/schema';
import { action } from '@/lib/api';
import { ADMIN_ONLY, DASH_ROLES, TEAM_ROLES, requireSession } from '@/lib/auth';
import { assertPlan } from '../platform';
import * as service from './service';

const refresh = () => revalidatePath('/admin', 'layout');

async function who(roles = TEAM_ROLES) {
  const session = await requireSession(roles);
  await assertPlan('platinum');
  return session;
}

export const createExamAction = action(async (input: service.ExamInput) => {
  const row = await service.createExam(await who(), input);
  refresh();
  return { id: row.id };
});

export const updateExamAction = action(async (id: string, input: service.ExamInput) => {
  await service.updateExam(await who(), id, input);
  refresh();
});

export const deleteExamAction = action(async (id: string) => {
  await service.deleteExam(await who(ADMIN_ONLY), id);
  refresh();
});

export const setExamStatusAction = action(async (id: string, status: ExamStatus, reason?: string) => {
  await service.setExamStatus(await who(), id, status, reason);
  refresh();
});

export const setupPapersAction = action(async (id: string, input: { fullMarks: number; passMarks: number; hsFullMarks: number; hsPassMarks: number }) => {
  const result = await service.setupPapers(await who(), id, input);
  refresh();
  return result;
});

export const updatePaperAction = action(async (id: string, input: { fullMarks: number | string; passMarks: number | string; examDate: string }) => {
  await service.updatePaper(await who(), id, input);
  refresh();
});

export const deletePaperAction = action(async (id: string) => {
  await service.deletePaper(await who(), id);
  refresh();
});

/** Autosave of the marks grid: no refresh of the whole area, the grid keeps its own state. */
export const saveMarksAction = action(async (paperId: string, sectionId: string, entries: service.MarkEntry[]) => {
  return service.saveMarks(await who(DASH_ROLES), paperId, sectionId, entries);
});

export const saveRemarkAction = action(async (examId: string, studentId: string, remark: string) => {
  await service.saveRemark(await who(DASH_ROLES), examId, studentId, remark);
  revalidatePath('/admin/exams', 'layout');
});

export const saveGradeScaleAction = action(async (scale: { grade: string; min: number | string }[]) => {
  await service.saveGradeScale(await who(ADMIN_ONLY), scale);
  refresh();
});
