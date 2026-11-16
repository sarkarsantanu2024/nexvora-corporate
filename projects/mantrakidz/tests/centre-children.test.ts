/**
 * The children side of the centre dashboard, against a fresh in-memory
 * database with the sample data. Services take the actor explicitly, so no
 * cookies are involved.
 */
import { and, count, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.MK_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { attendanceSheet, markHoliday, monthlyRegister, saveAttendance, saveStaffAttendance } from '@/server/centre/children/attendance';
import { createBatch, deleteBatch } from '@/server/centre/children/batches';
import { createEnquiry, getEnquiry, listEnquiries, setEnquiryStage } from '@/server/centre/children/enquiries';
import type { Ctx } from '@/server/centre/children/shared';
import { createStaff, createStaffLogin, listStaff, resetLoginPassword, updateCentreProfile } from '@/server/centre/children/staff';
import {
  admitStudent,
  createParentLogin,
  getStudent,
  listStudents,
  markStudentLeft,
  moveStudent,
  promoteStudents,
  type StudentInput,
} from '@/server/centre/children/students';

let db: DB;
let head: Ctx; // Lake Town centre head
let desk: Ctx; // Lake Town front desk
let other: Ctx; // Salt Lake centre head
let programmes: s.Programme[];
let lakeBatches: s.Batch[];

const sessionOf = (user: s.User): Session => ({ uid: user.id, name: user.name, username: user.username, role: user.role, centreId: user.centreId });

async function ctxFor(username: string): Promise<Ctx> {
  const [user] = await db.select().from(s.users).where(eq(s.users.username, username));
  const [centre] = await db.select().from(s.centres).where(eq(s.centres.id, user.centreId!));
  return { session: sessionOf(user), centre };
}

const child = (over: Partial<StudentInput> = {}): StudentInput => ({
  name: 'Test Child',
  dob: '2023-01-10',
  gender: 'Girl',
  programmeId: programmes[1].id,
  batchId: lakeBatches[1].id,
  admissionDate: todayIST(),
  monthlyFee: '',
  guardianPhone: '98300 12345',
  ...over,
});

beforeAll(async () => {
  db = await getDb();
  head = await ctxFor('laketown');
  desk = await ctxFor('laketown.desk');
  other = await ctxFor('saltlake');
  programmes = await db.select().from(s.programmes).orderBy(s.programmes.sort);
  const all = await db.select().from(s.batches).where(eq(s.batches.centreId, head.centre.id));
  lakeBatches = programmes.map((p) => all.find((b) => b.programmeId === p.id)!);
}, 120_000);

describe('admitting a child', () => {
  it('gives each child a new admission number and cleans the mobile number', async () => {
    const a = await admitStudent(head, child({ name: 'Admit One' }));
    const b = await admitStudent(desk, child({ name: 'Admit Two' }));
    expect(a.admissionNo).not.toBe(b.admissionNo);
    expect(a.admissionNo.startsWith(`${head.centre.code}/`)).toBe(true);
    expect(a.guardianPhone).toBe('9830012345');
    expect(a.monthlyFee).toBeNull();
    expect(a.academicYearId).toBe(lakeBatches[1].academicYearId);

    const numbers = await db.select({ no: s.students.admissionNo }).from(s.students).where(eq(s.students.centreId, head.centre.id));
    expect(new Set(numbers.map((n) => n.no)).size).toBe(numbers.length);
  });

  it('refuses a class from another centre or another programme', async () => {
    const [foreign] = await db.select().from(s.batches).where(eq(s.batches.centreId, other.centre.id));
    await expect(admitStudent(head, child({ programmeId: foreign.programmeId, batchId: foreign.id }))).rejects.toThrow('Class not found');
    await expect(admitStudent(head, child({ programmeId: programmes[0].id, batchId: lakeBatches[1].id }))).rejects.toThrow('another programme');
  });

  it('checks the form: a name and a real mobile number are needed', async () => {
    await expect(admitStudent(head, child({ name: ' ' }))).rejects.toThrow();
    await expect(admitStudent(head, child({ guardianPhone: '12345' }))).rejects.toThrow();
  });
});

describe('centre scoping', () => {
  it('will not read or change a child of another centre', async () => {
    const [foreign] = await db.select().from(s.students).where(eq(s.students.centreId, other.centre.id)).limit(1);
    await expect(getStudent(head, foreign.id)).rejects.toThrow('Child not found');
    await expect(moveStudent(head, foreign.id, { batchId: lakeBatches[0].id })).rejects.toThrow('Child not found');
    await expect(createParentLogin(head, foreign.id)).rejects.toThrow('Child not found');
    await expect(getStudent(head, 'not-an-id')).rejects.toThrow('Child not found');
  });

  it('lists only this centre, with class and programme names joined', async () => {
    const mine = await listStudents(head, { status: 'all' });
    const [{ n }] = await db.select({ n: count() }).from(s.students).where(eq(s.students.centreId, head.centre.id));
    expect(mine.total).toBe(n);
    expect(mine.rows.length).toBeLessThanOrEqual(25);
    expect(mine.rows[0].programmeName).toBeTruthy();
    const active = await listStudents(head);
    expect(active.total).toBeLessThan(mine.total); // the sample data has children who left
    const found = await listStudents(head, { q: 'Admit One', status: 'all' });
    expect(found.rows.map((r) => r.name)).toContain('Admit One');
  });

  it('refuses attendance for a child of another centre', async () => {
    const [foreign] = await db.select().from(s.students).where(and(eq(s.students.centreId, other.centre.id), eq(s.students.status, 'active'))).limit(1);
    await expect(
      saveAttendance(head, { day: todayIST(), batchId: lakeBatches[0].id, marks: [{ studentId: foreign.id, status: 'present' }] }),
    ).rejects.toThrow('not in this class');
  });
});

describe('attendance', () => {
  it('saving the same day twice edits the marks instead of adding rows', async () => {
    const day = todayIST();
    const sheet = await attendanceSheet(head, { day, batchId: lakeBatches[0].id });
    expect(sheet.rows.length).toBeGreaterThan(0);
    const ids = sheet.rows.map((r) => r.studentId);
    const rowsFor = async () =>
      (await db.select().from(s.attendance).where(and(eq(s.attendance.day, day), eq(s.attendance.batchId, lakeBatches[0].id)))).filter((r) => ids.includes(r.studentId));

    await saveAttendance(desk, { day, batchId: lakeBatches[0].id, marks: ids.map((studentId) => ({ studentId, status: 'present' as const })) });
    expect(await rowsFor()).toHaveLength(ids.length);

    await saveAttendance(desk, { day, batchId: lakeBatches[0].id, marks: ids.map((studentId, i) => ({ studentId, status: i === 0 ? ('absent' as const) : ('present' as const) })) });
    const after = await rowsFor();
    expect(after).toHaveLength(ids.length);
    expect(after.find((r) => r.studentId === ids[0])?.status).toBe('absent');

    const again = await attendanceSheet(head, { day, batchId: lakeBatches[0].id });
    expect(again.markedBy).toBe(desk.session.name);
    expect(again.rows.find((r) => r.studentId === ids[0])?.status).toBe('absent');

    const register = await monthlyRegister(head, { period: day.slice(0, 7), batchId: lakeBatches[0].id });
    const line = register.rows.find((r) => r.id === ids[0])!;
    expect(line.marks[Number(day.slice(8)) - 1]).toBe('absent');
    expect(line.present + line.absent + line.leave + line.holiday).toBe(line.marks.filter(Boolean).length);
  });

  it('refuses a future date and marks a holiday without duplicating', async () => {
    await expect(attendanceSheet(head, { day: '2999-01-01', batchId: lakeBatches[0].id })).rejects.toThrow();
    const day = todayIST();
    await markHoliday(head, { day, batchId: lakeBatches[0].id });
    const sheet = await attendanceSheet(head, { day, batchId: lakeBatches[0].id });
    expect(sheet.isHoliday).toBe(true);
    const [{ n }] = await db.select({ n: count() }).from(s.attendance).where(and(eq(s.attendance.day, day), eq(s.attendance.batchId, lakeBatches[0].id)));
    expect(n).toBe(sheet.rows.length);
  });
});

describe('enquiries', () => {
  it('admitting from an enquiry links the child and closes the enquiry', async () => {
    const enquiry = await createEnquiry(desk, { childName: 'Enquiry Child', parentName: 'Enquiry Parent', phone: '9830099999', source: 'walk-in' });
    await expect(setEnquiryStage(desk, enquiry.id, { stage: 'visit_scheduled' })).rejects.toThrow('visit date');
    await expect(setEnquiryStage(desk, enquiry.id, { stage: 'lost' })).rejects.toThrow('why');
    await expect(setEnquiryStage(desk, enquiry.id, { stage: 'admitted' })).rejects.toThrow('Admit this child');
    await setEnquiryStage(desk, enquiry.id, { stage: 'visit_scheduled', visitOn: todayIST() });

    const before = await listEnquiries(head);
    const student = await admitStudent(desk, child({ name: 'Enquiry Child', guardianPhone: '9830099999' }), { enquiryId: enquiry.id });
    const { enquiry: after, child: linked, notes } = await getEnquiry(head, enquiry.id);
    expect(after.stage).toBe('admitted');
    expect(after.convertedStudentId).toBe(student.id);
    expect(linked?.admissionNo).toBe(student.admissionNo);
    expect(notes.length).toBeGreaterThanOrEqual(2); // stage change + admission
    expect((await listEnquiries(head)).counts.admitted).toBe(before.counts.admitted + 1);

    await expect(admitStudent(desk, child(), { enquiryId: enquiry.id })).rejects.toThrow('already been admitted');
    await expect(getEnquiry(other, enquiry.id)).rejects.toThrow('Enquiry not found');
    await expect(admitStudent(other, { ...child(), batchId: null }, { enquiryId: enquiry.id })).rejects.toThrow('Enquiry not found');
  });
});

describe('manager-only work', () => {
  it('refuses centre staff', async () => {
    const [someone] = await db.select().from(s.students).where(and(eq(s.students.centreId, head.centre.id), eq(s.students.status, 'active'))).limit(1);
    const denied = 'Only the centre head';
    await expect(markStudentLeft(desk, someone.id, { leftOn: todayIST(), reason: 'Moved' })).rejects.toThrow(denied);
    await expect(promoteStudents(desk, { fromBatchId: lakeBatches[0].id, studentIds: [someone.id], mode: 'pass_out' })).rejects.toThrow(denied);
    await expect(createBatch(desk, { programmeId: programmes[0].id, academicYearId: lakeBatches[0].academicYearId, name: 'X', capacity: 12 })).rejects.toThrow(denied);
    await expect(deleteBatch(desk, lakeBatches[0].id)).rejects.toThrow(denied);
    await expect(listStaff(desk)).rejects.toThrow(denied);
    await expect(createStaff(desk, { name: 'A', roleTitle: 'Teacher', monthlySalary: 1 })).rejects.toThrow(denied);
    await expect(saveStaffAttendance(desk, { day: todayIST(), marks: [] })).rejects.toThrow(denied);
    await expect(updateCentreProfile(desk, { phone: '9830011111' })).rejects.toThrow(denied);
    const [still] = await db.select().from(s.students).where(eq(s.students.id, someone.id));
    expect(still.status).toBe('active');
  });

  it('lets the centre head give staff a login, but not touch a centre head login', async () => {
    const member = await createStaff(head, { name: 'Login Tester', roleTitle: 'Teacher', monthlySalary: 9000 });
    const login = await createStaffLogin(head, member.id, { username: 'Login.Tester' });
    expect(login.username).toBe('login.tester');
    const [user] = await db.select().from(s.users).where(eq(s.users.username, 'login.tester'));
    expect(user.role).toBe('centre_staff');
    expect(user.centreId).toBe(head.centre.id);
    expect(user.mustChangePassword).toBe(true);
    expect(user.passwordHash).not.toContain(login.password);
    await expect(createStaffLogin(head, member.id, { username: 'another.name' })).rejects.toThrow('already has a login');
    await expect(resetLoginPassword(head, head.session.uid)).rejects.toThrow('your own login');
    await expect(resetLoginPassword(head, other.session.uid)).rejects.toThrow('Login not found');
    expect((await resetLoginPassword(head, user.id)).password).not.toBe(login.password);
  });

  it('will not delete a class that has children', async () => {
    await expect(deleteBatch(head, lakeBatches[0].id)).rejects.toThrow('has children');
    const empty = await createBatch(head, { programmeId: programmes[0].id, academicYearId: lakeBatches[0].academicYearId, name: 'Empty class', capacity: 10 });
    await deleteBatch(head, empty.id);
    expect(await db.select().from(s.batches).where(eq(s.batches.id, empty.id))).toHaveLength(0);
  });
});

describe('promotion', () => {
  it('moves only the ticked children and leaves the rest', async () => {
    const from = lakeBatches[2]; // LKG
    const to = await createBatch(head, { programmeId: programmes[3].id, academicYearId: 'next', name: 'UKG A next year', capacity: 12 });
    expect(to.academicYearId).not.toBe(from.academicYearId);

    const inClass = await db.select().from(s.students).where(and(eq(s.students.batchId, from.id), eq(s.students.status, 'active')));
    expect(inClass.length).toBeGreaterThan(3);
    const ticked = inClass.slice(0, 3).map((c) => c.id);

    const result = await promoteStudents(head, { fromBatchId: from.id, studentIds: ticked, mode: 'move', toBatchId: to.id });
    expect(result.moved).toBe(3);

    const moved = await db.select().from(s.students).where(eq(s.students.batchId, to.id));
    expect(moved.map((m) => m.id).sort()).toEqual([...ticked].sort());
    for (const m of moved) {
      expect(m.programmeId).toBe(programmes[3].id);
      expect(m.academicYearId).toBe(to.academicYearId);
    }
    const stayed = await db.select().from(s.students).where(and(eq(s.students.batchId, from.id), eq(s.students.status, 'active')));
    expect(stayed).toHaveLength(inClass.length - 3);

    // A child who is not in the "from" class stops the whole move.
    await expect(promoteStudents(head, { fromBatchId: from.id, studentIds: [stayed[0].id, ticked[0]], mode: 'move', toBatchId: to.id })).rejects.toThrow('no longer in that class');
    const [untouched] = await db.select().from(s.students).where(eq(s.students.id, stayed[0].id));
    expect(untouched.batchId).toBe(from.id);
  });

  it('marks UKG leavers as passed out', async () => {
    const ukg = lakeBatches[3];
    const inClass = await db.select().from(s.students).where(and(eq(s.students.batchId, ukg.id), eq(s.students.status, 'active')));
    await promoteStudents(head, { fromBatchId: ukg.id, studentIds: [inClass[0].id], mode: 'pass_out' });
    const [gone] = await db.select().from(s.students).where(eq(s.students.id, inClass[0].id));
    expect(gone.status).toBe('passed_out');
    const sheet = await attendanceSheet(head, { day: todayIST(), batchId: ukg.id });
    expect(sheet.rows.map((r) => r.studentId)).not.toContain(gone.id);
  });
});

describe('parent login', () => {
  it('is shared by brothers and sisters with the same mobile', async () => {
    const first = await admitStudent(head, child({ name: 'Sibling One', guardianPhone: '9830055555', motherName: 'Sibling Mother' }));
    const login = await createParentLogin(head, first.id);
    expect(login.username).toBe('9830055555');
    expect(login.password).toBeTruthy();

    const second = await admitStudent(head, child({ name: 'Sibling Two', guardianPhone: '9830055555' }));
    const again = await createParentLogin(desk, second.id);
    expect(again.password).toBeNull(); // the login exists: its password is not changed
    expect(again.userId).toBe(login.userId);

    const logins = await db.select().from(s.users).where(eq(s.users.username, '9830055555'));
    expect(logins).toHaveLength(1);
    expect(logins[0].role).toBe('parent');
    expect(logins[0].centreId).toBe(head.centre.id);
    expect(logins[0].mustChangePassword).toBe(true);
    const linked = await db.select().from(s.students).where(eq(s.students.parentUserId, login.userId));
    expect(linked.map((c) => c.name).sort()).toEqual(['Sibling One', 'Sibling Two']);
  });

  it('will not take over a login that belongs elsewhere', async () => {
    // The Salt Lake sample parent's mobile, typed in for a Lake Town child.
    const [foreignParent] = await db.select().from(s.users).where(and(eq(s.users.role, 'parent'), eq(s.users.centreId, other.centre.id)));
    const stray = await admitStudent(head, child({ name: 'Stray Child', guardianPhone: foreignParent.username }));
    await expect(createParentLogin(head, stray.id)).rejects.toThrow('already used by another login');
    const [after] = await db.select().from(s.students).where(eq(s.students.id, stray.id));
    expect(after.parentUserId).toBeNull();
  });
});
