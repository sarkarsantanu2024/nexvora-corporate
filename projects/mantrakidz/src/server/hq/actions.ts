'use server';

/**
 * Server actions of the head office area. Each one finds out who is asking,
 * hands the work to a service, and refreshes the head office screens.
 * The services check the role again (admin-only work), so nothing here is
 * the only guard.
 */
import { revalidatePath, revalidateTag } from 'next/cache';
import type { CentreStatus } from '@/db/schema';
import { action } from '@/lib/api';
import { HQ_ROLES, requireSession, type Session } from '@/lib/auth';
import * as admin from './admin';
import * as centres from './centres';
import * as leads from './leads';
import * as royalty from './royalty';
import * as people from './users';

const hq = () => requireSession(HQ_ROLES);
/** Figures from one screen show up on others (overview, centres, royalty), so the whole area is refreshed. */
// 'site-data' is the cache tag of the public website's programme, centre and notice reads.
const refresh = () => {
  revalidatePath('/hq', 'layout');
  revalidateTag('site-data');
};

/** Wraps a service whose first argument is the session. */
function hqAction<A extends unknown[], T>(service: (session: Session, ...args: A) => Promise<T>) {
  return action(async (...args: A): Promise<T> => {
    const session = await hq();
    const result = await service(session, ...args);
    refresh();
    return result;
  });
}

/* leads */
export const createLeadAction = hqAction(leads.createLead);
export const updateLeadAction = hqAction(leads.updateLead);
export const addLeadNoteAction = hqAction(leads.addLeadNote);
export const deleteLeadAction = hqAction(leads.deleteLead);
export const convertLeadAction = hqAction(leads.convertLead);

/* centres */
export const createCentreAction = hqAction(centres.createCentre);
export const updateCentreProfileAction = hqAction(centres.updateCentreProfile);
export const updateCentreAgreementAction = hqAction(centres.updateCentreAgreement);
export const setCentreStatusAction = action(async (id: string, status: CentreStatus) => {
  const session = await hq();
  await centres.setCentreStatus(session, id, status);
  refresh();
  // The centre's own screens show its status too.
  revalidatePath('/centre', 'layout');
});
export const deleteCentreAction = hqAction(centres.deleteCentre);
export const addCentreNoteAction = hqAction(centres.addCentreNote);

/* logins */
export const createHqUserAction = hqAction(people.createHqUser);
export const createCentreUserAction = hqAction(people.createCentreUser);
export const resetUserPasswordAction = hqAction(people.resetUserPassword);
export const setUserActiveAction = hqAction(people.setUserActive);
export const unlockUserAction = hqAction(people.unlockUser);

/* royalty */
export const runRoyaltyAction = action(async (input: Parameters<typeof royalty.runRoyalty>[1]) => {
  const session = await hq();
  const result = await royalty.runRoyalty(session, input);
  refresh();
  revalidatePath('/centre/royalty');
  return result;
});
export const recordRoyaltyPaymentAction = action(async (input: Parameters<typeof royalty.recordRoyaltyPayment>[1]) => {
  const session = await hq();
  const { payment } = await royalty.recordRoyaltyPayment(session, input);
  refresh();
  revalidatePath('/centre/royalty');
  return { id: payment.id };
});
export const voidRoyaltyPaymentAction = action(async (paymentId: string) => {
  const session = await hq();
  await royalty.voidRoyaltyPayment(session, paymentId);
  refresh();
  revalidatePath('/centre/royalty');
});

/* circulars */
export const saveCircularAction = hqAction(admin.saveCircular);
export const pinCircularAction = hqAction(admin.pinCircular);
export const deleteCircularAction = hqAction(admin.deleteCircular);

/* enquiries and messages */
export const assignEnquiryAction = hqAction(admin.assignEnquiry);
export const setMessageHandledAction = hqAction(admin.setMessageHandled);

/* programmes: the website reads these too */
export const saveProgrammeAction = action(async (id: string | null, input: admin.ProgrammeInput) => {
  const session = await hq();
  const row = await admin.saveProgramme(session, id, input);
  revalidatePath('/', 'layout');
  return row;
});
export const deleteProgrammeAction = action(async (id: string) => {
  const session = await hq();
  await admin.deleteProgramme(session, id);
  revalidatePath('/', 'layout');
});

/* settings */
export const saveOrgSettingsAction = hqAction(admin.saveOrgSettings);
export const saveRoyaltySettingsAction = hqAction(admin.saveRoyaltySettings);
export const saveFeeSettingsAction = hqAction(admin.saveFeeSettings);
export const addAcademicYearAction = hqAction(admin.addAcademicYear);
export const setCurrentYearAction = hqAction(admin.setCurrentYear);
export const removeSampleDataAction = action(async (confirmation: string) => {
  const session = await hq();
  const result = await admin.removeSampleData(session, confirmation);
  revalidatePath('/', 'layout');
  return result;
});
