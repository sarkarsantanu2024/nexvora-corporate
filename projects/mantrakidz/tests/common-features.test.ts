/**
 * The features shared with every Nexvora client app, as Mantra Kidz uses
 * them: WhatsApp reminders to parents, the Trash, importing children from a
 * spreadsheet, the plan and the paused account, the daily job and the
 * overviews' suggestions. Against a fresh in-memory database with the
 * sample data.
 */
import { and, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.MK_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { parseCsv, sheetDate } from '@/lib/csv';
import { addDays, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import type { Ctx } from '@/server/centre/children/shared';
import { admitStudent, deleteStudent, importChildren, type StudentInput } from '@/server/centre/children/students';
import { deleteExpense, saveExpense } from '@/server/centre/money/expenses';
import { deleteCentre } from '@/server/hq/centres';
import { getSetting } from '@/server/hq/shared';
import { runDailyJobs } from '@/server/jobs';
import { getPlatform, updatePlatform } from '@/server/platform';
import { dismissReminder, fillQueue, listQueue, markSent, saveReminderSettings } from '@/server/reminders/service';
import { hqSuggestions, schoolSuggestions } from '@/server/suggestions';
import { listHqTrash, listSchoolTrash, purgeSchoolTrash, restoreHqTrash, restoreSchoolTrash } from '@/server/trash/service';

let db: DB;
let head: Ctx; // Lake Town school head
let desk: Ctx; // Lake Town front desk
let other: Ctx; // Salt Lake school head
let admin: Session;
let programmes: s.Programme[];
let lakeBatches: s.Batch[];
const t = (text: string, values?: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, key) => String(values?.[key] ?? `{${key}}`));

const sessionOf = (user: s.User): Session => ({ uid: user.id, name: user.name, username: user.username, role: user.role, centreId: user.centreId });

async function ctxFor(username: string): Promise<Ctx> {
  const [user] = await db.select().from(s.users).where(eq(s.users.username, username));
  const [centre] = await db.select().from(s.centres).where(eq(s.centres.id, user.centreId!));
  return { session: sessionOf(user), centre };
}

const today = todayIST();
const child = (over: Partial<StudentInput> = {}): StudentInput => ({
  name: 'Riya Sen',
  dob: `2022-${today.slice(5)}`,
  gender: 'Girl',
  programmeId: programmes[1].id,
  batchId: lakeBatches[1].id,
  admissionDate: today,
  monthlyFee: '',
  guardianPhone: '98300 11111',
  motherName: 'Mita Sen',
  ...over,
});

/** A one-off bill straight into the table, so its due date can be anything. */
async function bill(ctx: Ctx, studentId: string, dueDate: string, amount = 1500) {
  const [row] = await db
    .insert(s.invoices)
    .values({ centreId: ctx.centre.id, studentId, invoiceNo: `T-${Math.random().toString(36).slice(2, 9)}`, title: 'Test bill', issueDate: today, dueDate, subtotal: amount, total: amount })
    .returning();
  return row;
}

beforeAll(async () => {
  db = await getDb();
  head = await ctxFor('laketown');
  desk = await ctxFor('laketown.desk');
  other = await ctxFor('saltlake');
  const [adminUser] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = sessionOf(adminUser);
  programmes = await db.select().from(s.programmes).orderBy(s.programmes.sort);
  const all = await db.select().from(s.batches).where(eq(s.batches.centreId, head.centre.id));
  lakeBatches = programmes.map((p) => all.find((b) => b.programmeId === p.id)!);
}, 120_000);

describe('reading a spreadsheet', () => {
  it('reads CSV and pasted cells', () => {
    expect(parseCsv('Name\tMobile\nRiya\t9830011111')).toEqual([
      ['Name', 'Mobile'],
      ['Riya', '9830011111'],
    ]);
  });

  it('reads dates the Indian way', () => {
    expect(sheetDate('04-05-2021')).toBe('2021-05-04');
    expect(sheetDate('4/5/21')).toBe('2021-05-04');
    expect(sheetDate('2021-05-04')).toBe('2021-05-04');
    expect(sheetDate('31-02-2021')).toBeNull();
    expect(sheetDate('next week')).toBeNull();
    expect(sheetDate(' ')).toBe('');
  });
});

describe('reminders to parents', () => {
  let riya: s.Student;
  let dueSoon: s.Invoice;

  it('queues fee due, fee overdue, absent and birthday once each, for the school only', async () => {
    riya = await admitStudent(head, child());
    dueSoon = await bill(head, riya.id, addDays(today, 2));
    await bill(head, riya.id, addDays(today, -5));
    await db.insert(s.attendance).values({ centreId: head.centre.id, studentId: riya.id, batchId: riya.batchId, day: today, status: 'absent' });

    await fillQueue({ centreId: head.centre.id });
    const mine = (await listQueue(head)).rows.filter((row) => row.toName === 'Mita Sen');
    expect(mine.map((row) => row.kind).sort()).toEqual(['absent', 'birthday', 'fee_due', 'fee_overdue']);
    const due = mine.find((row) => row.kind === 'fee_due')!;
    expect(due.body).toContain('₹1,500');
    expect(due.body).toContain('Riya');
    expect(due.href).toBe(`/centre/fees/bills/${dueSoon.id}`);

    // Running again adds nothing for her; another school never sees her.
    await fillQueue({ centreId: head.centre.id });
    expect((await listQueue(head)).rows.filter((row) => row.toName === 'Mita Sen')).toHaveLength(4);
    await fillQueue({ centreId: other.centre.id });
    expect((await listQueue(other)).rows.some((row) => row.toName === 'Mita Sen')).toBe(false);
  });

  it('sets the fee reminder aside by itself once the bill is paid', async () => {
    await db.update(s.invoices).set({ paid: dueSoon.total, status: 'paid' }).where(eq(s.invoices.id, dueSoon.id));
    const { closed } = await fillQueue({ centreId: head.centre.id });
    expect(closed).toBeGreaterThanOrEqual(1);
    const aside = (await listQueue(head, { status: 'dismissed' })).rows.find((row) => row.entityId === dueSoon.id);
    expect(aside?.doneByName).toBe('Not needed any more');
  });

  it('lets the front desk send, and keeps other schools out', async () => {
    const [absent] = (await listQueue(head, { kind: 'absent' })).rows.filter((row) => row.toName === 'Mita Sen');
    await expect(markSent(other, absent.id)).rejects.toMatchObject({ status: 404 });
    await markSent(desk, absent.id);
    expect((await listQueue(head, { status: 'sent' })).rows[0]).toMatchObject({ id: absent.id, doneByName: desk.session.name });
    const [birthday] = (await listQueue(head, { kind: 'birthday' })).rows;
    await dismissReminder(desk, birthday.id);
  });

  it('lets only head office change the switches and wording', async () => {
    await expect(saveReminderSettings(head.session, { daysBefore: 3, kinds: [] })).rejects.toMatchObject({ status: 403 });
    await expect(saveReminderSettings(admin, { daysBefore: 40, kinds: [] })).rejects.toThrow();
    await saveReminderSettings(admin, { daysBefore: 5, kinds: [{ key: 'birthday', enabled: false, template: '' }] });
    const settings = await getSetting('reminders');
    expect(settings).toMatchObject({ daysBefore: 5, enabled: { birthday: false } });
  });
});

describe('import children from a spreadsheet', () => {
  it('admits good rows with their own admission numbers and lists the rest', async () => {
    const className = lakeBatches[1].name;
    const row = (over: Record<string, string>) => ({ name: 'Arjun Das', phone: '9830022222', className, programme: '', dob: '12-03-2022', gender: 'boy', fatherName: 'Amit Das', motherName: '', altPhone: '', email: '', address: '', admissionDate: '', monthlyFee: '', ...over });
    const result = await importChildren(head, [
      row({}),
      row({ name: 'No Class', className: 'Moon Room' }),
      row({ name: 'Bad Date', phone: '9830033333', dob: '31-02-2022' }),
      row({ name: 'Arjun Das' }),
      row({ name: 'No Phone', phone: '' }),
      row({ name: 'By Programme', phone: '9830044444', className: '', programme: programmes[0].name, monthlyFee: '₹1,800' }),
    ]);
    expect(result.added).toBe(2);
    expect(result.skipped).toEqual([
      { row: 3, error: 'No class called "Moon Room" at this school' },
      { row: 4, error: 'Write the date of birth as DD-MM-YYYY' },
      { row: 5, error: 'This child is already on the list' },
      { row: 6, error: 'Enter a 10 digit mobile number' },
    ]);
    const [arjun] = await db.select().from(s.students).where(and(eq(s.students.centreId, head.centre.id), eq(s.students.name, 'Arjun Das')));
    expect(arjun).toMatchObject({ gender: 'Boy', dob: '2022-03-12', guardianPhone: '9830022222', batchId: lakeBatches[1].id });
    expect(arjun.admissionNo).not.toBe('');
    const [byProgramme] = await db.select().from(s.students).where(eq(s.students.name, 'By Programme'));
    expect(byProgramme).toMatchObject({ programmeId: programmes[0].id, batchId: null, monthlyFee: 1800 });
    await expect(importChildren(desk, [])).rejects.toMatchObject({ status: 403 });
  });
});

describe('trash', () => {
  it('brings a deleted child back to the same class, or removes the record for good', async () => {
    const mistake = await admitStudent(head, child({ name: 'Added By Mistake', guardianPhone: '9830055555' }));
    await deleteStudent(head, mistake.id);
    await expect(listSchoolTrash(desk)).rejects.toMatchObject({ status: 403 });
    expect((await listSchoolTrash(head)).map((row) => row.title)).toContain('Added By Mistake');
    expect((await listSchoolTrash(other)).map((row) => row.title)).not.toContain('Added By Mistake');
    await expect(restoreSchoolTrash(other, 'student', mistake.id)).rejects.toMatchObject({ status: 404 });

    await restoreSchoolTrash(head, 'student', mistake.id);
    const [back] = await db.select().from(s.students).where(eq(s.students.id, mistake.id));
    expect(back).toMatchObject({ deletedAt: null, status: 'active', batchId: lakeBatches[1].id });
    expect(back.meta).not.toHaveProperty('trashed');

    await deleteStudent(head, mistake.id);
    await purgeSchoolTrash(head, 'student', mistake.id);
    expect(await db.select().from(s.students).where(eq(s.students.id, mistake.id))).toEqual([]);
  });

  it('brings an expense back but never removes it for good', async () => {
    const expense = await saveExpense(head, { category: 'Electricity', amount: 2400, spentOn: today, paidTo: 'CESC', description: '', method: 'upi' });
    await deleteExpense(head, expense.id);
    await expect(purgeSchoolTrash(head, 'expense', expense.id)).rejects.toMatchObject({ status: 400 });
    await restoreSchoolTrash(head, 'expense', expense.id);
    const [back] = await db.select().from(s.expenses).where(eq(s.expenses.id, expense.id));
    expect(back.deletedAt).toBeNull();
  });

  it('brings a deleted school back with the logins it had', async () => {
    const [empty] = await db
      .insert(s.centres)
      .values({ code: 'MK-990', name: 'Mantra Kidz Test', slug: 'test-school', status: 'onboarding', showOnWebsite: true })
      .returning();
    const [login] = await db.insert(s.users).values({ name: 'Test Head', username: 'test.head', passwordHash: 'x', role: 'centre_admin', centreId: empty.id }).returning();
    await deleteCentre(admin, empty.id);
    expect((await listHqTrash(admin)).map((row) => row.title)).toContain('Mantra Kidz Test');
    await expect(listHqTrash(head.session)).rejects.toMatchObject({ status: 403 });
    await restoreHqTrash(admin, 'centre', empty.id);
    const [[school], [user]] = await Promise.all([db.select().from(s.centres).where(eq(s.centres.id, empty.id)), db.select().from(s.users).where(eq(s.users.id, login.id))]);
    expect(school).toMatchObject({ deletedAt: null, showOnWebsite: true });
    expect(user.active).toBe(true);
  });
});

describe('plan and paused account', () => {
  it('starts on Platinum and changes only through updatePlatform', async () => {
    expect(await getPlatform()).toMatchObject({ plan: 'platinum', status: 'active' });
    await updatePlatform({ status: 'suspended', note: 'Payment due' });
    expect(await runDailyJobs()).toEqual(['account paused: nothing run']);
    await updatePlatform({ status: 'active', plan: 'panel' });
    expect((await runDailyJobs())[0]).toBe('reminders: not in the plan');
    await updatePlatform({ plan: 'platinum' });
    expect((await runDailyJobs())[0]).toMatch(/^reminders: \d+ queued/);
    expect((await getSetting('jobs')).lastRunAt).not.toBe('');
  });
});

describe('suggestions', () => {
  it('tells a school about children outside a class, and head office about sample data', async () => {
    const ids = (await schoolSuggestions(head, t)).map((item) => item.id);
    expect(ids.some((id) => id.startsWith('no-class-'))).toBe(true);
    expect((await hqSuggestions(admin, t)).map((item) => item.id).some((id) => id.startsWith('sample-'))).toBe(true);
    // Staff do not see money totals or set-up cards.
    expect((await schoolSuggestions(desk, t)).some((item) => item.id.startsWith('over-') || item.id.startsWith('parent-login-'))).toBe(false);
  });
});
