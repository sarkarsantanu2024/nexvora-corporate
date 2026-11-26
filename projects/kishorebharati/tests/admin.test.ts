/**
 * Logins, settings, the activity log and the overview, against a fresh
 * in-memory database: what an admin may do and what staff may not.
 */
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { verifyPassword } from '@/lib/auth';
import type { Session } from '@/lib/session-token';
import { getOverview, listAudit, loadSettings, saveOrgSettings } from '@/server/admin/service';
import { createUser, listLogins, resetUserPassword, setUserActive, unlockUser } from '@/server/admin/users';

let db: DB;
let admin: Session;
let staff: Session;

const sessionOf = (user: { id: string; name: string; username: string; role: s.Role }): Session => ({ uid: user.id, name: user.name, username: user.username, role: user.role });

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = sessionOf(row);
  staff = sessionOf(await createUser(admin, { name: 'Front Desk', username: 'desk', password: 'start123', role: 'staff' }));
}, 120_000);

describe('logins', () => {
  it('creates a login that must change its password, and never returns the hash', async () => {
    const [row] = await db.select().from(s.users).where(eq(s.users.id, staff.uid));
    expect(row.mustChangePassword).toBe(true);
    expect(await verifyPassword('start123', row.passwordHash)).toBe(true);
    const listed = await listLogins(admin);
    expect(listed.map((user) => user.username).sort()).toEqual(['admin', 'desk']);
    expect(listed.every((user) => !('passwordHash' in user))).toBe(true);
  });

  it('refuses a username that is taken, a short password and a bad username', async () => {
    await expect(createUser(admin, { name: 'Copy', username: 'DESK', password: 'start123', role: 'staff' })).rejects.toMatchObject({ fields: { username: expect.any(String) } });
    await expect(createUser(admin, { name: 'Short', username: 'short', password: '123', role: 'staff' })).rejects.toThrow();
    await expect(createUser(admin, { name: 'Spaces', username: 'has space', password: 'start123', role: 'staff' })).rejects.toThrow();
  });

  it('lets only an admin manage logins', async () => {
    await expect(createUser(staff, { name: 'X', username: 'nope', password: 'start123', role: 'staff' })).rejects.toMatchObject({ status: 403 });
    await expect(listLogins(staff)).rejects.toMatchObject({ status: 403 });
    await expect(resetUserPassword(staff, { userId: admin.uid, password: 'hacked123' })).rejects.toMatchObject({ status: 403 });
    await expect(setUserActive(staff, admin.uid, false)).rejects.toMatchObject({ status: 403 });
  });

  it('will not deactivate yourself or the last admin', async () => {
    await expect(setUserActive(admin, admin.uid, false)).rejects.toThrow(/your own login/);
    const second = sessionOf(await createUser(admin, { name: 'Second Admin', username: 'admin2', password: 'start123', role: 'admin' }));
    await setUserActive(second, admin.uid, false);
    await expect(setUserActive(admin, second.uid, false)).rejects.toThrow(/last admin/);
    await setUserActive(second, admin.uid, true);
  });

  it('resets a password and clears a lock', async () => {
    await db.update(s.users).set({ failedLogins: 4, lockedUntil: new Date(Date.now() + 60_000) }).where(eq(s.users.id, staff.uid));
    await unlockUser(admin, staff.uid);
    let [row] = await db.select().from(s.users).where(eq(s.users.id, staff.uid));
    expect(row.lockedUntil).toBeNull();
    expect(row.failedLogins).toBe(0);

    await resetUserPassword(admin, { userId: staff.uid, password: 'fresh456', mustChange: false });
    [row] = await db.select().from(s.users).where(eq(s.users.id, staff.uid));
    expect(await verifyPassword('fresh456', row.passwordHash)).toBe(true);
    expect(row.mustChangePassword).toBe(false);
  });
});

describe('settings', () => {
  it('saves the business details for an admin only, and checks them', async () => {
    await expect(saveOrgSettings(staff, { name: 'Nope' })).rejects.toMatchObject({ status: 403 });
    await expect(saveOrgSettings(admin, { name: '' })).rejects.toThrow();
    await expect(saveOrgSettings(admin, { name: 'Shop', phone: '12345' })).rejects.toThrow();
    await saveOrgSettings(admin, { name: 'Sunrise Stores', legalName: 'Sunrise Stores Pvt Ltd', phone: '+91 98300 12345', email: '', address: '12 Park Street' });
    expect((await loadSettings()).org).toEqual({ name: 'Sunrise Stores', legalName: 'Sunrise Stores Pvt Ltd', phone: '9830012345', email: '', address: '12 Park Street' });
  });
});

describe('activity log', () => {
  it('records who did what and filters by kind and person', async () => {
    await expect(listAudit(staff)).rejects.toMatchObject({ status: 403 });
    const all = await listAudit(admin);
    expect(all.total).toBeGreaterThan(5);
    expect(all.kinds).toEqual(expect.arrayContaining(['user', 'settings']));

    const userOnly = await listAudit(admin, { action: 'user' });
    expect(userOnly.rows.length).toBeGreaterThan(0);
    expect(userOnly.rows.every((row) => row.action.startsWith('user'))).toBe(true);

    // A wildcard typed by the person is taken literally, so it matches nothing extra.
    expect((await listAudit(admin, { action: '%' })).total).toBe(all.total);
    expect((await listAudit(admin, { user: admin.uid })).rows.every((row) => row.userId === admin.uid)).toBe(true);
    expect((await listAudit(admin, { from: '2099-01-01' })).total).toBe(0);
  });
});

describe('overview', () => {
  it('counts what is in the database', async () => {
    const { tiles, latest, activity } = await getOverview();
    // The gallery starts with the school's own 15 photos (src/db/seed-site.ts).
    expect(tiles).toMatchObject({ newEnquiries: 0, enquiries: 0, notices: 0, photos: 15 });
    // admin, desk and admin2 are all active.
    expect(tiles.users).toBe(3);
    expect(latest).toEqual([]);
    expect(activity.length).toBeGreaterThan(0);
  });
});
