'use server';

/** Server actions of the Timetable screen. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { ADMIN_ONLY, TEAM_ROLES, requireSession } from '@/lib/auth';
import type { TimetableSettings } from './defaults';
import * as service from './service';

const refresh = () => revalidatePath('/admin', 'layout');

export const setSlotAction = action(
  async (input: { sectionId: string; day: number; period: number; subjectId: string | null; staffId: string | null; room: string; confirmClash: boolean }) => {
    const session = await requireSession(TEAM_ROLES);
    const result = await service.setSlot(session, input);
    refresh();
    return result;
  },
);

export const saveTimetableSettingsAction = action(async (input: TimetableSettings) => {
  const session = await requireSession(ADMIN_ONLY);
  await service.saveTimetableSettings(session, input);
  refresh();
});
