/**
 * Logins: head office team, centre heads and staff, parents.
 * Passwords are stored as bcrypt hashes and never shown after they are set.
 */
import { and, asc, count, eq, ilike, ne, or } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { centres, users, type Role } from '@/db/schema';
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
  centreId: users.centreId,
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
  centreId: string | null;
  active: boolean;
  mustChangePassword: boolean;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  centreName?: string | null;
};

const newLogin = z.object({
  name: requiredText('Name', 80),
  username,
  phone: optionalPhone,
  email: optionalEmail,
  password,
  mustChange: z.boolean().default(true),
});

/** Inserts a login inside the caller's transaction. Fails with a field error when the username is taken. */
export async function insertLogin(
  db: DbOrTx,
  input: z.input<typeof newLogin>,
  scope: { role: Role; centreId: string | null },
) {
  const data = newLogin.parse(input);
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
      role: scope.role,
      centreId: scope.centreId,
      mustChangePassword: data.mustChange,
    })
    .returning(publicColumns);
  return row;
}

const hqLogin = newLogin.extend({ role: z.enum(['hq_admin', 'hq_staff']) });

export async function createHqUser(session: Session, input: z.input<typeof hqLogin>) {
  assertAdmin(session);
  const { role } = hqLogin.parse(input);
  const db = await getDb();
  const row = await insertLogin(db, input, { role, centreId: null });
  await audit(session, 'user.create', { entity: 'user', entityId: row.id, summary: `Created head office login ${row.username} for ${row.name}` });
  return row;
}

const centreLogin = newLogin.extend({ centreId: uuid, role: z.enum(['centre_admin', 'centre_staff']) });

export async function createCentreUser(session: Session, input: z.input<typeof centreLogin>) {
  assertAdmin(session);
  const { centreId, role } = centreLogin.parse(input);
  const db = await getDb();
  const [centre] = await db.select({ id: centres.id, name: centres.name }).from(centres).where(eq(centres.id, centreId)).limit(1);
  if (!centre) throw new ApiError(404, 'School not found');
  const row = await insertLogin(db, input, { role, centreId });
  await audit(session, 'user.create', { entity: 'user', entityId: row.id, centreId, summary: `Created login ${row.username} for ${row.name} at ${centre.name}` });
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
  await audit(session, 'user.password.reset', { entity: 'user', entityId: user.id, centreId: user.centreId, summary: `Reset the password of ${user.username}` });
}

export async function setUserActive(session: Session, userId: string, active: boolean) {
  assertAdmin(session);
  const db = await getDb();
  const user = await loadUser(db, userId);
  if (!active) {
    if (user.id === session.uid) throw new ApiError(400, 'You cannot deactivate your own login');
    if (user.role === 'hq_admin') {
      const [{ n }] = await db
        .select({ n: count() })
        .from(users)
        .where(and(eq(users.role, 'hq_admin'), eq(users.active, true), ne(users.id, user.id)));
      if (n === 0) throw new ApiError(400, 'This is the last head office admin. Add another admin first.');
    }
  }
  await db.update(users).set({ active }).where(eq(users.id, user.id));
  await audit(session, active ? 'user.activate' : 'user.deactivate', {
    entity: 'user',
    entityId: user.id,
    centreId: user.centreId,
    summary: `${active ? 'Activated' : 'Deactivated'} the login ${user.username}`,
  });
}

export async function unlockUser(session: Session, userId: string) {
  assertAdmin(session);
  const db = await getDb();
  const user = await loadUser(db, userId);
  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await audit(session, 'user.unlock', { entity: 'user', entityId: user.id, centreId: user.centreId, summary: `Unlocked the login ${user.username}` });
}

/** Logins of one centre (not parents), for the People tab. */
export async function listCentreLogins(centreId: string): Promise<LoginRow[]> {
  const db = await getDb();
  return db
    .select(publicColumns)
    .from(users)
    .where(and(eq(users.centreId, centreId), ne(users.role, 'parent')))
    .orderBy(asc(users.role), asc(users.name));
}

const PARENT_LIMIT = 50;

/** Everything the Team and logins screen shows. Parents are searched, never listed in full. */
export async function listLogins(session: Session, parentQuery = '') {
  assertAdmin(session);
  const db = await getDb();
  const q = parentQuery.trim();
  const parentFilter = q
    ? and(eq(users.role, 'parent'), or(ilike(users.name, `%${q}%`), ilike(users.username, `%${q}%`), ilike(users.phone, `%${q}%`)))
    : eq(users.role, 'parent');

  const [team, parents, [{ n: parentTotal }]] = await Promise.all([
    db
      .select({ ...publicColumns, centreName: centres.name })
      .from(users)
      .leftJoin(centres, eq(centres.id, users.centreId))
      .where(ne(users.role, 'parent'))
      .orderBy(asc(centres.code), asc(users.role), asc(users.name)),
    db
      .select({ ...publicColumns, centreName: centres.name })
      .from(users)
      .leftJoin(centres, eq(centres.id, users.centreId))
      .where(parentFilter)
      .orderBy(asc(users.name))
      .limit(PARENT_LIMIT),
    db.select({ n: count() }).from(users).where(eq(users.role, 'parent')),
  ]);
  return {
    hq: team.filter((row) => row.role === 'hq_admin' || row.role === 'hq_staff') as LoginRow[],
    centre: team.filter((row) => row.role === 'centre_admin' || row.role === 'centre_staff') as LoginRow[],
    parents: parents as LoginRow[],
    parentTotal,
    parentLimit: PARENT_LIMIT,
  };
}
