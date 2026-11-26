/**
 * The school's own website reads and forms, against a fresh in-memory
 * database: who is listed on the Teachers page and in what order, what the
 * public notices and calendar show, and what the admission, alumni and
 * grievance forms refuse and save.
 */
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { POST as admissionPost } from '@/app/api/public/admission/route';
import { advanceOn } from '@/components/site/carousel-rule';
import {
  ADMISSION_SUBJECT,
  admissionSchema,
  alumniSchema,
  createAdmissionEnquiry,
  createAlumniEnquiry,
  createGrievance,
  grievanceSchema,
} from '@/server/site/enquiries';
import { filterNotices, groupStaff, loadPublicEvents, loadPublicNotices, loadWebsiteStaff, splitEvents, staffName } from '@/server/site/school';

let db: DB;

beforeAll(async () => {
  db = await getDb();
}, 120_000);

describe('teachers list', () => {
  // The local seed adds sample staff of its own; these tests look only at the rows they add.
  let mine = new Set<string>();
  const own = <T extends { id: string }>(rows: T[]) => rows.filter((r) => mine.has(r.id));
  beforeAll(async () => {
    const added = await db.insert(s.staff).values([
      { name: 'Anil Das', nameBn: 'অনিল দাস', kind: 'teaching', designation: 'Assistant Teacher', subjects: 'Mathematics', sort: 2 },
      { name: 'Pintu Sarkar', nameBn: 'পিন্টু সরকার', kind: 'teaching', designation: 'Headmaster', sort: 5 },
      { name: 'Bina Roy', kind: 'teaching', designation: 'Assistant Teacher', subjects: 'Bengali', sort: 1 },
      { name: 'Kamal Ghosh', kind: 'non_teaching', designation: 'Clerk', sort: 0 },
      { name: 'Hidden Person', kind: 'teaching', designation: 'Assistant Teacher', showOnWebsite: false },
      { name: 'Left Person', kind: 'teaching', designation: 'Assistant Teacher', active: false },
      { name: 'Trashed Person', kind: 'teaching', designation: 'Assistant Teacher', deletedAt: new Date() },
    ]).returning({ id: s.staff.id });
    mine = new Set(added.map((r) => r.id));
  });

  it('lists only people marked for the website, active and not in the Trash, in the school’s order', async () => {
    const rows = own(await loadWebsiteStaff(db));
    expect(rows.map((r) => r.name)).toEqual(['Kamal Ghosh', 'Bina Roy', 'Anil Das', 'Pintu Sarkar']);
    // Nothing private leaves the server.
    expect(Object.keys(rows[0]).sort()).toEqual(['designation', 'id', 'kind', 'name', 'nameBn', 'photo', 'subjects']);
  });

  it('puts the headmaster first, then teachers, then the other staff', async () => {
    const { head, teaching, nonTeaching } = groupStaff(own(await loadWebsiteStaff(db)));
    expect(head.map((r) => r.name)).toEqual(['Pintu Sarkar']);
    expect(teaching.map((r) => r.name)).toEqual(['Bina Roy', 'Anil Das']);
    expect(nonTeaching.map((r) => r.name)).toEqual(['Kamal Ghosh']);
    expect(groupStaff([{ designation: 'প্রধান শিক্ষক', kind: 'teaching' }, { designation: 'Teacher-in-charge', kind: 'teaching' }]).head).toHaveLength(2);
  });

  it('shows the Bengali name on the Bengali site when there is one', () => {
    expect(staffName({ name: 'Anil Das', nameBn: 'অনিল দাস' }, 'bn')).toBe('অনিল দাস');
    expect(staffName({ name: 'Anil Das', nameBn: 'অনিল দাস' }, 'en')).toBe('Anil Das');
    expect(staffName({ name: 'Bina Roy', nameBn: '' }, 'bn')).toBe('Bina Roy');
  });
});

describe('notices and calendar', () => {
  it('shows only public notices that are live, pinned first, and filters by word and year', async () => {
    await db.insert(s.announcements).values([
      { title: 'Class V lottery', body: 'Admission lottery for Class V', publishOn: '2026-11-01', attachment: '/media/notices/lottery.pdf' },
      { title: 'Staff meeting', audience: 'staff', publishOn: '2026-11-02' },
      { title: 'Holiday for Kali Puja', publishOn: '2026-10-20', pinned: true },
      { title: 'Not yet', publishOn: '2026-12-20' },
      { title: 'Gone', publishOn: '2025-01-01', expiresOn: '2025-02-01' },
    ]);
    const notices = await loadPublicNotices(db, '2026-11-26');
    expect(notices.map((n) => n.title)).toEqual(['Holiday for Kali Puja', 'Class V lottery']);
    expect(notices[1].attachment).toBe('/media/notices/lottery.pdf');
    expect(filterNotices(notices, 'lottery', '').map((n) => n.title)).toEqual(['Class V lottery']);
    expect(filterNotices(notices, '', '2025')).toEqual([]);
  });

  it('splits the public calendar into coming events, holidays and past events', async () => {
    await db.insert(s.calendarEvents).values([
      { title: 'Annual sports', kind: 'event', startsOn: '2026-12-05' },
      { title: 'Winter break', kind: 'holiday', startsOn: '2026-12-25', endsOn: '2026-12-31' },
      { title: 'Independence Day', kind: 'event', startsOn: '2026-08-15' },
      { title: 'Private meeting', kind: 'meeting', startsOn: '2026-12-01', showOnWebsite: false },
      { title: 'Last year', kind: 'event', startsOn: '2025-12-01' },
    ]);
    const { upcoming, holidays, past } = splitEvents(await loadPublicEvents(db, '2026-01-01'), '2026-11-26');
    expect(upcoming.map((e) => e.title)).toEqual(['Annual sports']);
    expect(holidays.map((e) => e.title)).toEqual(['Winter break']);
    expect(past.map((e) => e.title)).toEqual(['Independence Day']);
  });
});

describe('admission enquiry', () => {
  it('refuses a bad mobile number and a class the school does not teach', () => {
    const bad = admissionSchema('en').safeParse({ name: 'Rina Das', phone: '12345', grade: '5' });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues.map((i) => i.path[0])).toContain('phone');
    const wrongClass = admissionSchema('bn').safeParse({ name: 'Rina Das', phone: '9830012345', grade: '3' });
    expect(wrongClass.error?.issues[0].message).toBe('শ্রেণি বেছে নিন');
  });

  it('saves the enquiry with the subject Admission and the class asked for', async () => {
    const { id } = await createAdmissionEnquiry(admissionSchema('en').parse({ name: 'Rina Das', phone: '+91 98300 12345', studentName: 'Rohan', grade: '5', message: 'When is the lottery?' }));
    const [row] = await db.select().from(s.enquiries).where(eq(s.enquiries.id, id));
    expect(row).toMatchObject({ name: 'Rina Das', phone: '9830012345', subject: ADMISSION_SUBJECT, source: 'website', status: 'new' });
    expect(row.message).toContain('Class: Class 5');
    expect(row.message).toContain('Rohan');
    expect(row.meta).toMatchObject({ form: 'admission', grade: 5 });
  });

  it('answers through the public route: 422 with the field for a bad phone, 201 when saved', async () => {
    const post = (body: unknown, ip: string) =>
      admissionPost(new Request('http://localhost/api/public/admission', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body) }), {
        params: Promise.resolve({}),
      });
    const refused = await post({ name: 'A', phone: '99', grade: '11', lang: 'bn' }, '10.0.0.1');
    expect(refused.status).toBe(422);
    expect((await refused.json()).fields.phone).toBe('10 সংখ্যার মোবাইল নম্বর লিখুন');
    const saved = await post({ name: 'Mita Pal', phone: '9433012345', grade: '11' }, '10.0.0.2');
    expect(saved.status).toBe(201);
    const rows = await db.select().from(s.enquiries).where(eq(s.enquiries.name, 'Mita Pal'));
    expect(rows[0]?.subject).toBe(ADMISSION_SUBJECT);
    // The bot trap: answered politely, nothing stored.
    const bot = await post({ name: 'Bot', phone: '9433012399', grade: '5', website: 'spam.example' }, '10.0.0.3');
    expect(bot.status).toBe(200);
    expect(await db.select().from(s.enquiries).where(eq(s.enquiries.name, 'Bot'))).toHaveLength(0);
  });
});

describe('alumni and grievance forms', () => {
  it('saves an alumni entry with the subject Alumni and the batch', async () => {
    expect(alumniSchema('en').safeParse({ name: 'Old Boy', phone: '9830012345', batch: '' }).success).toBe(false);
    const { id } = await createAlumniEnquiry(alumniSchema('en').parse({ name: 'Old Boy', phone: '9830012345', batch: '1998', message: 'Engineer' }));
    const [row] = await db.select().from(s.enquiries).where(eq(s.enquiries.id, id));
    expect(row).toMatchObject({ subject: 'Alumni', message: 'Left school: 1998\nEngineer' });
  });

  it('saves a complaint with the subject Grievance and needs what happened', async () => {
    expect(grievanceSchema('en').safeParse({ name: 'Parent', phone: '9830012345', message: '' }).success).toBe(false);
    const { id } = await createGrievance(grievanceSchema('en').parse({ name: 'Parent', phone: '9830012345', message: 'Bullying on the stairs' }));
    const [row] = await db.select().from(s.enquiries).where(eq(s.enquiries.id, id));
    expect(row.subject).toBe('Grievance');
  });
});

describe('banner carousel', () => {
  it('moves on from a photo when its time is up, and from a video only when it ends', () => {
    expect(advanceOn('image', 'timer')).toBe(true);
    expect(advanceOn('youtube', 'timer')).toBe(false);
    expect(advanceOn('mp4', 'timer')).toBe(false);
    expect(advanceOn('youtube', 'ended')).toBe(true);
    expect(advanceOn('mp4', 'ended')).toBe(true);
  });
});
