/**
 * The login cookie: a signed JWT. Kept free of Node-only imports because the
 * middleware (Edge runtime) verifies it too.
 */
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/db/schema';

export const SESSION_COOKIE = 'mk_session';
/** HQ users pick a centre to work in; this cookie remembers which. */
export const ACTING_CENTRE_COOKIE = 'mk_centre';
export const SESSION_HOURS = 12;

export type Session = {
  uid: string;
  name: string;
  username: string;
  role: Role;
  /** Null for HQ roles. */
  centreId: string | null;
  /** True until the first password change. */
  mustChange?: boolean;
};

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      throw new Error('SESSION_SECRET is not set');
    }
    return new TextEncoder().encode('mantrakidz-local-development-secret');
  }
  return new TextEncoder().encode(value);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());
}

export async function readSessionToken(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    if (typeof payload.uid !== 'string' || typeof payload.role !== 'string') return null;
    return {
      uid: payload.uid,
      name: String(payload.name ?? ''),
      username: String(payload.username ?? ''),
      role: payload.role as Role,
      centreId: (payload.centreId as string | null) ?? null,
      mustChange: Boolean(payload.mustChange),
    };
  } catch {
    return null;
  }
}

export const isHq = (role: Role) => role === 'hq_admin' || role === 'hq_staff';
export const isCentreRole = (role: Role) => role === 'centre_admin' || role === 'centre_staff';

/** Where each role lands after login. */
export function homeFor(role: Role): string {
  if (isHq(role)) return '/hq';
  if (role === 'parent') return '/parent';
  return '/centre';
}
