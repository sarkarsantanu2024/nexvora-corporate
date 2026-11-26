/**
 * The path of an enquiry, against a fresh in-memory database: the public
 * contact form checks what it is sent, the row lands in the dashboard list,
 * and the team moves it along with a status and notes.
 */
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import type { Session } from '@/lib/session-token';
import { getOverview } from '@/server/admin/service';
import { createUser } from '@/server/admin/users';
import { addEnquiryNote, deleteEnquiry, getEnquiry, listEnquiries, setEnquiryStatus } from '@/server/enquiries/service';
import { bodyLang, contactSchema, createEnquiry, isBot } from '@/server/site/enquiries';

let db: DB;
let admin: Session;
let staff: Session;

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = { uid: row.id, name: row.name, username: row.username, role: row.role };
  const desk = await createUser(admin, { name: 'Front Desk', username: 'desk', password: 'start123', role: 'staff' });
  staff = { uid: desk.id, name: desk.name, username: desk.username, role: desk.role };
}, 120_000);

const send = async (input: Record<string, string>) => createEnquiry(contactSchema('en').parse(input));

describe('contact form', () => {
  it('cleans the mobile number and stores the message as a new enquiry', async () => {
    const { id } = await send({ name: '  Asha Roy ', phone: '+91 98300 12345', email: '', subject: 'Price list', message: 'Please send your price list.' });
    const found = await getEnquiry(id);
    expect(found?.row).toMatchObject({ name: 'Asha Roy', phone: '9830012345', subject: 'Price list', status: 'new', source: 'website' });
    expect(found?.notes).toEqual([]);
  });

  it('refuses a missing name, a bad number, a bad email and an empty message', () => {
    const check = (input: Record<string, string>) => contactSchema('en').safeParse(input);
    const good = { name: 'Asha', phone: '9830012345', message: 'Hello' };
    expect(check(good).success).toBe(true);
    expect(check({ ...good, name: '' }).success).toBe(false);
    expect(check({ ...good, phone: '12345' }).success).toBe(false);
    expect(check({ ...good, email: 'not-an-email' }).success).toBe(false);
    expect(check({ ...good, message: ' ' }).success).toBe(false);
    expect(check({ ...good, message: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('answers in the language of the form', () => {
    expect(bodyLang({ lang: 'bn' })).toBe('bn');
    expect(bodyLang({ lang: 'fr' })).toBe('en');
    expect(bodyLang(null)).toBe('en');
    const english = contactSchema('en').safeParse({ name: '', phone: '9830012345', message: 'Hi' });
    const bengali = contactSchema('bn').safeParse({ name: '', phone: '9830012345', message: 'Hi' });
    expect(english.success || bengali.success).toBe(false);
    if (!english.success && !bengali.success) expect(bengali.error.issues[0].message).not.toBe(english.error.issues[0].message);
  });

  it('spots a bot by the hidden field', () => {
    expect(isBot({ website: 'http://spam.example' })).toBe(true);
    expect(isBot({ website: '  ' })).toBe(false);
    expect(isBot({})).toBe(false);
  });
});

describe('working an enquiry', () => {
  it('lists, searches and counts by status', async () => {
    await send({ name: 'Bimal Das', phone: '9830099999', email: 'bimal@example.com', subject: 'Bulk order', message: 'Need 40 pieces.' });
    const all = await listEnquiries();
    expect(all.total).toBe(2);
    expect(all.counts).toEqual({ new: 2, contacted: 0, closed: 0 });
    // Newest first.
    expect(all.rows[0].name).toBe('Bimal Das');
    expect((await listEnquiries({ q: 'bulk' })).rows.map((row) => row.name)).toEqual(['Bimal Das']);
    expect((await listEnquiries({ q: '98300 1' })).total).toBe(0);
    expect((await listEnquiries({ q: '9830012345' })).total).toBe(1);
    // An unknown status is ignored, not an error.
    expect((await listEnquiries({ status: 'nonsense' })).total).toBe(2);
  });

  it('lets staff change the status and add notes, and writes the activity log', async () => {
    const [target] = (await listEnquiries({ q: 'Bimal' })).rows;
    await setEnquiryStatus(staff, target.id, 'contacted');
    await addEnquiryNote(staff, target.id, 'Called. Wants a quote by Friday.');
    await expect(addEnquiryNote(staff, target.id, '   ')).rejects.toThrow();
    await expect(setEnquiryStatus(staff, target.id, 'won' as s.EnquiryStatus)).rejects.toMatchObject({ status: 400 });

    const found = await getEnquiry(target.id);
    expect(found?.row.status).toBe('contacted');
    expect(found?.notes).toHaveLength(1);
    expect(found?.notes[0]).toMatchObject({ note: 'Called. Wants a quote by Friday.', createdByName: 'Front Desk' });

    const counts = (await listEnquiries()).counts;
    expect(counts).toEqual({ new: 1, contacted: 1, closed: 0 });
    expect((await listEnquiries({ status: 'contacted' })).rows.map((row) => row.id)).toEqual([target.id]);
    expect((await getOverview()).tiles).toMatchObject({ newEnquiries: 1, enquiries: 2 });

    const log = await db.select().from(s.auditLog).where(eq(s.auditLog.entityId, target.id));
    expect(log.map((row) => row.action).sort()).toEqual(['enquiry.note', 'enquiry.status']);
    expect(log.every((row) => row.userId === staff.uid)).toBe(true);
  });

  it('answers "not found" for an id that is not there or not an id', async () => {
    expect(await getEnquiry('not-an-id')).toBeNull();
    expect(await getEnquiry('00000000-0000-4000-8000-000000000000')).toBeNull();
    await expect(setEnquiryStatus(admin, '00000000-0000-4000-8000-000000000000', 'closed')).rejects.toMatchObject({ status: 404 });
    await expect(addEnquiryNote(admin, '00000000-0000-4000-8000-000000000000', 'x')).rejects.toMatchObject({ status: 404 });
  });

  it('lets only an admin delete, which moves the enquiry to the Trash with its notes', async () => {
    const [target] = (await listEnquiries({ q: 'Bimal' })).rows;
    await expect(deleteEnquiry(staff, target.id)).rejects.toMatchObject({ status: 403 });
    await deleteEnquiry(admin, target.id);
    expect(await getEnquiry(target.id)).toBeNull();
    expect((await listEnquiries()).total).toBe(1);
    expect((await getOverview()).tiles.enquiries).toBe(1);
    // Still there, so it can be brought back from the Trash.
    expect(await db.select().from(s.enquiryNotes).where(eq(s.enquiryNotes.enquiryId, target.id))).toHaveLength(1);
    await expect(setEnquiryStatus(admin, target.id, 'closed')).rejects.toMatchObject({ status: 404 });
    await expect(deleteEnquiry(admin, target.id)).rejects.toMatchObject({ status: 404 });
  });
});
