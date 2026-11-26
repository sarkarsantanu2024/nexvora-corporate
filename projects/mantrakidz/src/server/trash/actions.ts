'use server';

/** Server actions of the two Trash screens: a school's own, and head office's. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { CENTRE_MANAGERS, requireCentre, requireSession } from '@/lib/auth';
import * as service from './service';

export const restoreSchoolTrashAction = action(async (kind: string, id: string) => {
  const ctx = await requireCentre(CENTRE_MANAGERS);
  const name = await service.restoreSchoolTrash(ctx, kind, id);
  // A record brought back shows again on its list and on the overview.
  revalidatePath('/centre', 'layout');
  return name;
});

export const purgeSchoolTrashAction = action(async (kind: string, id: string) => {
  const ctx = await requireCentre(CENTRE_MANAGERS);
  const name = await service.purgeSchoolTrash(ctx, kind, id);
  revalidatePath('/centre/trash');
  return name;
});

export const restoreHqTrashAction = action(async (kind: string, id: string) => {
  const session = await requireSession(['hq_admin']);
  const name = await service.restoreHqTrash(session, kind, id);
  revalidatePath('/hq', 'layout');
  revalidatePath('/', 'layout');
  return name;
});
