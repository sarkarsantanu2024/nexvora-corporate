'use server';

/** Server actions of the Events and calendar screen. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';

// The website lists these too.
const refresh = () => revalidatePath('/', 'layout');

export const createEventAction = action(async (input: service.EventInput) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await service.createEvent(session, input);
  refresh();
  return { id: row.id };
});

export const updateEventAction = action(async (id: string, input: service.EventInput) => {
  const session = await requireSession(TEAM_ROLES);
  await service.updateEvent(session, id, input);
  refresh();
});

export const deleteEventAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.deleteEvent(session, id);
  refresh();
});
