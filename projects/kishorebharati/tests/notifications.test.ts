/**
 * The bell's list, against a fresh in-memory database: nothing is stored, each
 * line is worked out from what is there, and it goes away by itself when the
 * thing is dealt with.
 */
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { makeT, uiDict } from '@/i18n/ui';
import { addDays, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { setEnquiryStatus } from '@/server/enquiries/service';
import { listNotifications } from '@/server/notifications';
import { contactSchema, createEnquiry } from '@/server/site/enquiries';

let db: DB;
let admin: Session;
const t = makeT(null);

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = { uid: row.id, name: row.name, username: row.username, role: row.role };
}, 120_000);

const send = (name: string) => createEnquiry(contactSchema('en').parse({ name, phone: '9830012345', message: 'Please call me.' }));
const enquiryLines = async () => (await listNotifications(admin, t)).filter((item) => item.kind === 'enquiry');

describe('notifications', () => {
  it('shows new enquiries, and tells again when one more arrives', async () => {
    expect(await enquiryLines()).toEqual([]);
    await send('Asha Roy');
    const [first] = await enquiryLines();
    expect(first).toMatchObject({ tone: 'amber', title: '1 new enquiry', href: '/admin/enquiries?status=new' });

    await send('Bimal Das');
    const [second] = await enquiryLines();
    expect(second.title).toBe('2 new enquiries');
    expect(second.id).not.toBe(first.id);
  });

  it('turns red for an enquiry nobody answered in two days, and puts it first', async () => {
    const { id } = await send('Chitra Sen');
    await db.update(s.enquiries).set({ createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }).where(eq(s.enquiries.id, id));
    const list = await listNotifications(admin, t);
    expect(list[0]).toMatchObject({ kind: 'enquiry', tone: 'red', title: '1 enquiry waiting for more than 2 days' });
    expect(list.map((item) => item.tone)).toEqual([...list.map((item) => item.tone)].sort((a, b) => 'rab'.indexOf(a[0]) - 'rab'.indexOf(b[0])));

    // Dealt with: the red line goes away by itself.
    await setEnquiryStatus(admin, id, 'contacted');
    expect((await enquiryLines()).some((item) => item.tone === 'red')).toBe(false);
  });

  it('lists a notice that went up this week, but not an old or a future one', async () => {
    const today = todayIST();
    await db.insert(s.announcements).values([
      { title: 'Closed on Friday', publishOn: addDays(today, -1) },
      { title: 'Last month', publishOn: addDays(today, -30) },
      { title: 'Next week', publishOn: addDays(today, 7) },
    ]);
    const titles = (await listNotifications(admin, t)).filter((item) => item.kind === 'notice').map((item) => item.title);
    expect(titles).toEqual(['Closed on Friday']);
  });

  it('speaks the language it is asked in', async () => {
    const list = await listNotifications(admin, makeT(uiDict('hi')));
    const line = list.find((item) => item.kind === 'enquiry');
    expect(line?.title).toMatch(/पूछताछ/);
  });
});
