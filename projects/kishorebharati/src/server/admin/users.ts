/**
 * Logins of the team. Passwords are stored as bcrypt hashes and never shown
 * after they are set.
 */
import { and, asc, count, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { ROLES, users, type Role } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { hashPassword } from '@/lib/auth';
import type { Session } from '@/lib/session-token';
import { optionalEmail, optionalPhone, password, requiredText, username, uuid } from '@/lib/validators';
import { assertAdmin } from './shared';

/** What a screen may see of a login. The password hash never leaves the server. */
const publicColumns = {
  id: users.id,
  name: users.name,
  username: users.username,
  phone: users.phone,
  email: users.email,
  role: users.role,
  active: users.active,
  mustChangePassword: users.mustChangePassword,
  lockedUntil: users.lockedUntil,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};
export type LoginRow = {
  id: string;
  name: string;
  username: string;
  phone: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};

const newLogin = z.object({
  name: requiredText('Name', 80),
  username,
  phone: optionalPhone,
  email: optionalEmail,
  password,
  role: z.enum(ROLES),
  mustChange: z.boolean().default(true),
});

export async function createUser(session: Session, input: z.input<typeof newLogin>) {
  assertAdmin(session);
  const data = newLogin.parse(input);
  const db = await getDb();
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, data.username)).limit(1);
  if (taken) throw new ApiError(400, 'That username is already in use', { username: 'Already in use. Choose another.' });
  const [row] = await db
    .insert(users)
    .values({
      name: data.name,
      username: data.username,
      phone: data.phone,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      mustChangePassword: data.mustChange,
    })
    .returning(publicColumns);
  await audit(session, 'user.create', { entity: 'user', entityId: row.id, summary: `Created the login ${row.username} for ${row.name}` });
  return row;
}

async function loadUser(db: DbOrTx, id: string) {
  const [row] = await db.select(publicColumns).from(users).where(eq(users.id, uuid.parse(id))).limit(1);
  if (!row) throw new ApiError(404, 'Login not found');
  return row;
}

const resetInput = z.object({ userId: uuid, password, mustChange: z.boolean().default(true) });

/** Sets a new starting password. The person is asked to change it on the next login. */
export async function resetUserPassword(session: Session, input: z.input<typeof resetInput>) {
  assertAdmin(session);
  const data = resetInput.parse(input);
  const db = await getDb();
  const user = await loadUser(db, data.userId);
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(data.password), mustChangePassword: data.mustChange, failedLogins: 0, lockedUntil: null })
    .where(eq(users.id, user.id));
  await audit(session, 'user.password.reset', { entity: 'user', entityId: user.id, summary: `Reset the password of ${user.username}` });
}

export async function setUserActive(session: Session, userId: string, active: boolean) {
  assertAdmin(session);
  const db = await getDb();
  const user = await loadUser(db, userId);
  if (!active) {
    if (user.id === session.uid) throw new ApiError(400, 'You cannot deactivate your own login');
    if (user.role === 'admin') {
      const [{ n }] = await db
        .select({ n: count() })
        .from(users)
        .where(and(eq(users.role, 'admin'), eq(users.active, true), ne(users.id, user.id)));
      if (n === 0) throw new ApiError(400, 'This is the last admin. Add another admin first.');
    }
  }
  await db.update(users).set({ active }).where(eq(users.id, user.id));
  await audit(session, active ? 'user.activate' : 'user.deactivate', {
    entity: 'user',
    entityId: user.id,
    summary: `${active ? 'Activated' : 'Deactivated'} the login ${user.username}`,
  });
}

export async function unlockUser(session: Session, userId: string) {
  assertAdmin(session);
  const db = await getDb();
  const user = await loadUser(db, userId);
  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await audit(session, 'user.unlock', { entity: 'user', entityId: user.id, summary: `Unlocked the login ${user.username}` });
}

/** Everyone who can log in, admins first. */
export async function listLogins(session: Session): Promise<LoginRow[]> {
  assertAdmin(session);
  const db = await getDb();
  return db.select(publicColumns).from(users).orderBy(asc(users.role), asc(users.name));
}
