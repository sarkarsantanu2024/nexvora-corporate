/**
 * Students, classes, staff, certificates and government schemes, against a
 * fresh in-memory database (school year, sections, subjects and staff come
 * from seedSchool; no sample students under vitest).
 */
import { and, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import type { Session } from '@/lib/session-token';
import { getOverview } from '@/server/admin/service';
import { createUser } from '@/server/admin/users';
import { issueCertificate, listCertificates, voidCertificate } from '@/server/certificates/service';
import { dateInWords } from '@/server/certificates/words';
import { createYear, deleteSection, listSections, saveSection, saveSubject, setAssignment, setCurrentYear } from '@/server/classes/service';
import { birthdayReminder } from '@/server/students/reminders';
import { addBenefit, addBenefitsForSection, listBenefits } from '@/server/schemes/service';
import { setStaffActive, setStaffLogin } from '@/server/staff/service';
import { loadPromotion, runPromotion } from '@/server/students/promotion';
import {
  admitStudent,
  getStudent,
  importStudents,
  listStudents,
  markStudentBack,
  markStudentLeft,
  saveStudentSettings,
  setParentLogin,
  trashStudent,
  updateStudent,
} from '@/server/students/service';
import { studentTrash } from '@/server/students/trash';
import { purgeFromTrash } from '@/server/trash/service';
import { currentYear } from '@/server/school/access';

let db: DB;
let admin: Session;
let office: Session;
let teacher: Session;
let yearName: string;
let sec7a: s.Section;
let sec7b: s.Section;
let sec10a: s.Section;

const base = {
  gender: 'male' as const,
  category: 'GEN' as const,
  fatherName: 'Tapas Ghosh',
  phone: '9830011111',
};

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = { uid: row.id, name: row.name, username: row.username, role: row.role };
  const desk = await createUser(admin, { name: 'Office', username: 'desk', password: 'start123', role: 'staff' });
  office = { uid: desk.id, name: desk.name, username: desk.username, role: desk.role };

  const year = await currentYear(db);
  yearName = year.name;
  const sections = await db.select().from(s.sections).where(eq(s.sections.yearId, year.id));
  sec7a = sections.find((x) => x.grade === 7 && x.name === 'A')!;
  sec7b = sections.find((x) => x.grade === 7 && x.name === 'B')!;
  sec10a = sections.find((x) => x.grade === 10 && x.name === 'A')!;

  // A teacher login for the first assistant teacher, class teacher of 7 A.
  const [teacherRow] = await db.select().from(s.staff).where(eq(s.staff.designation, 'Assistant teacher')).orderBy(s.staff.sort).limit(1);
  const login = await setStaffLogin(admin, teacherRow.id, { username: 'teacher1', password: 'start123', role: 'teacher' });
  const [teacherUser] = await db.select().from(s.users).where(eq(s.users.username, login.username));
  teacher = { uid: teacherUser.id, name: teacherUser.name, username: teacherUser.username, role: 'teacher' };
  await saveSection(office, sec7a.id, { yearId: year.id, grade: 7, name: 'A', stream: '', shift: 'day', classTeacherId: teacherRow.id, room: '12', capacity: 60 });
}, 120_000);

describe('admission', () => {
  it('refuses a teacher, a missing name and a missing class', async () => {
    await expect(admitStudent(teacher, { ...base, name: 'Arnab Das', sectionId: sec7a.id })).rejects.toMatchObject({ status: 403 });
    await expect(admitStudent(office, { ...base, name: '', sectionId: sec7a.id })).rejects.toThrow();
    await expect(admitStudent(office, { ...base, name: 'Arnab Das', sectionId: '' })).rejects.toMatchObject({ status: 400 });
  });

  it('gives the next admission number in the format and the next roll number', async () => {
    await saveStudentSettings(admin, { admissionFormat: 'KB-{n}/{year}' });
    await expect(saveStudentSettings(office, { admissionFormat: '{n}' })).rejects.toMatchObject({ status: 403 });
    const a = await admitStudent(office, { ...base, name: 'Arnab Das', sectionId: sec7a.id, dob: '2014-03-15' });
    const b = await admitStudent(office, { ...base, name: 'Soham Das', sectionId: sec7a.id, phone: '9830011111' });
    expect(a.admissionNo).toBe(`KB-1/${yearName}`);
    expect(b.admissionNo).toBe(`KB-2/${yearName}`);
    const rolls = await db.select().from(s.enrolments).where(eq(s.enrolments.sectionId, sec7a.id));
    expect(rolls.map((r) => r.rollNo).sort()).toEqual([1, 2]);
  });

  it('refuses a roll number or admission number already taken', async () => {
    await expect(admitStudent(office, { ...base, name: 'Ritam Sen', sectionId: sec7a.id, rollNo: 1 })).rejects.toMatchObject({ fields: { rollNo: expect.any(String) } });
    await expect(admitStudent(office, { ...base, name: 'Ritam Sen', sectionId: sec7a.id, admissionNo: `KB-1/${yearName}` })).rejects.toMatchObject({ fields: { admissionNo: expect.any(String) } });
    const c = await admitStudent(office, { ...base, name: 'Ritam Sen', sectionId: sec7b.id, phone: '9830022222', rollNo: 5 });
    expect((await getStudent(office, c.id))?.current?.rollNo).toBe(5);
  });

  it('moves a student to another section when edited', async () => {
    const [ritam] = (await listStudents(office, { q: 'Ritam' })).rows;
    await updateStudent(office, ritam.id, { ...base, name: 'Ritam Sen', phone: '9830022222', sectionId: sec7a.id, rollNo: '' });
    const found = await getStudent(office, ritam.id);
    expect(found?.current?.sectionId).toBe(sec7a.id);
    expect(found?.current?.rollNo).toBe(3);
  });
});

describe('who sees which student', () => {
  it('shows a teacher only his own sections, read-only', async () => {
    const other = await admitStudent(office, { ...base, name: 'Ayan Roy', sectionId: sec7b.id, phone: '9830033333' });
    const mine = await listStudents(teacher, {});
    expect(mine.rows.every((row) => row.sectionId === sec7a.id)).toBe(true);
    expect(mine.total).toBe(3);
    expect(await getStudent(teacher, other.id)).toBeNull();
    expect((await getStudent(teacher, mine.rows[0].id))?.parent).toBeNull();
    await expect(markStudentLeft(teacher, other.id, { leftOn: '2026-05-01', reason: 'Moved' })).rejects.toMatchObject({ status: 403 });
  });

  it('counts students on roll for the overview', async () => {
    expect((await getOverview()).tiles.studentsOnRoll).toBe(4);
  });
});

describe('leaving, Trash and the parent login', () => {
  it('marks a student left and back on roll', async () => {
    const [ayan] = (await listStudents(office, { q: 'Ayan' })).rows;
    await markStudentLeft(office, ayan.id, { leftOn: '2026-05-01', reason: 'Family moved' });
    expect((await listStudents(office, { q: 'Ayan' })).total).toBe(0);
    expect((await listStudents(office, { q: 'Ayan', status: 'left' })).total).toBe(1);
    await markStudentBack(office, ayan.id);
    expect((await listStudents(office, { q: 'Ayan' })).total).toBe(1);
  });

  it('lets only an admin move a student to the Trash', async () => {
    const [ayan] = (await listStudents(office, { q: 'Ayan' })).rows;
    await expect(trashStudent(office, ayan.id)).rejects.toMatchObject({ status: 403 });
    await trashStudent(admin, ayan.id);
    expect(await getStudent(office, ayan.id)).toBeNull();
    expect((await studentTrash.list(db)).map((row) => row.id)).toContain(ayan.id);
    await purgeFromTrash(admin, 'student', ayan.id);
    expect(await db.select().from(s.students).where(eq(s.students.id, ayan.id))).toHaveLength(0);
  });

  it('gives one parent login to brothers with the same mobile', async () => {
    const [arnab] = (await listStudents(office, { q: 'Arnab' })).rows;
    const result = await setParentLogin(office, arnab.id, { password: 'parent1' });
    expect(result).toMatchObject({ username: '9830011111', created: true, linked: 1 });
    const [user] = await db.select().from(s.users).where(eq(s.users.username, '9830011111'));
    expect(user).toMatchObject({ role: 'parent', mustChangePassword: true });
    const [soham] = (await listStudents(office, { q: 'Soham' })).rows;
    expect((await getStudent(office, soham.id))?.parent?.id).toBe(user.id);
    // Again: the same login, a new password.
    expect((await setParentLogin(office, soham.id, { password: 'parent2' })).created).toBe(false);
    await expect(setParentLogin(teacher, soham.id, { password: 'parent3' })).rejects.toMatchObject({ status: 403 });
  });

  it('refuses a parent login on a staff member’s username', async () => {
    const odd = await admitStudent(office, { ...base, name: 'Pritam Pal', sectionId: sec7b.id, phone: '9830044444' });
    await createUser(admin, { name: 'Clerk', username: '9830044444', password: 'start123', role: 'staff' });
    await expect(setParentLogin(office, odd.id, { password: 'parent1' })).rejects.toMatchObject({ status: 400 });
  });
});

describe('import', () => {
  it('places each row by class and section, and lists refused rows', async () => {
    const result = await importStudents(office, [
      { name: 'Sagnik Bose', grade: '7', section: 'b', rollNo: '', dob: '04-05-2014', phone: '98300 55555', category: 'sc' },
      { name: 'Tanmoy Dey', grade: '4', section: 'A' },
      { name: 'Koushik Saha', grade: '11', section: 'A' },
      { name: 'Niladri Sen', grade: '11', section: 'A', stream: 'Science' },
      { name: 'Bad Date', grade: '7', section: 'A', dob: '31-02-2014' },
    ]);
    expect(result.added).toBe(2);
    expect(result.skipped.map((row) => row.row)).toEqual([3, 4, 6]);
    const [sagnik] = (await listStudents(office, { q: 'Sagnik' })).rows;
    expect(sagnik).toMatchObject({ dob: '2014-05-04', phone: '9830055555', category: 'SC', sectionId: sec7b.id });
    await expect(importStudents(teacher, [])).rejects.toMatchObject({ status: 403 });
  });
});

describe('classes and subjects', () => {
  it('needs a stream in 11 and 12, and refuses a teacher', async () => {
    const year = await currentYear(db);
    await expect(saveSection(office, null, { yearId: year.id, grade: 11, name: 'B', stream: '', shift: 'day', classTeacherId: '', room: '', capacity: 50 })).rejects.toMatchObject({ fields: { stream: expect.any(String) } });
    await expect(saveSection(teacher, null, { yearId: year.id, grade: 6, name: 'C', stream: '', shift: 'day', classTeacherId: '', room: '', capacity: 50 })).rejects.toMatchObject({ status: 403 });
    const added = await saveSection(office, null, { yearId: year.id, grade: 6, name: 'c', stream: '', shift: 'day', classTeacherId: '', room: '', capacity: 50 });
    expect(added.name).toBe('C');
    await expect(saveSection(office, null, { yearId: year.id, grade: 6, name: 'C', stream: '', shift: 'day', classTeacherId: '', room: '', capacity: 50 })).rejects.toMatchObject({ status: 400 });
    await deleteSection(office, added.id);
    await expect(deleteSection(office, sec7a.id)).rejects.toMatchObject({ status: 400 });
  });

  it('sets who teaches what only for a subject taught in that class', async () => {
    const subjects = await db.select().from(s.subjects);
    const physics = subjects.find((x) => x.name === 'Physics')!;
    const bengali = subjects.find((x) => x.name === 'Bengali')!;
    const [teacherRow] = await db.select().from(s.staff).where(eq(s.staff.userId, teacher.uid));
    await expect(setAssignment(office, { sectionId: sec7b.id, subjectId: physics.id, staffId: teacherRow.id })).rejects.toMatchObject({ status: 400 });
    await setAssignment(office, { sectionId: sec7b.id, subjectId: bengali.id, staffId: teacherRow.id });
    // Now the teacher also sees 7 B.
    expect((await listStudents(teacher, {})).rows.some((row) => row.sectionId === sec7b.id)).toBe(true);
    await setAssignment(office, { sectionId: sec7b.id, subjectId: bengali.id, staffId: '' });
    expect((await listStudents(teacher, {})).rows.some((row) => row.sectionId === sec7b.id)).toBe(false);
    await expect(saveSubject(office, null, { name: 'Statistics', nameBn: '', code: '', fromGrade: 9, toGrade: 12, stream: 'science', optional: true, sort: 50 })).rejects.toMatchObject({ status: 400 });
  });
});

describe('year end', () => {
  it('needs next year first', async () => {
    await expect(runPromotion(office, sec7a.id, { rows: [] })).rejects.toThrow();
    const data = await loadPromotion(office, sec7a.id);
    expect(data.next).toBeNull();
    await expect(runPromotion(office, sec7a.id, { rows: data.rows.map((row) => ({ studentId: row.studentId, result: 'promoted' as const, targetSectionId: null })) })).rejects.toMatchObject({ status: 400 });
  });

  it('promotes, detains and repeats safely', async () => {
    const next = await createYear(office, { name: String(Number(yearName) + 1), startsOn: `${Number(yearName) + 1}-01-01`, endsOn: `${Number(yearName) + 1}-12-31`, copySections: true });
    const nextSections = await listSections(office, next.id);
    expect(nextSections.length).toBeGreaterThan(10);
    const to8a = nextSections.find((x) => x.grade === 8 && x.name === 'A')!;
    const to7a = nextSections.find((x) => x.grade === 7 && x.name === 'A')!;
    const data = await loadPromotion(office, sec7a.id);
    const [first, second, third] = data.rows;
    // A promoted student must go to the next class.
    await expect(runPromotion(office, sec7a.id, { rows: [{ studentId: first.studentId, result: 'promoted', targetSectionId: to7a.id }] })).rejects.toMatchObject({ status: 400 });

    const plan = {
      rows: [
        { studentId: first.studentId, result: 'promoted' as const, targetSectionId: to8a.id },
        { studentId: second.studentId, result: 'detained' as const, targetSectionId: to7a.id },
        { studentId: third.studentId, result: 'promoted' as const, targetSectionId: to8a.id },
      ],
    };
    expect(await runPromotion(office, sec7a.id, plan)).toMatchObject({ promoted: 2, detained: 1, placed: 3 });
    // Again: nothing new, roll numbers kept.
    expect((await runPromotion(office, sec7a.id, plan)).placed).toBe(0);
    const placed = await db.select().from(s.enrolments).where(eq(s.enrolments.yearId, next.id));
    expect(placed).toHaveLength(3);
    expect(placed.filter((row) => row.sectionId === to8a.id).map((row) => row.rollNo).sort()).toEqual([1, 2]);

    // Changed mind: the third one left.
    await runPromotion(office, sec7a.id, { rows: [plan.rows[0], plan.rows[1], { studentId: third.studentId, result: 'left', targetSectionId: null }] });
    expect(await db.select().from(s.enrolments).where(eq(s.enrolments.yearId, next.id))).toHaveLength(2);
    const [left] = await db.select().from(s.students).where(eq(s.students.id, third.studentId));
    expect(left.status).toBe('left');
    const [result] = await db.select().from(s.enrolments).where(and(eq(s.enrolments.studentId, third.studentId), eq(s.enrolments.sectionId, sec7a.id)));
    expect(result.result).toBe('left');
    await expect(runPromotion(teacher, sec7a.id, plan)).rejects.toMatchObject({ status: 403 });
  });

  it('lets a Class 10 student pass out or continue in 11', async () => {
    const a = await admitStudent(office, { ...base, name: 'Rohan Paul', sectionId: sec10a.id, phone: '9830066666' });
    const b = await admitStudent(office, { ...base, name: 'Sourav Paul', sectionId: sec10a.id, phone: '9830077777' });
    const next = await loadPromotion(office, sec10a.id);
    const science = next.nextSections.find((x) => x.grade === 11 && x.stream === 'science')!;
    await runPromotion(office, sec10a.id, {
      rows: [
        { studentId: a.id, result: 'passed', targetSectionId: null },
        { studentId: b.id, result: 'passed', targetSectionId: science.id },
      ],
    });
    const [rohan] = await db.select().from(s.students).where(eq(s.students.id, a.id));
    const [sourav] = await db.select().from(s.students).where(eq(s.students.id, b.id));
    expect(rohan.status).toBe('passed_out');
    expect(sourav.status).toBe('active');
  });

  it('switches the current year only when asked', async () => {
    const years = await db.select().from(s.academicYears);
    const next = years.find((y) => y.name !== yearName)!;
    await setCurrentYear(office, next.id);
    expect((await currentYear(db)).name).toBe(next.name);
    await setCurrentYear(office, years.find((y) => y.name === yearName)!.id);
  });
});

describe('staff', () => {
  it('gives logins only through an admin, and switches the login off when someone leaves', async () => {
    const [clerk] = await db.select().from(s.staff).where(eq(s.staff.designation, 'Clerk'));
    await expect(setStaffLogin(office, clerk.id, { username: 'partha', password: 'start123', role: 'staff' })).rejects.toMatchObject({ status: 403 });
    await expect(setStaffLogin(admin, clerk.id, { username: 'teacher1', password: 'start123', role: 'staff' })).rejects.toMatchObject({ status: 400 });
    const login = await setStaffLogin(admin, clerk.id, { username: 'partha', password: 'start123', role: 'staff' });
    expect(login.created).toBe(true);
    await setStaffActive(office, clerk.id, false);
    const [user] = await db.select().from(s.users).where(eq(s.users.username, 'partha'));
    expect(user.active).toBe(false);
  });
});

describe('certificates', () => {
  it('writes the date of birth in words', () => {
    expect(dateInWords('2011-03-15')).toBe('Fifteenth March Two Thousand Eleven');
    expect(dateInWords('1998-12-21')).toBe('Twenty First December One Thousand Nine Hundred Ninety Eight');
  });

  it('issues a TC that marks the student left, with running serial numbers', async () => {
    const [arnab] = (await listStudents(office, { q: 'Arnab' })).rows;
    await expect(issueCertificate(office, { kind: 'tc', studentId: arnab.id, issuedOn: '2026-06-01', leftOn: '', reason: 'Moving', conduct: 'Good' })).rejects.toMatchObject({ status: 400 });
    await expect(issueCertificate(teacher, { kind: 'bonafide', studentId: arnab.id, issuedOn: '2026-06-01' })).rejects.toMatchObject({ status: 403 });
    const bona = await issueCertificate(office, { kind: 'bonafide', studentId: arnab.id, issuedOn: '2026-06-01', purpose: 'Bank account' });
    expect(bona.serialNo).toBe(`BC/${yearName}/1`);
    const tc = await issueCertificate(office, { kind: 'tc', studentId: arnab.id, issuedOn: '2026-06-02', leftOn: '2026-06-02', reason: 'Family moved', conduct: 'Good' });
    expect(tc.serialNo).toBe(`TC/${yearName}/1`);
    const [student] = await db.select().from(s.students).where(eq(s.students.id, arnab.id));
    expect(student).toMatchObject({ status: 'left', leftOn: '2026-06-02', leftReason: 'Family moved' });
    const [row] = await db.select().from(s.certificates).where(eq(s.certificates.id, tc.id));
    expect(row.data).toMatchObject({ name: 'Arnab Das', dobWords: 'Fifteenth March Two Thousand Fourteen' });
    // No second TC while one stands; no bonafide for a student who left.
    await expect(issueCertificate(office, { kind: 'tc', studentId: arnab.id, issuedOn: '2026-06-03', leftOn: '2026-06-02', reason: 'x', conduct: 'Good' })).rejects.toMatchObject({ status: 400 });
    await expect(issueCertificate(office, { kind: 'bonafide', studentId: arnab.id, issuedOn: '2026-06-03' })).rejects.toMatchObject({ status: 400 });
    // Void: admin only, needs a reason; the register keeps it.
    await expect(voidCertificate(office, tc.id, { reason: 'Wrong date' })).rejects.toMatchObject({ status: 403 });
    await expect(voidCertificate(admin, tc.id, { reason: ' ' })).rejects.toThrow();
    await voidCertificate(admin, tc.id, { reason: 'Wrong date' });
    const again = await issueCertificate(office, { kind: 'tc', studentId: arnab.id, issuedOn: '2026-06-03', leftOn: '2026-06-02', reason: 'Family moved', conduct: 'Good' });
    expect(again.serialNo).toBe(`TC/${yearName}/2`);
    const register = await listCertificates(office, { kind: 'tc' });
    expect(register.total).toBe(2);
    expect(register.counts.tc).toBe(1);
  });

  it('keeps a student with certificates when the Trash is emptied', async () => {
    const [arnab] = await db.select().from(s.students).where(eq(s.students.name, 'Arnab Das'));
    await trashStudent(admin, arnab.id);
    await expect(purgeFromTrash(admin, 'student', arnab.id)).rejects.toMatchObject({ status: 400 });
  });
});

describe('government schemes', () => {
  it('adds, refuses a second entry for the same year, and counts by scheme and status', async () => {
    const [soham] = (await listStudents(office, { q: 'Soham' })).rows;
    await addBenefit(office, { studentId: soham.id, scheme: 'Aikyashree', year: yearName, status: 'applied', amount: 1000 });
    await expect(addBenefit(office, { studentId: soham.id, scheme: 'Aikyashree', year: yearName, status: 'received' })).rejects.toMatchObject({ status: 400 });
    await expect(addBenefit(teacher, { studentId: soham.id, scheme: 'Oasis', year: yearName, status: 'applied' })).rejects.toMatchObject({ status: 403 });
    const roster = await db.select().from(s.enrolments).where(eq(s.enrolments.sectionId, sec7b.id));
    const ids = roster.map((row) => row.studentId);
    const bulk = await addBenefitsForSection(office, { sectionId: sec7b.id, studentIds: ids, scheme: 'Sabooj Sathi', year: yearName, status: 'sanctioned' });
    expect(bulk.added).toBe(ids.length);
    expect((await addBenefitsForSection(office, { sectionId: sec7b.id, studentIds: ids, scheme: 'Sabooj Sathi', year: yearName, status: 'sanctioned' })).skipped).toBe(ids.length);
    await expect(addBenefitsForSection(office, { sectionId: sec7a.id, studentIds: ids, scheme: 'Sabooj Sathi', year: yearName, status: 'sanctioned' })).rejects.toMatchObject({ status: 400 });
    const list = await listBenefits(office, {});
    const sabooj = list.summary.find((row) => row.scheme === 'Sabooj Sathi');
    expect(sabooj?.counts.sanctioned).toBe(ids.length);
    expect((await listBenefits(office, { scheme: 'Aikyashree' })).total).toBe(1);
  });
});

describe('birthday reminder', () => {
  it('finds students on roll whose birthday is today, once a year', async () => {
    const [sagnik] = (await listStudents(office, { q: 'Sagnik' })).rows;
    const due = await birthdayReminder.collect({ db, today: '2026-05-04', settings: { enabled: {}, templates: {}, daysBefore: 3 }, business: 'School' });
    expect(due.map((row) => row.dedupeKey)).toEqual([`birthday:${sagnik.id}:2026`]);
    expect(due[0]).toMatchObject({ phone: '9830055555', href: `/admin/students/${sagnik.id}` });
    expect(await birthdayReminder.resolved!(db, [sagnik.id])).toEqual([]);
  });
});
