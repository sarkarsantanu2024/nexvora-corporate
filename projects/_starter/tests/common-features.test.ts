/**
 * The features every client gets on top of the website and the edit panel:
 * WhatsApp reminders, the Trash, importing from a spreadsheet, the plan and
 * the paused account, the daily job and the overview's suggestions.
 */
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { parseCsv } from '@/lib/csv';
import { planAllows } from '@/lib/plans';
import { bearerMatches } from '@/lib/secret';
import type { Session } from '@/lib/session-token';
import { fillTemplate } from '@/lib/wa';
import { createUser } from '@/server/admin/users';
import { getSetting, putSetting } from '@/server/admin/shared';
import { deleteEnquiry, importEnquiries, listEnquiries, setEnquiryStatus } from '@/server/enquiries/service';
import { runDailyJobs } from '@/server/jobs';
import { getPlatform, updatePlatform } from '@/server/platform';
import { cleanQueue, dismissReminder, fillQueue, listQueue, loadReminderSettings, markSent, reopenReminder, saveReminderSettings } from '@/server/reminders/service';
import { contactSchema, createEnquiry } from '@/server/site/enquiries';
import { listSuggestions } from '@/server/suggestions';
import { listTrash, purgeFromTrash, restoreFromTrash } from '@/server/trash/service';

let db: DB;
let admin: Session;
let staff: Session;
const t = (text: string, values?: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, key) => String(values?.[key] ?? `{${key}}`));
const send = async (input: Record<string, string>) => createEnquiry(contactSchema('en').parse(input));

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = { uid: row.id, name: row.name, username: row.username, role: row.role };
  const desk = await createUser(admin, { name: 'Front Desk', username: 'desk', password: 'start123', role: 'staff' });
  staff = { uid: desk.id, name: desk.name, username: desk.username, role: desk.role };
}, 120_000);

describe('small helpers', () => {
  it('reads CSV with quotes, and cells pasted from Excel', () => {
    expect(parseCsv('﻿Name,Mobile\r\n"Roy, Asha",98300 12345\r\n\r\n"He said ""hi""",x')).toEqual([
      ['Name', 'Mobile'],
      ['Roy, Asha', '98300 12345'],
      ['He said "hi"', 'x'],
    ]);
    expect(parseCsv('Name\tMobile\nAsha\t9830012345\n')).toEqual([
      ['Name', 'Mobile'],
      ['Asha', '9830012345'],
    ]);
    expect(parseCsv('a;b;c\n1;2;3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('fills a template and leaves an unknown word visible', () => {
    expect(fillTemplate('Namaste {name}, {amount} due. {oops}', { name: 'Asha', amount: 1200 })).toBe('Namaste Asha, 1200 due. {oops}');
  });

  it('opens a plan and the ones below it', () => {
    expect(planAllows('platinum', 'panel')).toBe(true);
    expect(planAllows('panel', 'panel')).toBe(true);
    expect(planAllows('website', 'panel')).toBe(false);
  });

  it('accepts only the right key, and never a short one', () => {
    const req = (value: string) => new Request('http://x/api', { headers: { authorization: `Bearer ${value}` } });
    process.env.TEST_KEY = 'k'.repeat(40);
    expect(bearerMatches(req('k'.repeat(40)), 'TEST_KEY')).toBe(true);
    expect(bearerMatches(req('k'.repeat(39)), 'TEST_KEY')).toBe(false);
    expect(bearerMatches(new Request('http://x/api'), 'TEST_KEY')).toBe(false);
    process.env.TEST_KEY = 'short';
    expect(bearerMatches(req('short'), 'TEST_KEY')).toBe(false);
    delete process.env.TEST_KEY;
    expect(bearerMatches(req(''), 'TEST_KEY')).toBe(false);
  });
});

describe('reminders', () => {
  it('queues a thank-you for a new enquiry once, however often it runs', async () => {
    await putSetting('org', { ...(await getSetting('org')), name: 'Sunrise Stores' });
    await send({ name: 'Asha Roy', phone: '9830012345', message: 'Price list please' });
    await send({ name: 'No Phone', phone: '9830099998', message: 'x' });
    const first = await fillQueue();
    expect(first.added).toBe(2);
    expect((await fillQueue()).added).toBe(0);
    const { rows, counts } = await listQueue();
    expect(counts).toEqual({ waiting: 2, sent: 0, dismissed: 0 });
    const asha = rows.find((row) => row.toName === 'Asha Roy');
    expect(asha?.body).toBe('Namaste Asha, thank you for your message to Sunrise Stores. We will call you soon. You can also reply here on WhatsApp.');
    expect(asha?.href).toMatch(/^\/admin\/enquiries\//);
  });

  it('sets a reminder aside by itself once the enquiry is answered', async () => {
    const [target] = (await listEnquiries({ q: 'No Phone' })).rows;
    await setEnquiryStatus(staff, target.id, 'contacted');
    const { closed } = await fillQueue();
    expect(closed).toBe(1);
    const { rows } = await listQueue({ status: 'dismissed' });
    expect(rows[0]).toMatchObject({ toName: 'No Phone', doneByName: 'Not needed any more' });
  });

  it('lets staff send, put back and set aside, once each', async () => {
    const [row] = (await listQueue()).rows;
    await markSent(staff, row.id);
    await expect(markSent(staff, row.id)).rejects.toMatchObject({ status: 404 });
    expect((await listQueue({ status: 'sent' })).rows[0]).toMatchObject({ id: row.id, doneByName: 'Front Desk' });
    await reopenReminder(staff, row.id);
    await dismissReminder(staff, row.id);
    expect((await listQueue()).counts).toEqual({ waiting: 0, sent: 0, dismissed: 2 });
  });

  it('follows the switch and the owner wording; only an admin changes them', async () => {
    await expect(saveReminderSettings(staff, { kinds: [] })).rejects.toMatchObject({ status: 403 });
    await saveReminderSettings(admin, { kinds: [{ key: 'enquiry_reply', enabled: true, template: 'Hi {name}, from {business}.' }] });
    await send({ name: 'Bimal Das', phone: '9830077777', message: 'Hello' });
    await fillQueue();
    expect((await listQueue()).rows[0].body).toBe('Hi Bimal, from Sunrise Stores.');
    await saveReminderSettings(admin, { kinds: [{ key: 'enquiry_reply', enabled: false, template: '' }] });
    await send({ name: 'Chandan Pal', phone: '9830066666', message: 'Hello' });
    expect((await fillQueue()).added).toBe(0);
    const [setting] = await loadReminderSettings();
    expect(setting).toMatchObject({ enabled: false });
    // An empty box means the original wording.
    expect(setting.template).toBe(setting.defaultTemplate);
  });

  it('clears old rows', async () => {
    const later = new Date(Date.now() + 61 * 86_400_000);
    expect(await cleanQueue(later)).toBeGreaterThanOrEqual(2);
    expect((await listQueue({ status: 'dismissed' })).total).toBe(0);
  });
});

describe('trash', () => {
  it('brings an enquiry back, or removes it for good, admin only', async () => {
    const [target] = (await listEnquiries({ q: 'Bimal' })).rows;
    await deleteEnquiry(admin, target.id);
    await expect(listTrash(staff)).rejects.toMatchObject({ status: 403 });
    const trash = await listTrash(admin);
    expect(trash.map((row) => row.title)).toContain('Bimal Das');

    await restoreFromTrash(admin, 'enquiry', target.id);
    expect((await listEnquiries({ q: 'Bimal' })).total).toBe(1);
    await expect(restoreFromTrash(admin, 'enquiry', target.id)).rejects.toMatchObject({ status: 404 });

    await deleteEnquiry(admin, target.id);
    await expect(purgeFromTrash(staff, 'enquiry', target.id)).rejects.toMatchObject({ status: 403 });
    await purgeFromTrash(admin, 'enquiry', target.id);
    expect(await db.select().from(s.enquiries).where(eq(s.enquiries.id, target.id))).toEqual([]);
    await expect(restoreFromTrash(admin, 'nonsense', target.id)).rejects.toMatchObject({ status: 400 });
  });
});

describe('import from a spreadsheet', () => {
  it('adds good rows and lists the rest with the reason', async () => {
    const result = await importEnquiries(admin, [
      { name: 'Dipa Sen', phone: '+91 98300 55555', email: '', subject: 'Old customer', message: '' },
      { name: '', phone: '9830044444', email: '', subject: '', message: '' },
      { name: 'Bad Number', phone: '12345', email: '', subject: '', message: '' },
      { name: 'Asha again', phone: '9830012345', email: '', subject: '', message: '' },
      { name: 'Nothing To Reach', phone: '', email: '', subject: '', message: '' },
      { name: 'Email Only', phone: '', email: 'e@example.com', subject: '', message: 'Note' },
    ]);
    expect(result.added).toBe(2);
    expect(result.skipped).toEqual([
      { row: 3, error: 'Name is required' },
      { row: 4, error: 'Enter a 10 digit mobile number' },
      { row: 5, error: 'This mobile number is already in the list' },
      { row: 6, error: 'Give a mobile number or an email' },
    ]);
    const [dipa] = (await listEnquiries({ q: 'Dipa' })).rows;
    expect(dipa).toMatchObject({ phone: '9830055555', status: 'contacted', source: 'import', message: 'Old customer' });
    await expect(importEnquiries(staff, [])).rejects.toMatchObject({ status: 403 });
    await expect(importEnquiries(admin, 'not a list')).rejects.toMatchObject({ status: 400 });
  });
});

describe('plan and paused account', () => {
  it('starts on every feature and changes only through updatePlatform', async () => {
    expect(await getPlatform()).toMatchObject({ plan: 'platinum', status: 'active' });
    await updatePlatform({ plan: 'website', status: 'suspended', note: 'Payment due' });
    expect(await getPlatform()).toMatchObject({ plan: 'website', status: 'suspended', note: 'Payment due' });
    await expect(updatePlatform({})).rejects.toMatchObject({ status: 400 });
    await expect(updatePlatform({ plan: 'gold' as never })).rejects.toThrow();
    const [log] = await db.select().from(s.auditLog).where(eq(s.auditLog.action, 'platform.update'));
    expect(log.summary).toContain('account paused');
  });

  it('runs no daily job while paused, and all of them once switched on', async () => {
    expect(await runDailyJobs()).toEqual(['account paused: nothing run']);
    await updatePlatform({ status: 'active' });
    // On the website plan there are no reminders to make.
    expect((await runDailyJobs())[0]).toBe('reminders: not in the plan');
    await updatePlatform({ plan: 'platinum' });
    const lines = await runDailyJobs();
    expect(lines[0]).toMatch(/^reminders: \d+ queued/);
    expect((await getSetting('jobs')).lastRunAt).not.toBe('');
  });
});

describe('suggestions', () => {
  it('asks for missing details and sample photos, and stops once they are done', async () => {
    const ids = (await listSuggestions(admin, t)).map((item) => item.id);
    expect(ids).toContain('org-details');
    expect(ids).toContain('sample-photos');
    expect((await listSuggestions(staff, t)).map((item) => item.id)).not.toContain('org-details');
    await putSetting('org', { ...(await getSetting('org')), phone: '9830012345', address: 'Kolkata' });
    expect((await listSuggestions(admin, t)).map((item) => item.id)).not.toContain('org-details');
  });
});
