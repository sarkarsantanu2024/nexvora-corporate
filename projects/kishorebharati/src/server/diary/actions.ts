'use server';

/** Server actions of the Class diary screen. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';

const refresh = () => revalidatePath('/admin', 'layout');

export const createDiaryAction = action(async (input: service.DiaryInput) => {
  const session = await requireSession(DASH_ROLES);
  const row = await service.createDiaryEntry(session, input);
  refresh();
  return { id: row.id };
});

export const updateDiaryAction = action(async (id: string, input: service.DiaryInput) => {
  const session = await requireSession(DASH_ROLES);
  await service.updateDiaryEntry(session, id, input);
  refresh();
});

export const deleteDiaryAction = action(async (id: string) => {
  const session = await requireSession(DASH_ROLES);
  await service.deleteDiaryEntry(session, id);
  refresh();
});
