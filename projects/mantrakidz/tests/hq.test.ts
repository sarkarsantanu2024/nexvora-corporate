/**
 * Head office services against a fresh in-memory database with the full seed:
 * royalty run and payments, lead conversion, login rules, removing sample data.
 */
import { and, count, eq, gte, isNull, lte, sum } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.MK_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { addMonths, currentPeriod, periodRange, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { removeSampleData, saveProgramme } from '@/server/hq/admin';
import { updateCentreAgreement } from '@/server/hq/centres';
import { convertLead, createLead } from '@/server/hq/leads';
import { getOverview } from '@/server/hq/overview';
import { listRoyalty, recordRoyaltyPayment, runRoyalty, voidRoyaltyPayment } from '@/server/hq/royalty';
import { royaltyTermsFor } from '@/server/hq/shared';
import { createHqUser, setUserActive } from '@/server/hq/users';

let db: DB;
let admin: Session;
let staff: Session;
let head: s.Centre;
let lakeTown: s.Centre;
let saltLake: s.Centre;

/** A finished month the seed has not raised royalty for (it covers the last three). */
const PERIOD = addMonths(currentPeriod(), -4);

const sessionOf = (user: s.User): Session => ({ uid: user.id, name: user.name, username: user.username, role: user.role, centreId: user.centreId });

async function collection(centreId: string, period: string) {
  const { from, to } = periodRange(period);
  const [row] = await db
    .select({ total: sum(s.payments.amount) })
    .from(s.payments)
    .where(and(eq(s.payments.centreId, centreId), isNull(s.payments.voidedAt), gte(s.payments.paidOn, from), lte(s.payments.paidOn, to)));
  return Number(row.total ?? 0);
}

const billsOf = (period: string) => db.select().from(s.royaltyInvoices).where(eq(s.royaltyInvoices.period, period));

beforeAll(async () => {
  db = await getDb();
  const users = await db.select().from(s.users);
  admin = sessionOf(users.find((u) => u.username === 'admin')!);
  staff = sessionOf(users.find((u) => u.username === 'hqstaff')!);
  const centres = await db.select().from(s.centres);
  head = centres.find((c) => c.code === 'MK-001')!;
  lakeTown = centres.find((c) => c.code === 'MK-002')!;
  saltLake = centres.find((c) => c.code === 'MK-003')!;
}, 120_000);

describe('royalty run', () => {
  it('raises one bill per franchise school, percent and fixed, and skips the company-owned school', async () => {
    const result = await runRoyalty(staff, { period: PERIOD });
    expect(result.created).toBe(2);

    const bills = await billsOf(PERIOD);
    expect(bills).toHaveLength(2);
    expect(bills.some((b) => b.centreId === head.id)).toBe(false);

    const percentBill = bills.find((b) => b.centreId === lakeTown.id)!;
    const basis = await collection(lakeTown.id, PERIOD);
    expect(basis).toBeGreaterThan(0);
    expect(percentBill.basisAmount).toBe(basis);
    expect(percentBill.amount).toBe(Math.round((basis * 12) / 100));
    expect(percentBill.status).toBe('unpaid');
    expect(percentBill.dueDate).toBe(`${addMonths(PERIOD, 1)}-10`);

    const fixedBill = bills.find((b) => b.centreId === saltLake.id)!;
    expect(fixedBill.amount).toBe(8000);
    expect(fixedBill.royaltyType).toBe('fixed');
  });

  it('does not duplicate when run again', async () => {
    const again = await runRoyalty(admin, { period: PERIOD });
    expect(again.created).toBe(0);
    expect(again.unchanged).toBe(2);
    expect(await billsOf(PERIOD)).toHaveLength(2);
  });

  it('leaves voided receipts out, and recalculates an unpaid bill only when asked', async () => {
    const [invoice] = await db.select().from(s.invoices).where(eq(s.invoices.centreId, lakeTown.id)).limit(1);
    const late = { centreId: lakeTown.id, studentId: invoice.studentId, invoiceId: invoice.id, method: 'cash' as const, paidOn: `${PERIOD}-15` };
    await db.insert(s.payments).values([
      { ...late, receiptNo: 'TEST/VOID', amount: 9000, voidedAt: new Date(), voidReason: 'Wrong entry' },
      { ...late, receiptNo: 'TEST/LATE', amount: 1000 },
    ]);
    const before = (await billsOf(PERIOD)).find((b) => b.centreId === lakeTown.id)!;

    const offered = await runRoyalty(admin, { period: PERIOD });
    expect(offered.recalculated).toBe(0);
    expect(offered.stale).toHaveLength(1);
    expect(offered.stale[0].newAmount).toBe(Math.round(((before.basisAmount + 1000) * 12) / 100));

    const done = await runRoyalty(admin, { period: PERIOD, recalculate: true });
    expect(done.recalculated).toBe(1);
    const after = (await billsOf(PERIOD)).find((b) => b.centreId === lakeTown.id)!;
    expect(after.basisAmount).toBe(before.basisAmount + 1000);
    expect(await billsOf(PERIOD)).toHaveLength(2);
  });

  it('refuses a month that is not over', async () => {
    await expect(runRoyalty(admin, { period: currentPeriod() })).rejects.toThrow(/after the month is over/);
  });

  it('keeps finished months on the old terms when royalty terms change', async () => {
    await expect(updateCentreAgreement(staff, saltLake.id, { royaltyType: 'fixed', royaltyValue: 9500 })).rejects.toThrow(/admin/);
    const changed = await updateCentreAgreement(admin, saltLake.id, {
      agreementStart: saltLake.agreementStart,
      agreementEnd: saltLake.agreementEnd,
      franchiseFee: saltLake.franchiseFee,
      franchiseFeePaid: saltLake.franchiseFeePaid,
      royaltyType: 'percent',
      royaltyValue: 10,
    });
    expect(royaltyTermsFor(changed, PERIOD)).toEqual({ type: 'fixed', value: 8000 });
    expect(royaltyTermsFor(changed, currentPeriod())).toEqual({ type: 'percent', value: 10 });
    const logged = await db.select().from(s.auditLog).where(eq(s.auditLog.action, 'centre.royalty.change'));
    expect(logged).toHaveLength(1);
  });
});

describe('royalty payment', () => {
  it('cannot exceed the balance, allows a part payment, and sets the status', async () => {
    const bill = (await billsOf(PERIOD)).find((b) => b.centreId === saltLake.id)!;
    const pay = (amount: number, by: Session = admin) => recordRoyaltyPayment(by, { invoiceId: bill.id, amount, method: 'bank', reference: 'NEFT1', paidOn: todayIST() });

    await expect(pay(1000, staff)).rejects.toThrow(/admin/);
    await expect(pay(8001)).rejects.toThrow(/Only ₹8,000 is due/);
    await expect(pay(0)).rejects.toThrow();

    const part = await pay(3000);
    expect(part.invoice.paid).toBe(3000);
    expect(part.invoice.status).toBe('partial');
    await expect(pay(5001)).rejects.toThrow(/Only ₹5,000 is due/);

    const rest = await pay(5000);
    expect(rest.invoice.status).toBe('paid');
    await expect(pay(1)).rejects.toThrow();

    // A wrong entry is reversed, not deleted, and cannot be reversed twice.
    await voidRoyaltyPayment(admin, rest.payment.id);
    const [after] = await db.select().from(s.royaltyInvoices).where(eq(s.royaltyInvoices.id, bill.id));
    expect(after.paid).toBe(3000);
    expect(after.status).toBe('partial');
    await expect(voidRoyaltyPayment(admin, rest.payment.id)).rejects.toThrow(/already been cancelled/);

    const month = await listRoyalty(PERIOD);
    expect(month.totals.paid).toBe(3000);
    expect(month.totals.balance).toBe(month.totals.amount - 3000);
  });
});

describe('franchise lead conversion', () => {
  it('creates the school and the owner login and links the lead, all together', async () => {
    const lead = await createLead(staff, { name: 'Test Owner', phone: '98300 12345', city: 'Howrah', state: 'West Bengal', source: 'referral' });
    expect(lead.phone).toBe('9830012345');
    expect(lead.stage).toBe('new');

    const { centre, login } = await convertLead(admin, lead.id, {
      centreName: 'Mantra Kidz Howrah',
      royaltyType: 'percent',
      royaltyValue: 10,
      login: { username: 'Howrah', password: 'start123' },
    });
    expect(centre.status).toBe('onboarding');
    expect(centre.code).toBe('MK-004');
    expect(centre.slug).toBe('howrah');
    expect(centre.ownerName).toBe('Test Owner');
    expect(centre.ownerPhone).toBe('9830012345');
    expect(centre.city).toBe('Howrah');
    expect(login?.username).toBe('howrah');

    const [saved] = await db.select().from(s.franchiseLeads).where(eq(s.franchiseLeads.id, lead.id));
    expect(saved.stage).toBe('onboarded');
    expect(saved.convertedCentreId).toBe(centre.id);

    const [user] = await db.select().from(s.users).where(eq(s.users.username, 'howrah'));
    expect(user.role).toBe('centre_admin');
    expect(user.centreId).toBe(centre.id);
    expect(user.mustChangePassword).toBe(true);
    expect(user.passwordHash).not.toContain('start123');

    await expect(convertLead(admin, lead.id, { centreName: 'Again' })).rejects.toThrow(/already been converted/);
  });

  it('saves nothing when the login cannot be created', async () => {
    const lead = await createLead(staff, { name: 'Second Owner', phone: '9830012346' });
    const [{ n: before }] = await db.select({ n: count() }).from(s.centres);
    await expect(convertLead(admin, lead.id, { centreName: 'Mantra Kidz Barasat', login: { username: 'admin', password: 'start123' } })).rejects.toThrow(/already in use/);
    const [{ n: after }] = await db.select({ n: count() }).from(s.centres);
    expect(after).toBe(before);
    const [saved] = await db.select().from(s.franchiseLeads).where(eq(s.franchiseLeads.id, lead.id));
    expect(saved.stage).toBe('new');
    expect(saved.convertedCentreId).toBeNull();
  });
});

describe('logins', () => {
  it('will not deactivate yourself or the last admin', async () => {
    await expect(setUserActive(admin, admin.uid, false)).rejects.toThrow(/your own login/);
    const second = await createHqUser(admin, { name: 'Second Admin', username: 'admin2', password: 'start123', role: 'hq_admin' });
    const secondSession: Session = { uid: second.id, name: second.name, username: second.username, role: 'hq_admin', centreId: null };
    await setUserActive(secondSession, admin.uid, false);
    await expect(setUserActive(admin, second.id, false)).rejects.toThrow(/last head office admin/);
    await setUserActive(secondSession, admin.uid, true);
    await expect(createHqUser(staff, { name: 'X', username: 'nope', password: 'start123', role: 'hq_staff' })).rejects.toThrow(/admin/);
  });
});

describe('programme translations', () => {
  it('keeps only what was filled in, checks lengths and logs which language changed', async () => {
    const [nursery] = await db.select().from(s.programmes).where(eq(s.programmes.slug, 'nursery'));
    const base = { name: nursery.name, slug: nursery.slug, highlights: nursery.highlights };
    const saved = await saveProgramme(staff, nursery.id, {
      ...base,
      i18n: { bn: { name: 'নার্সারি', tagline: '', highlights: ['', ''] }, hi: {} },
    });
    expect(saved.i18n).toEqual({ bn: { name: 'নার্সারি' } });
    expect(saved.name).toBe('Nursery');

    await expect(saveProgramme(staff, nursery.id, { ...base, i18n: { hi: { name: 'x'.repeat(61) } } })).rejects.toThrow();

    const logs = await db.select().from(s.auditLog).where(and(eq(s.auditLog.action, 'programme.update'), eq(s.auditLog.entityId, nursery.id)));
    expect(logs.some((row) => row.summary.includes('wording'))).toBe(true);

    const fresh = await saveProgramme(staff, null, { name: 'Day Care' });
    expect(fresh.i18n).toEqual({});
  });
});

describe('overview', () => {
  it('adds up from the same data as the schools', async () => {
    const overview = await getOverview();
    expect(overview.tiles.activeCentres).toBe(3);
    const [{ n }] = await db.select({ n: count() }).from(s.students).where(eq(s.students.status, 'active'));
    expect(overview.tiles.childrenOnRoll).toBe(n);
    const thisMonth = (await collection(lakeTown.id, currentPeriod())) + (await collection(saltLake.id, currentPeriod()));
    expect(overview.tiles.collectedThisMonth).toBe(thisMonth);
    expect(overview.collectionByMonth).toHaveLength(6);
  });
});

describe('removing sample data', () => {
  it('needs the typed word and an admin', async () => {
    await expect(removeSampleData(admin, 'yes')).rejects.toThrow(/REMOVE/);
    await expect(removeSampleData(staff, 'REMOVE')).rejects.toThrow(/admin/);
  });

  it('removes the sample schools and leads and leaves the real school and the admin', async () => {
    const result = await removeSampleData(admin, 'REMOVE');
    expect(result.centres).toBe(2);
    expect(result.leads).toBe(9);

    const centres = await db.select().from(s.centres);
    expect(centres.some((c) => c.isDemo)).toBe(false);
    expect(centres.map((c) => c.code)).toContain('MK-001');
    // The centre made from a real lead in this test run is not sample data.
    expect(centres.map((c) => c.code)).toContain('MK-004');

    const users = await db.select().from(s.users);
    expect(users.find((u) => u.username === 'admin')?.active).toBe(true);
    expect(users.some((u) => u.username === 'laketown')).toBe(false);

    for (const table of [s.students, s.payments, s.invoices, s.attendance, s.expenses, s.royaltyInvoices, s.royaltyPayments]) {
      const [{ n }] = await db.select({ n: count() }).from(table);
      expect(n).toBe(0);
    }
    const leads = await db.select().from(s.franchiseLeads);
    expect(leads.some((l) => l.isDemo)).toBe(false);
    expect(leads.length).toBe(2);
  });
});
