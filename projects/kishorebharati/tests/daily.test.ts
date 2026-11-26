/**
 * Daily school life against a fresh in-memory database: the register (who
 * may take it, Sundays and holidays, corrections), staff attendance, the
 * timetable and its clash check, the class diary and the school calendar.
 */
import { and, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { seedDailySample } from '@/db/sample/daily';
import { makeT } from '@/i18n/ui';
import { addDays, todayIST, weekday } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { createUser } from '@/server/admin/users';
import { absentToday } from '@/server/attendance/reminder';
import { dayBoard, getAttendanceSummary, loadRegister, monthlyRegister, presentToday, saveRegister } from '@/server/attendance/service';
import { saveStaffAttendance, staffMonthly, staffSheet } from '@/server/attendance/staff';
import { registerItems } from '@/server/daily/notify';
import { createDiaryEntry, deleteDiaryEntry, diaryChoices, listDiary, listDiaryForSections, updateDiaryEntry } from '@/server/diary/service';
import { createEvent, deleteEvent, listPublicEvents } from '@/server/events/service';
import { myDay } from '@/server/today/service';
import { saveTimetableSettings, setSlot, teacherTimetable } from '@/server/timetable/service';
import { listTrash } from '@/server/trash/service';

let db: DB;
let admin: Session;
let office: Session;
let classTeacher: Session;
let subjectTeacher: Session;
let sec7a: s.Section;
let sec7b: s.Section;
let sec5a: s.Section;
let bengali: s.Subject;
let history: s.Subject;
let physics: s.Subject;
let teacherStaff: s.StaffMember;
let otherStaff: s.StaffMember;
let boys: string[];
let boy7b: string;
let year: s.AcademicYear;
/** A school day in the past within this school year. */
let day: string;

const t = makeT(null);
const asSession = (row: { id: string; name: string; username: string; role: s.Role }): Session => ({ uid: row.id, name: row.name, username: row.username, role: row.role });

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = asSession(row);
  office = asSession(await createUser(admin, { name: 'Office', username: 'desk', password: 'start123', role: 'staff' }));
  classTeacher = asSession(await createUser(admin, { name: 'Class Teacher', username: 'ctteacher', password: 'start123', role: 'teacher' }));
  subjectTeacher = asSession(await createUser(admin, { name: 'Subject Teacher', username: 'stteacher', password: 'start123', role: 'teacher' }));

  [year] = await db.select().from(s.academicYears).where(eq(s.academicYears.isCurrent, true));
  const sections = await db.select().from(s.sections).where(eq(s.sections.yearId, year.id));
  sec7a = sections.find((x) => x.grade === 7 && x.name === 'A')!;
  sec7b = sections.find((x) => x.grade === 7 && x.name === 'B')!;
  sec5a = sections.find((x) => x.grade === 5 && x.name === 'A')!;
  const subjects = await db.select().from(s.subjects);
  bengali = subjects.find((x) => x.name === 'Bengali')!;
  history = subjects.find((x) => x.name === 'History')!;
  physics = subjects.find((x) => x.name === 'Physics')!;
  const teachers = (await db.select().from(s.staff).where(eq(s.staff.designation, 'Assistant teacher'))).sort((a, b) => a.sort - b.sort);
  [teacherStaff, otherStaff] = teachers;
  await db.update(s.staff).set({ userId: classTeacher.uid }).where(eq(s.staff.id, teacherStaff.id));
  await db.update(s.staff).set({ userId: subjectTeacher.uid }).where(eq(s.staff.id, otherStaff.id));
  await db.update(s.sections).set({ classTeacherId: teacherStaff.id }).where(eq(s.sections.id, sec7a.id));
  await db.insert(s.teachingAssignments).values([
    { sectionId: sec7a.id, subjectId: bengali.id, staffId: teacherStaff.id },
    { sectionId: sec7a.id, subjectId: history.id, staffId: otherStaff.id },
  ]);

  const made = await db
    .insert(s.students)
    .values([
      { admissionNo: 'T-1', name: 'Arnab Das', phone: '9830000001' },
      { admissionNo: 'T-2', name: 'Soham Ghosh', phone: '9830000002' },
      { admissionNo: 'T-3', name: 'Ritam Roy', phone: '' },
      { admissionNo: 'T-4', name: 'Sayan Sen', phone: '9830000004' },
    ])
    .returning();
  boys = made.slice(0, 3).map((x) => x.id);
  boy7b = made[3].id;
  await db.insert(s.enrolments).values([
    ...boys.map((studentId, i) => ({ yearId: year.id, studentId, sectionId: sec7a.id, rollNo: i + 1 })),
    { yearId: year.id, studentId: boy7b, sectionId: sec7b.id, rollNo: 1 },
  ]);

  day = addDays(todayIST(), -1);
  while (weekday(day) === 0) day = addDays(day, -1);
  if (day < year.startsOn) day = todayIST();
}, 120_000);

const allPresent = () => boys.map((studentId) => ({ studentId, status: 'present' as const }));

describe('the register', () => {
  it('shows the class teacher the list, nobody marked yet, and lets them mark', async () => {
    const register = await loadRegister(classTeacher, { sectionId: sec7a.id, day });
    expect(register.rows.map((row) => row.rollNo)).toEqual([1, 2, 3]);
    expect(register.rows.every((row) => row.status === null)).toBe(true);
    expect(register.canMark).toBe(true);
    expect(register.markedAt).toBeNull();
  });

  it('lets a subject teacher read the register but not take it', async () => {
    const register = await loadRegister(subjectTeacher, { sectionId: sec7a.id, day });
    expect(register.canMark).toBe(false);
    await expect(saveRegister(subjectTeacher, { sectionId: sec7a.id, day, marks: allPresent() })).rejects.toMatchObject({ status: 403 });
  });

  it('keeps a teacher out of a section that is not theirs', async () => {
    await expect(loadRegister(classTeacher, { sectionId: sec7b.id, day })).rejects.toMatchObject({ status: 403 });
    await expect(saveRegister(classTeacher, { sectionId: sec7b.id, day, marks: [{ studentId: boy7b, status: 'present' }] })).rejects.toMatchObject({ status: 403 });
  });

  it('refuses a student from another section, a day still to come, a Sunday and a holiday', async () => {
    await expect(saveRegister(classTeacher, { sectionId: sec7a.id, day, marks: [...allPresent(), { studentId: boy7b, status: 'present' }] })).rejects.toMatchObject({ status: 400 });
    await expect(saveRegister(classTeacher, { sectionId: sec7a.id, day: addDays(todayIST(), 1), marks: allPresent() })).rejects.toMatchObject({ status: 400 });
    let sunday = todayIST();
    while (weekday(sunday) !== 0) sunday = addDays(sunday, -1);
    if (sunday >= year.startsOn) await expect(saveRegister(office, { sectionId: sec7a.id, day: sunday, marks: allPresent() })).rejects.toMatchObject({ status: 400 });

    const holiday = await createEvent(office, { title: 'Test holiday', kind: 'holiday', startsOn: day, endsOn: '', venue: '', details: '', image: '', galleryAlbum: '', showOnWebsite: false });
    await expect(saveRegister(classTeacher, { sectionId: sec7a.id, day, marks: allPresent() })).rejects.toMatchObject({ status: 400 });
    expect((await loadRegister(classTeacher, { sectionId: sec7a.id, day })).closed).toEqual({ reason: 'holiday', title: 'Test holiday' });
    await deleteEvent(office, holiday.id);
    expect((await loadRegister(classTeacher, { sectionId: sec7a.id, day })).closed).toBeNull();
  });

  it('saves the whole register in one go, and saving again corrects it', async () => {
    const first = await saveRegister(classTeacher, { sectionId: sec7a.id, day, marks: [{ studentId: boys[0], status: 'absent' }, { studentId: boys[1], status: 'late' }, { studentId: boys[2], status: 'present' }] });
    expect(first).toEqual({ present: 1, absent: 1, late: 1, leave: 0 });
    await saveRegister(office, { sectionId: sec7a.id, day, marks: [{ studentId: boys[0], status: 'leave' }, { studentId: boys[1], status: 'late' }, { studentId: boys[2], status: 'present' }] });
    const rows = await db.select().from(s.attendance).where(eq(s.attendance.sectionId, sec7a.id));
    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.studentId === boys[0])?.status).toBe('leave');
    const register = await loadRegister(classTeacher, { sectionId: sec7a.id, day });
    expect(register.markedBy).toBe('Office');
    expect(register.markedAt).not.toBeNull();
    const log = await db.select().from(s.auditLog).where(eq(s.auditLog.action, 'attendance.save'));
    expect(log).toHaveLength(2);
  });

  it('counts a student over a stretch of days, late as present', async () => {
    const summary = await getAttendanceSummary(boys[1], day, day);
    expect(summary).toEqual({ present: 0, absent: 0, late: 1, leave: 0, days: 1, percent: 100 });
    expect((await getAttendanceSummary(boys[0], day, day)).percent).toBe(0);
    expect((await getAttendanceSummary(boy7b, day, day)).days).toBe(0);
  });

  it('shows who was absent the time before', async () => {
    const next = addDays(day, 1);
    if (next > todayIST() || weekday(next) === 0) return;
    await saveRegister(classTeacher, { sectionId: sec7a.id, day, marks: [{ studentId: boys[0], status: 'absent' }, { studentId: boys[1], status: 'late' }, { studentId: boys[2], status: 'present' }] });
    const register = await loadRegister(classTeacher, { sectionId: sec7a.id, day: next });
    expect(register.previousDay).toBe(day);
    expect(register.rows.filter((row) => row.absentBefore).map((row) => row.studentId)).toEqual([boys[0]]);
  });

  it('gives the office the board of all sections, and keeps it from teachers', async () => {
    const board = await dayBoard(office, day);
    const row7a = board.find((row) => row.section.id === sec7a.id)!;
    expect(row7a).toMatchObject({ students: 3, marked: 3 });
    expect(board.find((row) => row.section.id === sec7b.id)).toMatchObject({ students: 1, marked: 0, percent: null });
    await expect(dayBoard(classTeacher, day)).rejects.toMatchObject({ status: 403 });
  });

  it('draws the month register with letters and totals', async () => {
    await saveRegister(classTeacher, { sectionId: sec7a.id, day, marks: [{ studentId: boys[0], status: 'absent' }, { studentId: boys[1], status: 'late' }, { studentId: boys[2], status: 'present' }] });
    const month = await monthlyRegister(subjectTeacher, { sectionId: sec7a.id, month: day.slice(0, 7) });
    const index = month.days.indexOf(day);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(month.rows.map((row) => row.cells[index])).toEqual(['absent', 'late', 'present']);
    expect(month.rows[2]).toMatchObject({ present: 1, percent: 100 });
    await expect(monthlyRegister(subjectTeacher, { sectionId: sec7b.id, month: day.slice(0, 7) })).rejects.toMatchObject({ status: 403 });
  });

  it('queues an absent message only for absentees with a mobile, and drops it when corrected', async () => {
    const today = todayIST();
    if (weekday(today) === 0) return;
    await saveRegister(classTeacher, { sectionId: sec7a.id, day: today, marks: [{ studentId: boys[0], status: 'absent' }, { studentId: boys[1], status: 'present' }, { studentId: boys[2], status: 'absent' }] }).catch(() => null);
    const marked = await db.select().from(s.attendance).where(and(eq(s.attendance.day, today), eq(s.attendance.sectionId, sec7a.id)));
    if (!marked.length) return; // today is a holiday in the calendar
    const due = await absentToday.collect({ db, today, settings: { enabled: {}, templates: {}, daysBefore: 3 }, business: 'School' });
    // Ritam has no mobile number on record.
    expect(due.map((item) => item.dedupeKey)).toEqual([`absent:${boys[0]}:${today}`]);
    await saveRegister(classTeacher, { sectionId: sec7a.id, day: today, marks: allPresent() });
    expect(await absentToday.resolved!(db, [due[0].entityId])).toEqual([due[0].entityId]);
    expect((await presentToday(today)).percent).toBe(100);
  });

  it('rings the bell after 11:30 on a school day for a register not taken', async () => {
    // A Monday in the past, 12:00 and 10:00 India time.
    let monday = addDays(todayIST(), -7);
    while (weekday(monday) !== 1) monday = addDays(monday, -1);
    const noon = new Date(`${monday}T12:00:00+05:30`);
    const morning = new Date(`${monday}T10:00:00+05:30`);
    expect(await registerItems(classTeacher, t, morning)).toEqual([]);
    const lines = await registerItems(classTeacher, t, noon);
    expect(lines.map((line) => line.href)).toEqual([`/admin/attendance?section=${sec7a.id}&day=${monday}`]);
    expect(lines[0].title).toBe('Register not taken for Class 7 A');
    const officeLines = await registerItems(office, t, noon);
    expect(officeLines).toHaveLength(1);
    expect(officeLines[0].title).toMatch(/sections have no register today/);
    expect(await registerItems(subjectTeacher, t, noon)).toEqual([]);
  });
});

describe('staff attendance', () => {
  it('is for the office only, and is saved and corrected', async () => {
    await expect(staffSheet(classTeacher, day)).rejects.toMatchObject({ status: 403 });
    await expect(saveStaffAttendance(classTeacher, { day, marks: [{ staffId: teacherStaff.id, status: 'present' }] })).rejects.toMatchObject({ status: 403 });
    await saveStaffAttendance(office, { day, marks: [{ staffId: teacherStaff.id, status: 'present' }, { staffId: otherStaff.id, status: 'half_day' }] });
    await saveStaffAttendance(office, { day, marks: [{ staffId: otherStaff.id, status: 'duty' }] });
    const sheet = await staffSheet(office, day);
    expect(sheet.rows.find((row) => row.id === otherStaff.id)?.status).toBe('duty');
    const month = await staffMonthly(office, day.slice(0, 7));
    expect(month.rows.find((row) => row.id === teacherStaff.id)?.total.present).toBe(1);
    await expect(saveStaffAttendance(office, { day: addDays(todayIST(), 2), marks: [{ staffId: teacherStaff.id, status: 'present' }] })).rejects.toMatchObject({ status: 400 });
  });
});

describe('timetable', () => {
  it('is set by the office only', async () => {
    await expect(setSlot(classTeacher, { sectionId: sec7a.id, day: 1, period: 1, subjectId: bengali.id, staffId: teacherStaff.id, room: '' })).rejects.toMatchObject({ status: 403 });
  });

  it('catches a teacher put in two classes at once, unless confirmed', async () => {
    await setSlot(office, { sectionId: sec7a.id, day: 1, period: 1, subjectId: bengali.id, staffId: teacherStaff.id, room: '' });
    await expect(setSlot(office, { sectionId: sec7b.id, day: 1, period: 1, subjectId: bengali.id, staffId: teacherStaff.id, room: '' })).rejects.toMatchObject({ status: 409, fields: { clash: sec7a.id } });
    await setSlot(office, { sectionId: sec7b.id, day: 1, period: 1, subjectId: bengali.id, staffId: teacherStaff.id, room: '', confirmClash: true });
    const week = await teacherTimetable(classTeacher);
    expect(week.slots).toHaveLength(2);
    await expect(teacherTimetable(office)).rejects.toMatchObject({ status: 400 });
    expect((await teacherTimetable(office, teacherStaff.id)).slots).toHaveLength(2);
  });

  it('refuses a subject of another class and a period the class does not have, and clears a cell', async () => {
    await expect(setSlot(office, { sectionId: sec7a.id, day: 2, period: 1, subjectId: physics.id, staffId: null, room: '' })).rejects.toMatchObject({ status: 400 });
    // Class 5 goes home at 3.20 pm: six periods on a weekday.
    await expect(setSlot(office, { sectionId: sec5a.id, day: 1, period: 8, subjectId: bengali.id, staffId: null, room: '' })).rejects.toMatchObject({ status: 400 });
    await setSlot(office, { sectionId: sec7b.id, day: 1, period: 1, subjectId: null, staffId: null, room: '' });
    expect((await teacherTimetable(classTeacher)).slots).toHaveLength(1);
  });

  it('lets only the head of school change the period times, and checks them', async () => {
    const good = { weekday: [{ start: '10:50', end: '11:30' }, { start: '11:30', end: '12:10' }], saturday: [{ start: '10:50', end: '11:30' }], classEnds: { '7': '16:30' }, saturdayEnds: '13:30' };
    await expect(saveTimetableSettings(office, good)).rejects.toMatchObject({ status: 403 });
    await expect(saveTimetableSettings(admin, { ...good, weekday: [{ start: '10:50', end: '11:30' }, { start: '11:10', end: '12:00' }] })).rejects.toThrow();
    await expect(saveTimetableSettings(admin, { ...good, saturday: [{ start: '12:00', end: '11:00' }] })).rejects.toThrow();
    const saved = await saveTimetableSettings(admin, good);
    expect(saved.weekday).toHaveLength(2);
  });

  it('puts a teacher’s periods on My day, and keeps the office out', async () => {
    const mine = await myDay(classTeacher);
    expect(mine.registers.map((row) => row.section.id)).toEqual([sec7a.id]);
    await expect(myDay(office)).rejects.toMatchObject({ status: 403 });
  });
});

describe('class diary', () => {
  const entry = (sectionId: string, subjectId: string | null, title = 'Exercise 4') => ({ sectionId, subjectId, dueOn: '', title, details: '', attachment: '' });

  it('lets a teacher write only for the subjects they teach, and the class teacher a general note', async () => {
    const choices = await diaryChoices(subjectTeacher);
    expect(choices.map((choice) => [choice.section.id, choice.general, choice.subjects.map((x) => x.id)])).toEqual([[sec7a.id, false, [history.id]]]);
    await createDiaryEntry(classTeacher, entry(sec7a.id, bengali.id));
    await createDiaryEntry(classTeacher, entry(sec7a.id, null, 'Bring the report card'));
    await createDiaryEntry(subjectTeacher, entry(sec7a.id, history.id, 'Read chapter 2'));
    await expect(createDiaryEntry(subjectTeacher, entry(sec7a.id, null))).rejects.toMatchObject({ status: 403 });
    await expect(createDiaryEntry(subjectTeacher, entry(sec7a.id, bengali.id))).rejects.toMatchObject({ status: 403 });
    await expect(createDiaryEntry(classTeacher, entry(sec7b.id, bengali.id))).rejects.toMatchObject({ status: 403 });
    await expect(createDiaryEntry(office, entry(sec7a.id, physics.id))).rejects.toMatchObject({ status: 400 });
    await expect(createDiaryEntry(classTeacher, { ...entry(sec7a.id, bengali.id), givenOn: addDays(todayIST(), 1) })).rejects.toMatchObject({ status: 400 });
    await expect(createDiaryEntry(classTeacher, { ...entry(sec7a.id, bengali.id), givenOn: todayIST(), dueOn: addDays(todayIST(), -1) })).rejects.toMatchObject({ status: 400 });
    await expect(createDiaryEntry(classTeacher, entry(sec7a.id, bengali.id, '  '))).rejects.toThrow();
    expect((await listDiary(office)).total).toBe(3);
  });

  it('lets a teacher change and delete only their own entries', async () => {
    const { rows } = await listDiary(classTeacher, { section: sec7a.id });
    const theirs = rows.find((row) => row.title === 'Read chapter 2')!;
    const own = rows.find((row) => row.title === 'Exercise 4')!;
    await expect(updateDiaryEntry(classTeacher, theirs.id, entry(sec7a.id, history.id, 'Changed'))).rejects.toMatchObject({ status: 403 });
    await expect(deleteDiaryEntry(classTeacher, theirs.id)).rejects.toMatchObject({ status: 403 });
    await updateDiaryEntry(classTeacher, own.id, entry(sec7a.id, bengali.id, 'Exercise 4, sums 1 to 10'));
    await deleteDiaryEntry(classTeacher, own.id);
    await expect(deleteDiaryEntry(classTeacher, own.id)).rejects.toMatchObject({ status: 404 });
    const left = await listDiaryForSections([sec7a.id], addDays(todayIST(), -1), todayIST());
    expect(left.map((row) => row.title).sort()).toEqual(['Bring the report card', 'Read chapter 2']);
    expect((await listTrash(admin, 'homework')).map((row) => row.title)).toEqual(['Exercise 4, sums 1 to 10']);
  });
});

describe('school calendar', () => {
  const base = { kind: 'event' as const, endsOn: '', venue: 'School ground', details: '', image: '', galleryAlbum: '' };

  it('is changed by the office only, and checks the dates', async () => {
    const soon = addDays(todayIST(), 10);
    await expect(createEvent(classTeacher, { ...base, title: 'Annual Sports', startsOn: soon, showOnWebsite: true })).rejects.toMatchObject({ status: 403 });
    await expect(createEvent(office, { ...base, title: 'Annual Sports', startsOn: soon, endsOn: addDays(soon, -1), showOnWebsite: true })).rejects.toMatchObject({ status: 400 });
    const sports = await createEvent(office, { ...base, title: 'Annual Sports', startsOn: soon, endsOn: soon, showOnWebsite: true });
    expect(sports.endsOn).toBeNull();
    await createEvent(office, { ...base, kind: 'meeting', title: 'Staff meeting', startsOn: soon, showOnWebsite: false });
    expect((await listPublicEvents(todayIST())).map((row) => row.title)).toEqual(['Annual Sports']);
    await expect(deleteEvent(classTeacher, sports.id)).rejects.toMatchObject({ status: 403 });
    await deleteEvent(office, sports.id);
    expect(await listPublicEvents(todayIST())).toEqual([]);
  });
});

describe('sample data', () => {
  it('fills the daily screens for the sample teacher', async () => {
    const [officeRow] = await db.select().from(s.users).where(eq(s.users.username, 'desk'));
    await seedDailySample(db, { yearId: year.id, officeUserId: officeRow.id, teacherUserId: classTeacher.uid, teacherStaffId: teacherStaff.id });
    expect((await db.select().from(s.calendarEvents)).length).toBeGreaterThan(8);
    expect((await db.select().from(s.timetableSlots)).length).toBeGreaterThan(40);
    expect((await db.select().from(s.homework)).length).toBeGreaterThan(3);
    expect((await teacherTimetable(classTeacher)).slots.length).toBeGreaterThan(5);
  });
});
