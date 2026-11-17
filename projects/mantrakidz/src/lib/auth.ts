/**
 * Who is logged in, and what they may touch. Server only.
 *
 * Pages and server actions:   const session = await requireSession(['hq_admin']);
 * Centre screens:             const { session, centre } = await requireCentre();
 * API route handlers:         const session = await apiSession(['centre_admin']);
 */
import bcrypt from 'bcryptjs';
import { and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { centres, type Centre, type Role } from '@/db/schema';
import { ApiError } from './api';
import {
  ACTING_CENTRE_COOKIE,
  SESSION_COOKIE,
  SESSION_HOURS,
  homeFor,
  isHq,
  readSessionToken,
  signSession,
  type Session,
} from './session-token';

export type { Session };
export { isHq, homeFor };

export const HQ_ROLES: Role[] = ['hq_admin', 'hq_staff'];
export const CENTRE_ROLES: Role[] = ['centre_admin', 'centre_staff'];
/** Everyone who may open a centre's screens (HQ can step into any centre). */
export const CENTRE_SCREEN_ROLES: Role[] = ['hq_admin', 'hq_staff', 'centre_admin', 'centre_staff'];
/** Those who may change money, staff and settings inside a centre. */
export const CENTRE_MANAGERS: Role[] = ['hq_admin', 'centre_admin'];

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
  jar.delete(ACTING_CENTRE_COOKIE);
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

/** The centre an HQ user has stepped into, if any. */
export async function actingCentreId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACTING_CENTRE_COOKIE)?.value ?? null;
}

async function loadCentre(id: string): Promise<Centre | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const [row] = await db
    .select()
    .from(centres)
    .where(and(eq(centres.id, id), isNull(centres.deletedAt)))
    .limit(1);
  return row ?? null;
}

/**
 * The centre the current request works in.
 * Centre roles: their own centre, always. HQ roles: the one they stepped into.
 */
export async function requireCentre(roles: Role[] = CENTRE_SCREEN_ROLES): Promise<{ session: Session; centre: Centre }> {
  const session = await requireSession(roles);
  const id = isHq(session.role) ? await actingCentreId() : session.centreId;
  if (!id) redirect(isHq(session.role) ? '/hq/centres?pick=1' : '/login');
  const centre = await loadCentre(id);
  if (!centre) redirect(isHq(session.role) ? '/hq/centres?pick=1' : '/login');
  return { session, centre };
}

/** Same rule as requireCentre, for route handlers. */
export async function apiCentre(roles: Role[] = CENTRE_SCREEN_ROLES): Promise<{ session: Session; centre: Centre }> {
  const session = await apiSession(roles);
  const id = isHq(session.role) ? await actingCentreId() : session.centreId;
  if (!id) throw new ApiError(400, 'Choose a school first');
  const centre = await loadCentre(id);
  if (!centre) throw new ApiError(404, 'School not found');
  return { session, centre };
}

/** True when this person may change money, staff and settings in a centre. */
export const canManageCentre = (session: Session) => CENTRE_MANAGERS.includes(session.role);
