'use server';

/** Log in, log out, change password, and head office stepping into a centre. */
import { and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb } from '@/db';
import { centres, users } from '@/db/schema';
import { ApiError, action } from '@/lib/api';
import { audit } from '@/lib/audit';
import { endSession, getSession, hashPassword, homeFor, isHq, requireSession, startSession, verifyPassword } from '@/lib/auth';
import { UI_LANG_COOKIE, readUiLang } from '@/i18n/ui';
import { ACTING_CENTRE_COOKIE } from '@/lib/session-token';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export type LoginState = { error?: string; username?: string };

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get('username') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '');
  if (!username || !password) return { error: 'Enter your username and password', username };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  // The same message for a wrong name and a wrong password: it gives nothing away.
  const wrong = { error: 'That username or password is not right', username };
  if (!user || !user.active) return wrong;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Too many wrong tries. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, username };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const fails = user.failedLogins + 1;
    await db
      .update(users)
      .set({
        failedLogins: fails >= MAX_FAILS ? 0 : fails,
        lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60000) : null,
      })
      .where(eq(users.id, user.id));
    return wrong;
  }

  await db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await startSession({
    uid: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    centreId: user.centreId,
    mustChange: user.mustChangePassword,
  });
  await audit({ uid: user.id, name: user.name }, 'login', { centreId: user.centreId, summary: `${user.name} logged in` });

  if (user.mustChangePassword) redirect('/account/password?first=1');
  const home = homeFor(user.role);
  // Only follow `next` when it stays inside this person's own area.
  redirect(next.startsWith(home) && !next.startsWith('//') ? next : home);
}

export async function logout() {
  await endSession();
  redirect('/login');
}

const passwordInput = z
  .object({
    current: z.string().min(1, 'Enter your current password'),
    next: z.string().min(6, 'Use at least 6 characters').max(100),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'The two passwords do not match' })
  .refine((v) => v.next !== v.current, { path: ['next'], message: 'Choose a different password from the current one' });

export const changePassword = action(async (input: z.input<typeof passwordInput>) => {
  const session = await requireSession();
  const data = passwordInput.parse(input);
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, session.uid)).limit(1);
  if (!user) throw new ApiError(404, 'Account not found');
  if (!(await verifyPassword(data.current, user.passwordHash))) {
    throw new ApiError(400, 'Your current password is not right', { current: 'Not the current password' });
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(data.next), mustChangePassword: false })
    .where(eq(users.id, user.id));
  await startSession({ ...session, mustChange: false });
  await audit(session, 'password.change', { centreId: session.centreId, summary: `${session.name} changed their password` });
  return { home: homeFor(session.role) };
});

/** Head office opens one centre's screens. */
export async function enterCentre(centreId: string) {
  const session = await requireSession(['hq_admin', 'hq_staff']);
  const db = await getDb();
  const [centre] = await db
    .select({ id: centres.id, name: centres.name })
    .from(centres)
    .where(and(eq(centres.id, centreId), isNull(centres.deletedAt)))
    .limit(1);
  if (!centre) redirect('/hq/centres');
  const jar = await cookies();
  jar.set(ACTING_CENTRE_COOKIE, centre.id, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' });
  await audit(session, 'centre.enter', { centreId: centre.id, summary: `${session.name} opened ${centre.name}` });
  redirect('/centre');
}

export async function leaveCentre() {
  const session = await getSession();
  const jar = await cookies();
  jar.delete(ACTING_CENTRE_COOKIE);
  redirect(session && isHq(session.role) ? '/hq/centres' : '/login');
}

/** Remembers the language a person wants the dashboards in (English, Hindi or Bengali). */
export async function setUiLang(lang: string) {
  const store = await cookies();
  store.set(UI_LANG_COOKIE, readUiLang(lang), { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
}
