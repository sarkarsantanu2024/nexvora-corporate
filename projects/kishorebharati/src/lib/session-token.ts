/**
 * The login cookie: a signed JWT. Kept free of Node-only imports because the
 * middleware (Edge runtime) verifies it too.
 */
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/db/schema';

export const SESSION_COOKIE = 'app_session';
export const SESSION_HOURS = 12;

export type Session = {
  uid: string;
  name: string;
  username: string;
  role: Role;
  /** True until the first password change. */
  mustChange?: boolean;
};

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      throw new Error('SESSION_SECRET is not set');
    }
    return new TextEncoder().encode('local-development-secret');
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
      mustChange: Boolean(payload.mustChange),
    };
  } catch {
    return null;
  }
}

/** Where a person lands after login. A business module with its own area adds its roles here. */
export function homeFor(role: Role): string {
  if (role === 'parent') return '/parent';
  if (role === 'teacher') return '/admin/today';
  return '/admin';
}
