/**
 * The office registers against a fresh in-memory database: the mid-day meal
 * register, staff leave, the gate, student records, the stock register,
 * staff circulars and the portal exports. Covers what is refused, what is
 * saved, and what a teacher may not do.
 */
import { and, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { addDays, todayIST, weekday } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { createUser } from '@/server/admin/users';
import { applyLeave, cancelLeave, decideLeave, leaveBalances, listApprovedLeave, listLeaves } from '@/server/leave/service';
import { circularReaders, listCirculars, markCircularRead, saveCircular, unreadCirculars } from '@/server/office/circulars';
import { PORTAL_COLUMNS, enrolmentSheet, enrolmentStatement, mdmSheet, studentPortalSheet, toCsv } from '@/server/office/exports';
import { bmi, qtyText } from '@/server/office/labels';
import { loadMdmDay, mdmMonth, saveMdmDay } from '@/server/office/mdm';
import { addRecord, listRecords, recordFields, recordsOfStudent } from '@/server/office/records';
import { addMovement, createAsset, getAsset } from '@/server/office/stock';
import { addVisitor, createGatePass, markVisitorOut } from '@/server/office/visitors';
import { currentYear } from '@/server/school/access';

let db: DB;
let admin: Session;
let office: Session;
let teacher: Session;
let teacher2: Session;
let teacherStaffId: string;
let teacher2StaffId: string;
let class5: s.Section;
let class6: s.Section;
const studentIds: string[] = [];

/** A school day (not a Sunday) at least `back` days ago. */
function pastWeekday(back: number) {
  let day = addDays(todayIST(), -back);
  while (weekday(day) === 0) day = addDays(day, -1);
  return day;
}

async function login(name: string, username: string, role: s.Role): Promise<Session> {
  const row = await createUser(admin, { name, username, password: 'start123', role });
  return { uid: row.id, name: row.name, username: row.username, role: row.role };
}

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = { uid: row.id, name: row.name, username: row.username, role: row.role };
  office = await login('Partha Malik', 'clerk', 'staff');
  teacher = await login('Rinku Pal', 'rinku', 'teacher');
  teacher2 = await login('Amrita Pal', 'amrita', 'teacher');
  const people = await db.select().from(s.staff);
  teacherStaffId = people.find((p) => p.name === 'Rinku Pal')!.id;
  teacher2StaffId = people.find((p) => p.name === 'Amrita Pal')!.id;
  await db.update(s.staff).set({ userId: teacher.uid }).where(eq(s.staff.id, teacherStaffId));
  await db.update(s.staff).set({ userId: teacher2.uid }).where(eq(s.staff.id, teacher2StaffId));

  const year = await currentYear(db);
  const sections = await db.select().from(s.sections).where(eq(s.sections.yearId, year.id));
  class5 = sections.find((x) => x.grade === 5 && x.name === 'A')!;
  class6 = sections.find((x) => x.grade === 6 && x.name === 'A')!;
  await db.update(s.sections).set({ classTeacherId: teacherStaffId }).where(eq(s.sections.id, class5.id));

  const boys = [
    { admissionNo: 'T-1', name: 'Arnab Das', fatherName: 'Tapas Das', motherName: 'Rina Das', dob: '2015-03-09', category: 'SC' as const, religion: 'Hindu', phone: '9000000001', portalId: 'WB-1', section: class5, roll: 1 },
    { admissionNo: 'T-2', name: 'Soham Ghosh', fatherName: 'Ashok Ghosh', motherName: 'Soma Ghosh', dob: '2015-06-01', category: 'GEN' as const, religion: 'Hindu', phone: '9000000002', portalId: '', section: class5, roll: 2 },
    { admissionNo: 'T-3', name: 'Ritam Roy', fatherName: 'Dilip Roy', motherName: 'Papiya Roy', dob: '2015-01-20', category: 'OBC-A' as const, religion: 'Hindu', phone: '9000000003', portalId: '', section: class5, roll: 3 },
    { admissionNo: 'T-4', name: 'Sayan Sen', fatherName: 'Manas Sen', motherName: 'Jhuma Sen', dob: '2014-02-11', category: 'SC' as const, religion: 'Hindu', phone: '9000000004', portalId: '', section: class6, roll: 1 },
  ];
  for (const boy of boys) {
    const { section, roll, ...data } = boy;
    const [student] = await db.insert(s.students).values({ ...data, address: 'Dum Dum' }).returning();
    await db.insert(s.enrolments).values({ yearId: year.id, studentId: student.id, sectionId: section.id, rollNo: roll });
    studentIds.push(student.id);
  }
}, 120_000);

describe('mid-day meal register', () => {
  const day = pastWeekday(7);

  it('fills "present" from the attendance register of the day', async () => {
    await db.insert(s.attendance).values([
      { day, sectionId: class5.id, studentId: studentIds[0], status: 'present' },
      { day, sectionId: class5.id, studentId: studentIds[1], status: 'late' },
      { day, sectionId: class5.id, studentId: studentIds[2], status: 'absent' },
    ]);
    const form = await loadMdmDay(office, day);
    expect(form.saved).toBe(false);
    expect(form.classes.map((c) => c.grade)).toEqual([5, 6, 7, 8]);
    expect(form.classes[0]).toMatchObject({ grade: 5, present: 2, fromRegister: true, roll: 3 });
    expect(form.classes[1]).toMatchObject({ grade: 6, present: null, fromRegister: false });
    expect(form.menu).not.toBe('');
  });

  it('keeps one line a day: saving again replaces it', async () => {
    const input = {
      day,
      menu: 'Rice, dal',
      cooksPresent: 2,
      note: '',
      classes: [
        { grade: 5, present: 2, ate: 2 },
        { grade: 6, present: 30, ate: 28 },
      ],
      stock: [{ item: 'চাল', received: 50, used: 3.2 }],
    };
    await saveMdmDay(office, input);
    await saveMdmDay(office, { ...input, cooksPresent: 3, classes: [{ grade: 5, present: 2, ate: 1 }, { grade: 6, present: 30, ate: 30 }] });
    const days = await db.select().from(s.mdmDays).where(eq(s.mdmDays.day, day));
    expect(days).toHaveLength(1);
    expect(days[0].cooksPresent).toBe(3);
    const counts = await db.select().from(s.mdmClassCounts).where(eq(s.mdmClassCounts.dayId, days[0].id));
    expect(counts.map((c) => [c.grade, c.ate]).sort()).toEqual([[5, 1], [6, 30]]);
    const stock = await db.select().from(s.mdmStock).where(eq(s.mdmStock.dayId, days[0].id));
    expect(stock).toMatchObject([{ item: 'চাল', received: 50000, used: 3200 }]);
    const form = await loadMdmDay(office, day);
    expect(form.saved).toBe(true);
    expect(form.classes[0]).toMatchObject({ present: 2, ate: 1, fromRegister: false });
  });

  it('refuses "ate" above "present", a Sunday, a day to come and a teacher', async () => {
    const base = { day, menu: '', cooksPresent: 2, note: '', stock: [] };
    await expect(saveMdmDay(office, { ...base, classes: [{ grade: 5, present: 2, ate: 3 }] })).rejects.toMatchObject({ status: 400, fields: { 'classes.0.ate': 'Cannot be more than present' } });
    let sunday = addDays(todayIST(), -1);
    while (weekday(sunday) !== 0) sunday = addDays(sunday, -1);
    await expect(saveMdmDay(office, { ...base, day: sunday, classes: [] })).rejects.toMatchObject({ status: 400 });
    await expect(saveMdmDay(office, { ...base, day: addDays(todayIST(), 2), classes: [] })).rejects.toMatchObject({ status: 400 });
    await expect(saveMdmDay(office, { ...base, classes: [{ grade: 11, present: 2, ate: 1 }] })).rejects.toMatchObject({ status: 400 });
    await expect(saveMdmDay(teacher, { ...base, classes: [] })).rejects.toMatchObject({ status: 403 });
    await expect(loadMdmDay(teacher, day)).rejects.toMatchObject({ status: 403 });
  });

  it('sums the month: days served, meals per class and the stock account', async () => {
    const month = day.slice(0, 7);
    const data = await mdmMonth(office, month);
    const line = data.lines.find((l) => l.day === day)!;
    expect(line).toMatchObject({ saved: true, totalAte: 31, totalPresent: 32 });
    expect(data.classTotals.find((c) => c.grade === 6)).toMatchObject({ daysServed: 1, meals: 30 });
    const rice = data.stock.find((item) => item.item === 'চাল')!;
    expect(rice).toMatchObject({ opening: 0, received: 50000, used: 3200, closing: 46800 });
    expect(qtyText(rice.closing)).toBe('46.8');
    expect(data.lines.filter((l) => l.shut === 'Sunday').every((l) => weekday(l.day) === 0)).toBe(true);
    const sheet = await mdmSheet(office, month);
    expect(sheet.columns.slice(0, 4)).toEqual(['Date', 'Menu', 'Class 5 present', 'Class 5 ate']);
  });
});

describe('staff leave', () => {
  // A year far ahead, so the quotas start clean whatever the date of the run. 7 January 2030 is a Monday.
  it('lets a teacher apply only for their own leave', async () => {
    const leave = await applyLeave(teacher, { leaveType: 'CL', fromDate: '2030-01-07', toDate: '2030-01-09', reason: 'Family function' });
    expect(leave).toMatchObject({ staffId: teacherStaffId, days: 3, status: 'pending' });
    await expect(applyLeave(teacher, { staffId: teacher2StaffId, leaveType: 'CL', fromDate: '2030-02-04', toDate: '2030-02-04' })).rejects.toMatchObject({ status: 403 });
    // Sundays are not counted: Saturday 12 to Monday 14 January is two days.
    const weekend = await applyLeave(teacher, { leaveType: 'ML', fromDate: '2030-01-12', toDate: '2030-01-14' });
    expect(weekend.days).toBe(2);
    await expect(applyLeave(teacher, { leaveType: 'CL', fromDate: '2030-01-09', toDate: '2030-01-10' })).rejects.toMatchObject({ status: 400 });
    await expect(applyLeave(teacher, { leaveType: 'XX', fromDate: '2030-03-04', toDate: '2030-03-04' })).rejects.toMatchObject({ status: 400 });
    await expect(applyLeave(teacher, { leaveType: 'CL', fromDate: '2030-03-05', toDate: '2030-03-04' })).rejects.toMatchObject({ status: 400 });
    await expect(applyLeave(teacher, { leaveType: 'CL', fromDate: '2030-12-30', toDate: '2031-01-02' })).rejects.toMatchObject({ status: 400 });
  });

  it('lets the office record leave for anyone, and only the head of school decide', async () => {
    const recorded = await applyLeave(office, { staffId: teacher2StaffId, leaveType: 'CL', fromDate: '2030-01-07', toDate: '2030-01-07' });
    expect(recorded.staffId).toBe(teacher2StaffId);
    await expect(decideLeave(teacher2, recorded.id, 'approved')).rejects.toMatchObject({ status: 403 });
    await expect(decideLeave(teacher, recorded.id, 'approved')).rejects.toMatchObject({ status: 403 });
    await expect(decideLeave(office, recorded.id, 'approved')).rejects.toMatchObject({ status: 403 });
    const decided = await decideLeave(admin, recorded.id, 'rejected', 'Exam week');
    expect(decided).toMatchObject({ status: 'rejected', decisionNote: 'Exam week' });
    await expect(decideLeave(admin, recorded.id, 'approved')).rejects.toMatchObject({ status: 400 });
  });

  it('shows a teacher only their own leave', async () => {
    const mine = await listLeaves(teacher, { year: '2030' });
    expect(mine.rows.length).toBe(2);
    expect(mine.rows.every((row) => row.leave.staffId === teacherStaffId)).toBe(true);
    // Asking for someone else's is ignored for a teacher.
    expect((await listLeaves(teacher, { year: '2030', staff: teacher2StaffId })).rows.every((row) => row.leave.staffId === teacherStaffId)).toBe(true);
    expect((await listLeaves(office, { year: '2030' })).total).toBe(3);
    const balances = await leaveBalances(teacher, '2030');
    expect(balances.people.map((p) => p.id)).toEqual([teacherStaffId]);
  });

  it('keeps the yearly balance and refuses leave beyond the quota', async () => {
    const [pending] = (await listLeaves(admin, { year: '2030', status: 'pending', staff: teacherStaffId })).rows.filter((row) => row.leave.leaveType === 'CL');
    await decideLeave(admin, pending.leave.id, 'approved');
    const cl = (await leaveBalances(admin, '2030')).people.find((p) => p.id === teacherStaffId)!.balances.find((b) => b.key === 'CL')!;
    expect(cl).toMatchObject({ quota: 14, approved: 3, pending: 0, left: 11 });
    // 11 left: a 12-day casual leave is refused, an 11-day one is accepted.
    await expect(applyLeave(teacher, { leaveType: 'CL', fromDate: '2030-04-01', toDate: '2030-04-14' })).rejects.toMatchObject({ status: 400 });
    const rest = await applyLeave(teacher, { leaveType: 'CL', fromDate: '2030-04-01', toDate: '2030-04-12' });
    expect(rest.days).toBe(11);
    await cancelLeave(teacher, rest.id);
    await expect(cancelLeave(teacher2, pending.leave.id)).rejects.toMatchObject({ status: 403 });
  });

  it('lists every day of approved leave for the attendance screens', async () => {
    const days = await listApprovedLeave('2030-01-01', '2030-01-08');
    expect(days.map((d) => d.day)).toEqual(['2030-01-07', '2030-01-08']);
    expect(days.every((d) => d.staffId === teacherStaffId && d.leaveType === 'CL')).toBe(true);
  });
});

describe('the gate', () => {
  it('keeps the out time after the in time', async () => {
    const day = todayIST();
    await expect(addVisitor(office, { day, name: 'Inspector', inTime: '11:00', outTime: '10:30' })).rejects.toThrow();
    const visitor = await addVisitor(office, { day, name: 'Inspector', phone: '9830012345', whomToMeet: 'Headmaster', purpose: 'Inspection', inTime: '11:00' });
    await expect(markVisitorOut(office, visitor.id, '10:59')).rejects.toMatchObject({ status: 400 });
    await markVisitorOut(office, visitor.id, '11:45');
    const [row] = await db.select().from(s.visitors).where(eq(s.visitors.id, visitor.id));
    expect(row.outTime).toBe('11:45');
    await expect(addVisitor(teacher, { day, name: 'X', inTime: '10:00' })).rejects.toMatchObject({ status: 403 });
  });

  it('numbers gate passes in order', async () => {
    const input = { studentId: studentIds[0], day: todayIST(), time: '12:30', guardianName: 'Tapas Das', guardianRelation: 'Father', reason: 'Fever', approvedBy: 'Headmaster' };
    const first = await createGatePass(office, input);
    const second = await createGatePass(office, input);
    const year = todayIST().slice(0, 4);
    expect([first.serialNo, second.serialNo]).toEqual([`GP/1/${year}`, `GP/2/${year}`]);
    await expect(createGatePass(office, { ...input, guardianName: '' })).rejects.toThrow();
  });
});

describe('student records', () => {
  it('saves a health check-up and works out the BMI', async () => {
    await addRecord(office, { studentId: studentIds[0], kind: 'health', day: todayIST(), data: { heightCm: 140, weightKg: 35, vision: '6/6', dental: 'Fine', remarks: '' } });
    await addRecord(office, { studentId: studentIds[3], kind: 'achievement', day: todayIST(), data: { competition: 'District football', level: 'district', position: 'Winner' } });
    await expect(addRecord(office, { studentId: studentIds[0], kind: 'achievement', day: todayIST(), data: { competition: 'Quiz', level: 'galaxy' } })).rejects.toMatchObject({ status: 400 });
    await expect(addRecord(teacher, { studentId: studentIds[0], kind: 'discipline', day: todayIST(), data: { incident: 'x' } })).rejects.toMatchObject({ status: 403 });
    const [health] = await recordsOfStudent(office, studentIds[0]);
    expect(recordFields(health).bmi).toBe(bmi(140, 35));
    expect(bmi(140, 35)).toBe(17.9);
  });

  it('lets a teacher read only the boys of their own sections', async () => {
    expect((await listRecords(office)).total).toBe(2);
    const seen = await listRecords(teacher);
    expect(seen.rows.map((row) => row.studentName)).toEqual(['Arnab Das']);
    expect((await listRecords(teacher2)).total).toBe(0);
    await expect(recordsOfStudent(teacher, studentIds[3])).rejects.toMatchObject({ status: 403 });
    expect((await listRecords(office, { kind: 'achievement' })).rows.map((row) => row.studentName)).toEqual(['Sayan Sen']);
  });
});

describe('stock register', () => {
  it('keeps the quantity in step with the movements', async () => {
    const benches = await createAsset(office, { name: 'Bench', category: 'Furniture', quantity: 40, location: 'Room 4', source: 'government_grant', value: 48000 });
    await addMovement(office, benches.id, { day: todayIST(), kind: 'damaged', quantity: 3 });
    await expect(addMovement(office, benches.id, { day: todayIST(), kind: 'issued', quantity: 38 })).rejects.toMatchObject({ status: 400 });
    await addMovement(office, benches.id, { day: todayIST(), kind: 'written_off', quantity: 2 });
    const found = await getAsset(office, benches.id);
    expect(found?.row).toMatchObject({ quantity: 38, damaged: 1 });
    expect(found?.movements.map((m) => m.kind).sort()).toEqual(['damaged', 'received', 'written_off']);
    await expect(createAsset(teacher, { name: 'X', category: 'Other', quantity: 1, value: 0 })).rejects.toMatchObject({ status: 403 });
  });
});

describe('staff circulars', () => {
  it('tracks who has read a circular', async () => {
    const circular = await saveCircular(office, null, { title: 'Summative exam duty', body: 'See the duty chart.', publishOn: todayIST() });
    expect(circular.audience).toBe('staff');
    expect((await unreadCirculars(teacher)).map((row) => row.id)).toEqual([circular.id]);
    await markCircularRead(teacher, circular.id);
    await markCircularRead(teacher, circular.id);
    expect(await unreadCirculars(teacher)).toEqual([]);
    const readers = await circularReaders(office, circular.id);
    expect(readers.filter((r) => r.readAt).map((r) => r.name).sort()).toEqual(['Partha Malik', 'Rinku Pal']);
    const list = await listCirculars(teacher);
    expect(list.rows[0]).toMatchObject({ reads: 2 });
    expect(list.rows[0].readAt).toBeTruthy();
    await expect(saveCircular(teacher, null, { title: 'x', publishOn: todayIST() })).rejects.toMatchObject({ status: 403 });
    const later = await saveCircular(office, null, { title: 'Later', publishOn: addDays(todayIST(), 5) });
    expect((await listCirculars(teacher)).rows.map((row) => row.circular.id)).not.toContain(later.id);
  });
});

describe('government exports', () => {
  it('lists students in the portal column order', async () => {
    const sheet = await studentPortalSheet(office);
    expect(sheet.columns).toEqual(PORTAL_COLUMNS);
    expect(sheet.columns.slice(0, 3)).toEqual(['Student name', "Father's name", "Mother's name"]);
    expect(sheet.rows).toHaveLength(4);
    expect(sheet.rows[0]).toEqual(['Arnab Das', 'Tapas Das', 'Rina Das', '09/03/2015', 'Male', 'SC', 'Hindu', 'T-1', 5, 'A', 1, '9000000001', 'Dum Dum', 'WB-1']);
    expect((await studentPortalSheet(office, { grade: '6' })).rows.map((row) => row[0])).toEqual(['Sayan Sen']);
    expect(toCsv(sheet).split('\r\n')[0]).toBe(`﻿${PORTAL_COLUMNS.map((c) => (c.includes(',') ? `"${c}"` : c)).join(',')}`);
    await expect(studentPortalSheet(teacher)).rejects.toMatchObject({ status: 403 });
  });

  it('counts the enrolment by class, category and gender', async () => {
    const statement = await enrolmentStatement(office);
    const five = statement.lines.find((l) => l.grade === 5)!;
    expect(five).toMatchObject({ boys: 3, girls: 0, total: 3 });
    expect(five.cells.SC.boys).toBe(1);
    expect(statement.totals.cells.SC.boys).toBe(2);
    const sheet = await enrolmentSheet(office);
    expect(sheet.columns).toEqual(['Class', 'GEN boys', 'GEN girls', 'SC boys', 'SC girls', 'ST boys', 'ST girls', 'OBC-A boys', 'OBC-A girls', 'OBC-B boys', 'OBC-B girls', 'Total boys', 'Total girls', 'Total']);
    expect(sheet.rows.at(-1)).toEqual(['Total', 1, 0, 2, 0, 0, 0, 1, 0, 0, 0, 4, 0, 4]);
  });

  it('writes the activity log', async () => {
    const log = await db.select().from(s.auditLog).where(and(eq(s.auditLog.action, 'mdm.save')));
    expect(log.length).toBe(2);
  });
});
