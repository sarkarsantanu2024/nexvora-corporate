/**
 * Teachers and staff: the staff list (also the website's teachers page), their
 * logins, leaving and the Trash.
 *
 * The office keeps the list. Logins are given only by an admin: a teacher's
 * login opens the registers and marks of their sections, an office login
 * opens much more.
 */
import { and, asc, eq, ilike, isNull, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { STAFF_KINDS, staff, users, type StaffMember } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { hashPassword } from '@/lib/auth';
import type { Session } from '@/lib/session-token';
import { optionalDay, optionalEmail, optionalPhone, password, requiredText, text, username, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, pageOf } from '../admin/shared';
import { assertOffice } from '../school/access';

export const staffNotTrashed = isNull(staff.deletedAt);

export type StaffFilters = { q?: string; kind?: string; status?: string; page?: string | number };

export async function listStaff(session: Session, filters: StaffFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const conds: (SQL | undefined)[] = [staffNotTrashed];
  const term = filters.q?.trim();
  if (term) {
    const pattern = `%${term}%`;
    conds.push(or(ilike(staff.name, pattern), ilike(staff.nameBn, pattern), ilike(staff.designation, pattern), ilike(staff.subjects, pattern), ilike(staff.phone, pattern)));
  }
  if ((STAFF_KINDS as readonly string[]).includes(filters.kind ?? '')) conds.push(eq(staff.kind, filters.kind as (typeof STAFF_KINDS)[number]));
  // Those still working by default; 'left' shows the ones switched off; 'all' everyone.
  if (filters.status !== 'all') conds.push(eq(staff.active, filters.status !== 'left'));
  const where = and(...conds);
  const [rows, [{ n }]] = await Promise.all([
    db
      .select({
        staff,
        login: { id: users.id, username: users.username, role: users.role, active: users.active, lastLoginAt: users.lastLoginAt },
      })
      .from(staff)
      .leftJoin(users, eq(users.id, staff.userId))
      .where(where)
      .orderBy(asc(staff.sort), asc(staff.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(staff).where(where),
  ]);
  return { rows: rows.map((row) => ({ ...row.staff, login: row.login?.id ? row.login : null })), total: n, page, pageSize: PAGE_SIZE };
}

async function loadStaff(db: DbOrTx, id: string): Promise<StaffMember> {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ApiError(404, 'Staff member not found');
  const [row] = await db.select().from(staff).where(and(eq(staff.id, parsed.data), staffNotTrashed)).limit(1);
  if (!row) throw new ApiError(404, 'Staff member not found');
  return row;
}

const staffInput = z.object({
  name: requiredText('Name', 100),
  nameBn: text(100),
  kind: z.enum(STAFF_KINDS),
  designation: text(80),
  subjects: text(200),
  qualification: text(200),
  phone: optionalPhone,
  email: optionalEmail,
  joinedOn: optionalDay,
  photo: text(500),
  showOnWebsite: z.boolean().default(true),
  sort: z.coerce.number({ invalid_type_error: 'Enter a number' }).int().min(0).max(999).default(0),
});
export type StaffInput = z.input<typeof staffInput>;

export async function saveStaff(session: Session, id: string | null, input: StaffInput) {
  assertOffice(session);
  const data = staffInput.parse(input);
  const db = await getDb();
  let row: StaffMember;
  if (id) {
    const found = await loadStaff(db, id);
    [row] = await db.update(staff).set({ ...data, updatedAt: new Date() }).where(eq(staff.id, found.id)).returning();
  } else {
    [row] = await db.insert(staff).values(data).returning();
  }
  await audit(session, id ? 'staff.update' : 'staff.create', { entity: 'staff', entityId: row.id, summary: `${id ? 'Updated' : 'Added'} ${row.name} on the staff list` });
  return row;
}

/** Someone who has left the school: off the website and their login is switched off; the record stays. */
export async function setStaffActive(session: Session, id: string, active: boolean) {
  assertOffice(session);
  const db = await getDb();
  const row = await loadStaff(db, id);
  await db.transaction(async (tx) => {
    await tx.update(staff).set({ active, updatedAt: new Date() }).where(eq(staff.id, row.id));
    if (!active && row.userId) await tx.update(users).set({ active: false }).where(eq(users.id, row.userId));
  });
  await audit(session, active ? 'staff.activate' : 'staff.deactivate', { entity: 'staff', entityId: row.id, summary: `${active ? 'Brought back' : 'Marked as left'} ${row.name}` });
}

/** A wrong entry only; someone who left is switched off instead. The login is switched off too. */
export async function trashStaff(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const row = await loadStaff(db, id);
  await db.transaction(async (tx) => {
    await tx.update(staff).set({ deletedAt: new Date() }).where(eq(staff.id, row.id));
    if (row.userId) await tx.update(users).set({ active: false }).where(eq(users.id, row.userId));
  });
  await audit(session, 'staff.delete', { entity: 'staff', entityId: row.id, summary: `Moved ${row.name} to the Trash` });
}

const loginInput = z.object({ username: username.optional(), password, role: z.enum(['teacher', 'staff']).default('teacher') });

/**
 * Gives a staff member a login, or sets a new starting password on the one
 * they have. Either way they must change it at the first login.
 */
export async function setStaffLogin(session: Session, id: string, input: z.input<typeof loginInput>) {
  assertAdmin(session);
  const data = loginInput.parse(input);
  const db = await getDb();
  const row = await loadStaff(db, id);
  const hash = await hashPassword(data.password);
  if (row.userId) {
    const [user] = await db.update(users).set({ passwordHash: hash, mustChangePassword: true, active: true, failedLogins: 0, lockedUntil: null }).where(eq(users.id, row.userId)).returning({ username: users.username });
    if (user) {
      await audit(session, 'staff.login.reset', { entity: 'staff', entityId: row.id, summary: `Set a new password for ${row.name} (${user.username})` });
      return { username: user.username, created: false };
    }
  }
  if (!data.username) throw new ApiError(400, 'Choose a username', { username: 'Choose a username' });
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, data.username)).limit(1);
  if (taken) throw new ApiError(400, 'That username is already in use', { username: 'Already in use. Choose another.' });
  const created = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ name: row.name, username: data.username!, phone: row.phone, email: row.email, passwordHash: hash, role: data.role, mustChangePassword: true })
      .returning({ id: users.id, username: users.username });
    await tx.update(staff).set({ userId: user.id, updatedAt: new Date() }).where(eq(staff.id, row.id));
    return user;
  });
  await audit(session, 'staff.login.create', { entity: 'staff', entityId: row.id, summary: `Gave ${row.name} a ${data.role} login (${created.username})` });
  return { username: created.username, created: true };
}
