'use server';

/** Server actions of the Trash screen. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { ADMIN_ONLY, requireSession } from '@/lib/auth';
import * as service from './service';

// A record brought back shows again on its own list and on the overview.
const refresh = () => revalidatePath('/admin', 'layout');

export const restoreFromTrashAction = action(async (kind: string, id: string) => {
  const session = await requireSession(ADMIN_ONLY);
  const name = await service.restoreFromTrash(session, kind, id);
  refresh();
  return name;
});

export const purgeFromTrashAction = action(async (kind: string, id: string) => {
  const session = await requireSession(ADMIN_ONLY);
  const name = await service.purgeFromTrash(session, kind, id);
  refresh();
  return name;
});
