/**
 * Who is logged in, and what they may touch. Server only.
 *
 * Pages and server actions:   const session = await requireSession(['admin']);
 * API route handlers:         const session = await apiSession(['admin']);
 */
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@/db/schema';
import { ApiError } from './api';
import { SESSION_COOKIE, SESSION_HOURS, homeFor, readSessionToken, signSession, type Session } from './session-token';

export type { Session };
export { homeFor };

/** Everyone who may open the dashboard. */
export const TEAM_ROLES: Role[] = ['admin', 'staff'];
/** Those who may manage logins, settings and the activity log. */
export const ADMIN_ONLY: Role[] = ['admin'];

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function startSession(session: Session) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** For pages and server actions. Sends the visitor to /login, or to their own home if the role is wrong. */
export async function requireSession(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (roles && !roles.includes(session.role)) redirect(homeFor(session.role));
  return session;
}

/** For route handlers. Throws ApiError instead of redirecting. */
export async function apiSession(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new ApiError(401, 'Please log in');
  if (roles && !roles.includes(session.role)) throw new ApiError(403, 'You do not have access to this');
  return session;
}
