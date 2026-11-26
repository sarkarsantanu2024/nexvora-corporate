/**
 * The library against a fresh in-memory database: books with accession
 * numbers, lending to students and staff, the limit of books a student may
 * hold, returns with a late fine, lost and withdrawn copies.
 */
import { and, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { addDays, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { createUser } from '@/server/admin/users';
import { libraryOverdueReminder } from '@/server/library/reminders';
import {
  countOverdueBooks,
  daysLate,
  importBooks,
  issueBook,
  listBooks,
  listLoans,
  listLoansForStudent,
  markFinePaid,
  returnBook,
  saveBook,
  saveLibraryRules,
  setBookStatus,
} from '@/server/library/service';
import { currentYear } from '@/server/school/access';

let db: DB;
let admin: Session;
let staff: Session;
let teacher: Session;
let student = '';
let other = '';
let librarian = '';
const today = todayIST();
const book: Record<string, string> = {};

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = { uid: row.id, name: row.name, username: row.username, role: row.role };
  const desk = await createUser(admin, { name: 'Office Clerk', username: 'clerk', password: 'start123', role: 'staff' });
  staff = { uid: desk.id, name: desk.name, username: desk.username, role: desk.role };
  const tUser = await createUser(admin, { name: 'A Teacher', username: 'teach', password: 'start123', role: 'teacher' });
  teacher = { uid: tUser.id, name: tUser.name, username: tUser.username, role: tUser.role };

  const year = await currentYear(db);
  const [section] = await db.select().from(s.sections).where(and(eq(s.sections.yearId, year.id), eq(s.sections.grade, 8))).limit(1);
  const [a] = await db.insert(s.students).values({ admissionNo: 'L-1', name: 'Sourav Das', phone: '9830011111' }).returning();
  const [b] = await db.insert(s.students).values({ admissionNo: 'L-2', name: 'Ritam Ghosh', phone: '9830022222' }).returning();
  await db.insert(s.enrolments).values([
    { yearId: year.id, studentId: a.id, sectionId: section.id, rollNo: 1 },
    { yearId: year.id, studentId: b.id, sectionId: section.id, rollNo: 2 },
  ]);
  student = a.id;
  other = b.id;
  const [lib] = await db.select().from(s.staff).where(eq(s.staff.designation, 'Librarian')).limit(1);
  librarian = lib.id;
}, 120_000);

describe('books', () => {
  it('gives accession numbers with the prefix, and refuses a number already used', async () => {
    const first = await saveBook(staff, { title: 'Sahaj Path', author: 'Rabindranath Tagore' });
    const second = await saveBook(staff, { title: 'Abol Tabol', author: 'Sukumar Ray' });
    expect(first.accessionNo).toBe('KB-00001');
    expect(second.accessionNo).toBe('KB-00002');
    await expect(saveBook(staff, { title: 'Copy', accessionNo: 'KB-00002' })).rejects.toMatchObject({ status: 400 });
    const typed = await saveBook(staff, { title: 'Pather Panchali', author: 'Bibhutibhushan Bandyopadhyay', accessionNo: 'KB-00003' });
    // The counter skips the number typed in by hand.
    const next = await saveBook(staff, { title: 'Feluda Samagra', author: 'Satyajit Ray' });
    expect(next.accessionNo).toBe('KB-00004');
    Object.assign(book, { sahaj: first.id, abol: second.id, pather: typed.id, feluda: next.id });
    await expect(saveBook(teacher, { title: 'x' })).rejects.toMatchObject({ status: 403 });
  });

  it('imports a register, leaving out a number already there', async () => {
    const result = await importBooks(staff, [
      { title: 'Chander Pahar', author: 'Bibhutibhushan Bandyopadhyay', accessionNo: '' },
      { title: 'Dup', accessionNo: 'KB-00001' },
      { title: '', accessionNo: '' },
    ]);
    expect(result.added).toBe(1);
    expect(result.skipped.map((r) => r.row)).toEqual([3, 4]);
    expect((await listBooks(staff, { q: 'pahar' })).rows[0].accessionNo).toBe('KB-00005');
  });
});

describe('lending', () => {
  it('cannot issue a book that is already issued', async () => {
    await issueBook(staff, { bookId: book.sahaj, studentId: student, issuedOn: today });
    await expect(issueBook(staff, { bookId: book.sahaj, studentId: other, issuedOn: today })).rejects.toMatchObject({ status: 400 });
    const loans = await listLoans(staff, { view: 'open' });
    expect(loans.rows[0].dueOn).toBe(addDays(today, 14));
  });

  it('holds a student to the most books allowed (default 2)', async () => {
    await issueBook(staff, { bookId: book.abol, studentId: student, issuedOn: today });
    await expect(issueBook(staff, { bookId: book.pather, studentId: student, issuedOn: today })).rejects.toMatchObject({ status: 400 });
    // Staff are not held to the student limit.
    await issueBook(staff, { bookId: book.pather, staffId: librarian, issuedOn: today });
  });

  it('charges the fine per late day on return, and records it paid', async () => {
    const [loan] = await db.select().from(s.bookIssues).where(eq(s.bookIssues.bookId, book.sahaj));
    await db.update(s.bookIssues).set({ issuedOn: addDays(today, -20), dueOn: addDays(today, -6) }).where(eq(s.bookIssues.id, loan.id));
    expect(await countOverdueBooks(today)).toBe(1);
    const reminders = await libraryOverdueReminder.collect({ db, today, settings: { enabled: {}, templates: {}, daysBefore: 3 }, business: 'School' });
    expect(reminders.map((r) => r.dedupeKey)).toEqual([`library_overdue:${loan.id}`]);

    const back = await returnBook(staff, loan.id, { returnedOn: today, finePaid: false });
    expect(back.fine).toBe(6);
    expect(await libraryOverdueReminder.resolved!(db, [loan.id])).toEqual([loan.id]);
    await expect(returnBook(staff, loan.id, { returnedOn: today })).rejects.toMatchObject({ status: 400 });
    expect((await listLoans(staff, { view: 'fines' })).total).toBe(1);
    await markFinePaid(staff, loan.id);
    expect((await listLoans(staff, { view: 'fines' })).total).toBe(0);
    const [shelf] = await db.select().from(s.books).where(eq(s.books.id, book.sahaj));
    expect(shelf.status).toBe('available');
  });

  it('follows the fine a day set by the head of school', async () => {
    await expect(saveLibraryRules(staff, { loanDays: 7, finePerDay: 2, maxBooks: 3, accessionPrefix: 'KB' })).rejects.toMatchObject({ status: 403 });
    await saveLibraryRules(admin, { loanDays: 7, finePerDay: 2, maxBooks: 3, accessionPrefix: 'KB' });
    const [loan] = await db.select().from(s.bookIssues).where(eq(s.bookIssues.bookId, book.abol));
    await db.update(s.bookIssues).set({ issuedOn: addDays(today, -20), dueOn: addDays(today, -3) }).where(eq(s.bookIssues.id, loan.id));
    await expect(returnBook(staff, loan.id, { returnedOn: addDays(today, 1) })).rejects.toMatchObject({ status: 400 });
    expect(await returnBook(staff, loan.id, { returnedOn: today, finePaid: true })).toMatchObject({ fine: 6, finePaid: true });
    expect(daysLate('2026-01-10', '2026-01-09')).toBe(0);
    expect(daysLate('2026-01-10', '2026-01-13')).toBe(3);
  });
});

describe('lost and withdrawn', () => {
  it('cannot issue a lost or withdrawn book, and cannot withdraw one on loan', async () => {
    await expect(setBookStatus(staff, book.pather, 'withdrawn')).rejects.toMatchObject({ status: 400 });
    await setBookStatus(staff, book.pather, 'lost', 'Lost on a trip');
    const [loan] = await db.select().from(s.bookIssues).where(eq(s.bookIssues.bookId, book.pather));
    expect(loan.returnedOn).toBe(today);
    await expect(issueBook(staff, { bookId: book.pather, studentId: other, issuedOn: today })).rejects.toMatchObject({ status: 400 });
    await setBookStatus(staff, book.feluda, 'withdrawn');
    await expect(issueBook(staff, { bookId: book.feluda, studentId: other, issuedOn: today })).rejects.toMatchObject({ status: 400 });
    const counts = (await listBooks(staff)).counts;
    expect(counts).toMatchObject({ lost: 1, withdrawn: 1 });
  });

  it('lists a student’s loans for the parents corner', async () => {
    const loans = await listLoansForStudent(student);
    expect(loans).toHaveLength(2);
    expect(loans.every((l) => l.returnedOn)).toBe(true);
    expect(await listLoansForStudent('not-an-id')).toEqual([]);
  });
});
