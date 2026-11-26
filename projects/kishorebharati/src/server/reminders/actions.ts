'use server';

/** Server actions of the Reminders screen and its Settings card. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { ADMIN_ONLY, TEAM_ROLES, requireSession } from '@/lib/auth';
import { assertPlan } from '../platform';
import * as service from './service';

// The bell and the overview count waiting reminders too.
const refresh = () => revalidatePath('/admin', 'layout');

export const markSentAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.markSent(session, id);
  refresh();
});

export const dismissReminderAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.dismissReminder(session, id);
  refresh();
});

export const reopenReminderAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.reopenReminder(session, id);
  refresh();
});

export const checkNowAction = action(async () => {
  await requireSession(TEAM_ROLES);
  await assertPlan('panel');
  const result = await service.fillQueue();
  refresh();
  return result;
});

export const saveReminderSettingsAction = action(async (input: Parameters<typeof service.saveReminderSettings>[1]) => {
  const session = await requireSession(ADMIN_ONLY);
  await service.saveReminderSettings(session, input);
  refresh();
});
