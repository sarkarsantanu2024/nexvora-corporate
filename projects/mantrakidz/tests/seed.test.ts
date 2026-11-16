/**
 * Builds a fresh in-memory database, runs every migration and the full seed,
 * then checks the sample data adds up. If this passes, a new machine can run
 * the app with nothing but `npm install && npm run dev`.
 */
import { count, eq, sql, sum } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.MK_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';

let db: DB;
beforeAll(async () => {
  db = await getDb();
}, 120_000);

const countOf = async (table: Parameters<DB['select']>[0] extends never ? never : any) => {
  const [{ n }] = await db.select({ n: count() }).from(table);
  return n;
};

describe('seed', () => {
  it('creates the logins for every role', async () => {
    const rows = await db.select({ username: s.users.username, role: s.users.role }).from(s.users);
    const roles = new Set(rows.map((r) => r.role));
    expect(roles).toEqual(new Set(['hq_admin', 'hq_staff', 'centre_admin', 'centre_staff', 'parent']));
    expect(rows.map((r) => r.username)).toContain('admin');
    expect(rows.map((r) => r.username)).toContain('laketown');
    // The login screen offers this parent login as a sample.
    expect(rows.map((r) => r.username)).toContain('9000001005');
  });

  it('has one real centre and two sample centres hidden from the website', async () => {
    const centres = await db.select().from(s.centres);
    expect(centres).toHaveLength(3);
    expect(centres.filter((c) => c.isDemo)).toHaveLength(2);
    expect(centres.filter((c) => c.isDemo && c.showOnWebsite)).toHaveLength(0);
  });

  it('loads four programmes and sample children', async () => {
    expect(await countOf(s.programmes)).toBe(4);
    expect(await countOf(s.students)).toBeGreaterThan(40);
    expect(await countOf(s.attendance)).toBeGreaterThan(500);
  });

  it('keeps every bill consistent with its payments', async () => {
    const paid = await db
      .select({ invoiceId: s.payments.invoiceId, total: sum(s.payments.amount) })
      .from(s.payments)
      .groupBy(s.payments.invoiceId);
    const byInvoice = new Map(paid.map((p) => [p.invoiceId, Number(p.total)]));
    const invoices = await db.select().from(s.invoices);
    expect(invoices.length).toBeGreaterThan(100);
    for (const inv of invoices) {
      expect(inv.paid).toBe(byInvoice.get(inv.id) ?? 0);
      expect(inv.paid).toBeLessThanOrEqual(inv.total);
      const expected = inv.paid >= inv.total ? 'paid' : inv.paid > 0 ? 'partial' : 'unpaid';
      expect(inv.status).toBe(expected);
    }
  });

  it('never bills a child twice for the same month', async () => {
    const dupes = await db
      .select({ n: count() })
      .from(s.invoices)
      .where(sql`${s.invoices.period} is not null`)
      .groupBy(s.invoices.studentId, s.invoices.period)
      .having(sql`count(*) > 1`);
    expect(dupes).toHaveLength(0);
  });

  it('raises royalty for the sample centres', async () => {
    const rows = await db.select().from(s.royaltyInvoices);
    expect(rows).toHaveLength(6);
    for (const row of rows) expect(row.amount).toBeGreaterThan(0);
    const [head] = await db.select().from(s.centres).where(eq(s.centres.code, 'MK-001'));
    expect(rows.some((r) => r.centreId === head.id)).toBe(false);
  });
});
