/** Staff of one centre, their logins, and the centre's own profile. Managers only. */
import { and, asc, count, desc, eq, inArray, isNull, like } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { batches, centres, expenses, staff, staffAttendance, users } from '@/db/schema';
import { ApiError, fail } from '@/lib/api';
import { audit } from '@/lib/audit';
import { hashPassword } from '@/lib/auth';
import { isHq } from '@/lib/session-token';
import { day, optionalDay, optionalEmail, optionalPhone, requiredText, rupees, text, username as usernameSchema } from '@/lib/validators';
import { isUuid, requireManager, startingPassword, type Ctx } from './shared';

export const staffInput = z.object({
  name: requiredText('Name', 80),
  roleTitle: requiredText('Role', 60),
  phone: optionalPhone,
  email: optionalEmail,
  qualification: text(120),
  joinedOn: optionalDay,
  monthlySalary: rupees,
});
export type StaffInput = z.input<typeof staffInput>;

async function loadStaff(centreId: string, id: string) {
  if (!isUuid(id)) throw new ApiError(404, 'Staff member not found');
  const db = await getDb();
  const [row] = await db
    .select()
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.centreId, centreId), isNull(staff.deletedAt)))
    .limit(1);
  if (!row) throw new ApiError(404, 'Staff member not found');
  return row;
}

export async function listStaff(ctx: Ctx) {
  requireManager(ctx);
  const db = await getDb();
  return db
    .select({
      id: staff.id,
      name: staff.name,
      roleTitle: staff.roleTitle,
      phone: staff.phone,
      email: staff.email,
      qualification: staff.qualification,
      joinedOn: staff.joinedOn,
      leftOn: staff.leftOn,
      monthlySalary: staff.monthlySalary,
      active: staff.active,
      userId: staff.userId,
      username: users.username,
      loginActive: users.active,
    })
    .from(staff)
    .leftJoin(users, eq(users.id, staff.userId))
    .where(and(eq(staff.centreId, ctx.centre.id), isNull(staff.deletedAt)))
    .orderBy(desc(staff.active), asc(staff.name));
}

/** Names for the class teacher dropdown; no salaries, so any centre role may read it. */
export async function teacherOptions(ctx: Ctx) {
  const db = await getDb();
  return db
    .select({ id: staff.id, name: staff.name, roleTitle: staff.roleTitle })
    .from(staff)
    .where(and(eq(staff.centreId, ctx.centre.id), eq(staff.active, true), isNull(staff.deletedAt)))
    .orderBy(asc(staff.name));
}

export async function createStaff(ctx: Ctx, raw: StaffInput) {
  requireManager(ctx);
  const data = staffInput.parse(raw);
  const db = await getDb();
  const [row] = await db
    .insert(staff)
    .values({ ...data, centreId: ctx.centre.id })
    .returning();
  await audit(ctx.session, 'staff.create', { entity: 'staff', entityId: row.id, centreId: ctx.centre.id, summary: `${row.name} added as ${row.roleTitle}` });
  return row;
}

export async function updateStaff(ctx: Ctx, id: string, raw: StaffInput) {
  requireManager(ctx);
  const data = staffInput.parse(raw);
  await loadStaff(ctx.centre.id, id);
  const db = await getDb();
  const [row] = await db
    .update(staff)
    .set(data)
    .where(and(eq(staff.id, id), eq(staff.centreId, ctx.centre.id)))
    .returning();
  await audit(ctx.session, 'staff.update', { entity: 'staff', entityId: id, centreId: ctx.centre.id, summary: `${row.name} edited` });
  return row;
}

/** Leaving keeps the person in old salary and attendance records and switches their login off. */
export async function markStaffLeft(ctx: Ctx, id: string, raw: { leftOn: string }) {
  requireManager(ctx);
  const leftOn = day.parse(raw.leftOn);
  const member = await loadStaff(ctx.centre.id, id);
  if (member.joinedOn && leftOn < member.joinedOn) throw new ApiError(422, 'The leaving date is before the joining date', { leftOn: 'Must be on or after the joining date' });
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.update(staff).set({ active: false, leftOn }).where(and(eq(staff.id, id), eq(staff.centreId, ctx.centre.id)));
    if (member.userId) await tx.update(users).set({ active: false }).where(and(eq(users.id, member.userId), eq(users.centreId, ctx.centre.id)));
    await tx.update(batches).set({ teacherId: null }).where(and(eq(batches.teacherId, id), eq(batches.centreId, ctx.centre.id)));
  });
  await audit(ctx.session, 'staff.left', { entity: 'staff', entityId: id, centreId: ctx.centre.id, summary: `${member.name} marked as left` });
}

export async function rejoinStaff(ctx: Ctx, id: string) {
  requireManager(ctx);
  const member = await loadStaff(ctx.centre.id, id);
  const db = await getDb();
  await db.update(staff).set({ active: true, leftOn: null }).where(and(eq(staff.id, id), eq(staff.centreId, ctx.centre.id)));
  await audit(ctx.session, 'staff.rejoin', { entity: 'staff', entityId: id, centreId: ctx.centre.id, summary: `${member.name} is back on the staff list` });
}

/** Only for an entry made by mistake: anyone with salary, attendance or a class is marked as left instead. */
export async function deleteStaff(ctx: Ctx, id: string) {
  requireManager(ctx);
  const member = await loadStaff(ctx.centre.id, id);
  const db = await getDb();
  const [[paid], [marked], [teaches]] = await Promise.all([
    db.select({ n: count() }).from(expenses).where(eq(expenses.staffId, id)),
    db.select({ n: count() }).from(staffAttendance).where(eq(staffAttendance.staffId, id)),
    db.select({ n: count() }).from(batches).where(eq(batches.teacherId, id)),
  ]);
  if (paid.n + marked.n + teaches.n > 0 || member.userId) {
    fail('This person has salary, attendance, a class or a login on record. Mark them as left instead.');
  }
  // Whether they were active is kept, so the Trash can bring them back as they were.
  await db
    .update(staff)
    .set({ deletedAt: new Date(), active: false, meta: { ...member.meta, trashed: { active: member.active } } })
    .where(and(eq(staff.id, id), eq(staff.centreId, ctx.centre.id)));
  await audit(ctx.session, 'staff.delete', { entity: 'staff', entityId: id, centreId: ctx.centre.id, summary: `${member.name} deleted` });
}

/* ───────────── logins ───────────── */

/** "Moumita Das" → "moumita.das", with a number added if that name is taken. */
export async function proposeUsername(ctx: Ctx, name: string) {
  requireManager(ctx);
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 30) || 'staff';
  const db = await getDb();
  const taken = new Set((await db.select({ username: users.username }).from(users).where(like(users.username, `${base}%`))).map((u) => u.username));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}${n}`)) return `${base}${n}`;
}

/** Gives a staff member a front-desk login. The starting password is returned once and never stored in plain. */
export async function createStaffLogin(ctx: Ctx, staffId: string, raw: { username: string }) {
  requireManager(ctx);
  const username = usernameSchema.parse(raw.username);
  const member = await loadStaff(ctx.centre.id, staffId);
  if (!member.active) fail('This person has left. Bring them back on the staff list first.');
  const db = await getDb();
  const password = startingPassword();
  const passwordHash = await hashPassword(password);

  if (member.userId) {
    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, member.userId), eq(users.centreId, ctx.centre.id)))
      .limit(1);
    if (existing?.active) fail('This person already has a login');
    if (existing) {
      // Switched off earlier: switch the same login back on with a new password.
      await db.update(users).set({ active: true, passwordHash, mustChangePassword: true, failedLogins: 0, lockedUntil: null }).where(eq(users.id, existing.id));
      await audit(ctx.session, 'login.reactivate', { entity: 'user', entityId: existing.id, centreId: ctx.centre.id, summary: `Login ${existing.username} switched back on for ${member.name}` });
      return { username: existing.username, password, name: member.name, phone: member.phone };
    }
  }

  const user = await db.transaction(async (tx) => {
    const [clash] = await tx.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (clash) throw new ApiError(422, 'That username is taken', { username: 'That username is taken. Try another.' });
    const [row] = await tx
      .insert(users)
      .values({ name: member.name, username, phone: member.phone, email: member.email, passwordHash, role: 'centre_staff', centreId: ctx.centre.id, mustChangePassword: true })
      .returning({ id: users.id });
    await tx.update(staff).set({ userId: row.id }).where(and(eq(staff.id, member.id), eq(staff.centreId, ctx.centre.id)));
    return row;
  });
  await audit(ctx.session, 'login.create', { entity: 'user', entityId: user.id, centreId: ctx.centre.id, summary: `Login ${username} created for ${member.name}` });
  return { username, password, name: member.name, phone: member.phone };
}

export async function removeStaffLogin(ctx: Ctx, staffId: string) {
  requireManager(ctx);
  const member = await loadStaff(ctx.centre.id, staffId);
  if (!member.userId) throw new ApiError(400, 'This person has no login');
  await setLoginActive(ctx, member.userId, false);
}

/** The staff and centre head logins of this centre. Parent logins are handled on each child's page. */
export async function listCentreLogins(ctx: Ctx) {
  requireManager(ctx);
  const db = await getDb();
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      phone: users.phone,
      role: users.role,
      active: users.active,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(and(eq(users.centreId, ctx.centre.id), inArray(users.role, ['centre_admin', 'centre_staff'])))
    .orderBy(asc(users.role), asc(users.name));
}

/**
 * A login of this centre that the actor may change. A centre head may change
 * staff logins only: never another centre head's, and never their own from
 * here (their own password has its own screen). Head office may change any.
 */
async function loadManagedLogin(ctx: Ctx, userId: string) {
  requireManager(ctx);
  if (!isUuid(userId)) throw new ApiError(404, 'Login not found');
  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.centreId, ctx.centre.id), inArray(users.role, ['centre_admin', 'centre_staff'])))
    .limit(1);
  if (!user) throw new ApiError(404, 'Login not found');
  if (user.id === ctx.session.uid) throw new ApiError(403, 'Use "Change password" in the top menu for your own login');
  if (user.role === 'centre_admin' && !isHq(ctx.session.role)) throw new ApiError(403, 'Only head office can change a school head login');
  return user;
}

export async function resetLoginPassword(ctx: Ctx, userId: string) {
  const user = await loadManagedLogin(ctx, userId);
  const password = startingPassword();
  const db = await getDb();
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: true, failedLogins: 0, lockedUntil: null })
    .where(eq(users.id, user.id));
  await audit(ctx.session, 'login.reset', { entity: 'user', entityId: user.id, centreId: ctx.centre.id, summary: `Password reset for ${user.username}` });
  return { username: user.username, password, name: user.name, phone: user.phone };
}

export async function setLoginActive(ctx: Ctx, userId: string, active: boolean) {
  const user = await loadManagedLogin(ctx, userId);
  const db = await getDb();
  await db.update(users).set({ active, failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await audit(ctx.session, active ? 'login.activate' : 'login.deactivate', { entity: 'user', entityId: user.id, centreId: ctx.centre.id, summary: `Login ${user.username} switched ${active ? 'on' : 'off'}` });
}

/* ───────────── centre profile ───────────── */

export const centreProfileInput = z.object({
  phone: optionalPhone,
  whatsapp: optionalPhone,
  email: optionalEmail,
  address: text(300),
  area: text(80),
  mapUrl: z.union([z.literal(''), z.string().trim().url('Paste the full map link, starting with https://').max(500)]).default(''),
  photo: text(500),
});
export type CentreProfileInput = z.input<typeof centreProfileInput>;

/** Only the fields a centre head may change; code, agreement and royalty stay with head office. */
export async function updateCentreProfile(ctx: Ctx, raw: CentreProfileInput) {
  requireManager(ctx);
  const data = centreProfileInput.parse(raw);
  const db = await getDb();
  await db
    .update(centres)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(centres.id, ctx.centre.id));
  await audit(ctx.session, 'centre.profile', { entity: 'centre', entityId: ctx.centre.id, centreId: ctx.centre.id, summary: `${ctx.centre.name}: contact details updated` });
}
