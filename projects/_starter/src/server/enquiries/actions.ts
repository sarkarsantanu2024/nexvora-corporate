'use server';

/** Server actions of the Enquiries screens: who is asking, the service, then refresh. */
import { revalidatePath } from 'next/cache';
import type { EnquiryStatus } from '@/db/schema';
import { action } from '@/lib/api';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';

// The overview shows the enquiry counts too, so the whole area is refreshed.
const refresh = () => revalidatePath('/admin', 'layout');

export const setEnquiryStatusAction = action(async (id: string, status: EnquiryStatus) => {
  const session = await requireSession(TEAM_ROLES);
  await service.setEnquiryStatus(session, id, status);
  refresh();
});

export const addEnquiryNoteAction = action(async (id: string, note: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.addEnquiryNote(session, id, note);
  refresh();
});

export const deleteEnquiryAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.deleteEnquiry(session, id);
  refresh();
});
