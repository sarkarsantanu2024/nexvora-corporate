'use server';

/** Server actions of Teachers and staff. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { ADMIN_ONLY, TEAM_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';

const refresh = () => revalidatePath('/admin', 'layout');

export const saveStaffAction = action(async (id: string | null, input: service.StaffInput) => {
  const session = await requireSession(TEAM_ROLES);
  await service.saveStaff(session, id, input);
  refresh();
});

export const setStaffActiveAction = action(async (id: string, active: boolean) => {
  const session = await requireSession(TEAM_ROLES);
  await service.setStaffActive(session, id, active);
  refresh();
});

export const trashStaffAction = action(async (id: string) => {
  const session = await requireSession(ADMIN_ONLY);
  await service.trashStaff(session, id);
  refresh();
});

export const setStaffLoginAction = action(async (id: string, input: { username?: string; password: string; role: 'teacher' | 'staff' }) => {
  const session = await requireSession(ADMIN_ONLY);
  const result = await service.setStaffLogin(session, id, input);
  refresh();
  return result;
});
