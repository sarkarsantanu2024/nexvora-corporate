/**
 * The parent corner: a parent reads only their own children's records,
 * whatever id is sent.
 */
import { and, eq, isNull, ne } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.MK_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import type { Session } from '@/lib/auth';
import { getChild, getReceipt, listChildren, listFees, listNotices, listPayInfo, monthAttendance } from '@/server/parent/service';

let db: DB;
let parent: Session;
let stranger: s.Student; // a child of another family in the same centre

beforeAll(async () => {
  db = await getDb();
  const [user] = await db.select().from(s.users).where(eq(s.users.username, '9000001005'));
  parent = { uid: user.id, name: user.name, username: user.username, role: 'parent', centreId: user.centreId };
  [stranger] = await db
    .select()
    .from(s.students)
    .where(and(eq(s.students.centreId, user.centreId!), isNull(s.students.parentUserId)));
}, 120_000);

describe('parent corner', () => {
  it('lists only the children on this login, with attendance and dues', async () => {
    const kids = await listChildren(parent);
    expect(kids).toHaveLength(2);
    const owned = await db.select({ id: s.students.id }).from(s.students).where(eq(s.students.parentUserId, parent.uid));
    expect(new Set(kids.map((k) => k.id))).toEqual(new Set(owned.map((o) => o.id)));
    for (const kid of kids) {
      expect(kid.attendance.percent).toBeGreaterThanOrEqual(0);
      expect(kid.attendance.percent).toBeLessThanOrEqual(100);
      expect(kid.due).toBeGreaterThanOrEqual(0);
    }
  });

  it("cannot read another family's child, attendance or receipt", async () => {
    await expect(getChild(parent, stranger.id)).rejects.toThrow(/not found/);
    await expect(monthAttendance(parent, stranger.id)).rejects.toThrow(/not found/);
    const [theirReceipt] = await db.select().from(s.payments).where(eq(s.payments.studentId, stranger.id));
    await expect(getReceipt(parent, theirReceipt.id)).rejects.toThrow(/not found/);
    await expect(getChild(parent, 'not-an-id')).rejects.toThrow(/not found/);
  });

  it('shows bills and receipts of own children only, without void receipts', async () => {
    const kids = await listChildren(parent);
    const ids = new Set(kids.map((k) => k.id));
    const fees = await listFees(parent);
    expect(fees.length).toBeGreaterThan(0);
    expect(fees.every((bill) => ids.has(bill.studentId))).toBe(true);

    const withReceipt = fees.find((bill) => bill.receipts.length > 0)!;
    const receipt = await getReceipt(parent, withReceipt.receipts[0].id);
    expect(receipt.student.id).toBe(withReceipt.studentId);

    await db.update(s.payments).set({ voidedAt: new Date(), voidReason: 'test' }).where(eq(s.payments.id, withReceipt.receipts[0].id));
    await expect(getReceipt(parent, withReceipt.receipts[0].id)).rejects.toThrow(/not found/);
    const after = await listFees(parent);
    expect(after.flatMap((bill) => bill.receipts).some((r) => r.id === withReceipt.receipts[0].id)).toBe(false);
  });

  it('reads own attendance for a month', async () => {
    const [kid] = await listChildren(parent);
    const month = await monthAttendance(parent, kid.id);
    expect(Object.keys(month.marks).length).toBe(month.marked + month.counts.holiday);
    expect(month.percent).toBe(kid.attendance.percent);
  });

  it("sees notices of the child's centre and head office, not another centre's", async () => {
    const [otherCentre] = await db.select().from(s.centres).where(and(ne(s.centres.id, parent.centreId!), eq(s.centres.isDemo, true)));
    await db.insert(s.announcements).values([
      { audience: 'parents', centreId: otherCentre.id, title: 'Other centre only', publishOn: '2020-01-01' },
      { audience: 'parents', centreId: null, title: 'From head office', publishOn: '2020-01-01' },
      { audience: 'parents', centreId: parent.centreId, title: 'Expired', publishOn: '2020-01-01', expiresOn: '2020-01-02' },
      { audience: 'centres', centreId: null, title: 'For owners', publishOn: '2020-01-01' },
    ]);
    const titles = (await listNotices(parent)).map((n) => n.title);
    expect(titles).toContain('From head office');
    expect(titles).toContain('Parent-teacher meeting this Saturday');
    expect(titles).not.toContain('Other centre only');
    expect(titles).not.toContain('Expired');
    expect(titles).not.toContain('For owners');
  });

  it("shows the centre's payment details against what this family owes there", async () => {
    const [kid] = await listChildren(parent);
    await db.insert(s.invoices).values({ centreId: kid.centreId, studentId: kid.id, invoiceNo: 'INV/TEST/1', title: 'Picnic', issueDate: '2026-01-01', dueDate: '2026-01-10', subtotal: 700, total: 700 });
    const before = await listPayInfo(parent);
    expect(before).toHaveLength(1);
    expect(before[0].ready).toBe(false);
    const kids = await listChildren(parent);
    expect(before[0].due).toBe(kids.reduce((sum, k) => sum + k.due, 0));
    expect(before[0].bills).toContain('INV/TEST/1');

    await db.update(s.centres).set({ meta: { payment: { upiId: 'centre@upi', payeeName: 'Centre' } } }).where(eq(s.centres.id, kid.centreId));
    const after = await listPayInfo(parent);
    expect(after[0].ready).toBe(true);
    expect(after[0].details.upiId).toBe('centre@upi');
  });

  it('refuses a login that is not a parent', async () => {
    await expect(listChildren({ ...parent, role: 'centre_staff' })).rejects.toThrow(/parents only/);
  });
});
