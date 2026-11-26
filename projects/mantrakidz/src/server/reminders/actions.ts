'use server';

/** Server actions of a school's Reminders screen and the head office Settings card. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { requireCentre, requireSession } from '@/lib/auth';
import * as service from './service';

// The bell and the overview count waiting reminders too.
const refresh = () => revalidatePath('/centre', 'layout');

export const markSentAction = action(async (id: string) => {
  const ctx = await requireCentre();
  await service.markSent(ctx, id);
  refresh();
});

export const dismissReminderAction = action(async (id: string) => {
  const ctx = await requireCentre();
  await service.dismissReminder(ctx, id);
  refresh();
});

export const reopenReminderAction = action(async (id: string) => {
  const ctx = await requireCentre();
  await service.reopenReminder(ctx, id);
  refresh();
});

export const checkNowAction = action(async () => {
  const { centre } = await requireCentre();
  const result = await service.fillQueue({ centreId: centre.id });
  refresh();
  return result;
});

export const saveReminderSettingsAction = action(async (input: Parameters<typeof service.saveReminderSettings>[1]) => {
  const session = await requireSession(['hq_admin']);
  await service.saveReminderSettings(session, input);
  revalidatePath('/hq/settings');
});
