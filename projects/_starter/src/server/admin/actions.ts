'use server';

/**
 * Server actions for logins and settings. Each one finds out who is asking,
 * hands the work to a service, and refreshes the dashboard screens.
 * The services check the role again, so nothing here is the only guard.
 */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { TEAM_ROLES, requireSession, type Session } from '@/lib/auth';
import * as admin from './service';
import * as people from './users';

/** Wraps a service whose first argument is the session. */
function adminAction<A extends unknown[], T>(service: (session: Session, ...args: A) => Promise<T>) {
  return action(async (...args: A): Promise<T> => {
    const session = await requireSession(TEAM_ROLES);
    const result = await service(session, ...args);
    revalidatePath('/admin', 'layout');
    return result;
  });
}

/* logins */
export const createUserAction = adminAction(people.createUser);
export const resetUserPasswordAction = adminAction(people.resetUserPassword);
export const setUserActiveAction = adminAction(people.setUserActive);
export const unlockUserAction = adminAction(people.unlockUser);

/* settings */
export const saveOrgSettingsAction = adminAction(admin.saveOrgSettings);
