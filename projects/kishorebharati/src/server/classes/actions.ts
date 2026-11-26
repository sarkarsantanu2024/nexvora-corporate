'use server';

/** Server actions of Classes and subjects. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';

const refresh = () => revalidatePath('/admin', 'layout');

type YearInput = { name: string; startsOn: string; endsOn: string; copySections: boolean };
type SectionInput = { yearId: string; grade: number; name: string; stream: '' | 'science' | 'arts'; shift: 'morning' | 'day'; classTeacherId: string; room: string; capacity: number };
type SubjectInput = { name: string; nameBn: string; code: string; fromGrade: number; toGrade: number; stream: '' | 'science' | 'arts'; optional: boolean; sort: number };

export const createYearAction = action(async (input: YearInput) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await service.createYear(session, input);
  refresh();
  return { id: row.id };
});

export const setCurrentYearAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.setCurrentYear(session, id);
  refresh();
});

export const saveSectionAction = action(async (id: string | null, input: SectionInput) => {
  const session = await requireSession(TEAM_ROLES);
  await service.saveSection(session, id, input);
  refresh();
});

export const deleteSectionAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.deleteSection(session, id);
  refresh();
});

export const saveSubjectAction = action(async (id: string | null, input: SubjectInput) => {
  const session = await requireSession(TEAM_ROLES);
  await service.saveSubject(session, id, input);
  refresh();
});

export const setSubjectActiveAction = action(async (id: string, active: boolean) => {
  const session = await requireSession(TEAM_ROLES);
  await service.setSubjectActive(session, id, active);
  refresh();
});

export const setAssignmentAction = action(async (input: { sectionId: string; subjectId: string; staffId: string }) => {
  const session = await requireSession(TEAM_ROLES);
  await service.setAssignment(session, input);
  refresh();
});
