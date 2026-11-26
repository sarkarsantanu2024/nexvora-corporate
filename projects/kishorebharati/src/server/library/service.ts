/**
 * The school library: books by accession number, lending to students and
 * staff, returns with a late fine, the overdue list, and lost or withdrawn
 * copies. The rules (loan days, fine a day, books a student may hold, the
 * accession prefix) are the `library` setting.
 *
 * A book is one physical copy. Its status says where it is: available on the
 * shelf, issued, lost or withdrawn. An issue row is one loan; it is closed
 * when the book comes back (returnedOn).
 */
import { and, asc, desc, eq, ilike, isNotNull, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { BOOK_STATUSES, bookIssues, books, counters, enrolments, sections, staff, students, type BookStatus } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { addDays, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import type { Session } from '@/lib/session-token';
import { day, optionalDay, optionalUuid, requiredText, rupees, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, getSetting, pageOf, putSetting } from '../admin/shared';
import { runImport, type ImportResult } from '../import';
import { assertOffice, currentYear } from '../school/access';

export type LibraryRules = { loanDays: number; finePerDay: number; maxBooks: number; accessionPrefix: string };

const whole = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
};

export async function libraryRules(db?: DbOrTx): Promise<LibraryRules> {
  const stored = await getSetting('library', db);
  return {
    loanDays: whole(stored.loanDays, 1, 365, 14),
    finePerDay: whole(stored.finePerDay, 0, 1000, 1),
    maxBooks: whole(stored.maxBooks, 1, 20, 2),
    accessionPrefix: typeof stored.accessionPrefix === 'string' ? stored.accessionPrefix.trim().slice(0, 10) : 'KB',
  };
}

const rulesInput = z.object({
  loanDays: z.coerce.number().int('Whole days only').min(1, 'At least 1 day').max(365, 'A year at the most'),
  finePerDay: rupees.refine((v) => v <= 1000, 'That fine is too large'),
  maxBooks: z.coerce.number().int('Whole books only').min(1, 'At least 1 book').max(20, '20 at the most'),
  accessionPrefix: z.string().trim().max(10, '10 letters at the most').regex(/^[A-Za-z0-9/-]*$/, 'Letters, numbers, dash or slash only'),
});

export async function saveLibraryRules(session: Session, input: z.input<typeof rulesInput>) {
  assertAdmin(session);
  const data = rulesInput.parse(input);
  await putSetting('library', data);
  await audit(session, 'settings.library', { entity: 'settings', entityId: 'library', summary: `Library rules: ${data.loanDays} days, ${inr(data.finePerDay)} a late day, ${data.maxBooks} books a student` });
  return data;
}

/** Whole days a book is late on a given day (0 when not late). */
export function daysLate(dueOn: string, on: string): number {
  const diff = Math.round((Date.parse(`${on}T00:00:00Z`) - Date.parse(`${dueOn}T00:00:00Z`)) / 86_400_000);
  return Math.max(0, diff);
}

const liveBook = isNull(books.deletedAt);
const openLoan = isNull(bookIssues.returnedOn);
const likeText = (q: string) => `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
const isUuid = (value: string | undefined | null): value is string => !!value && uuid.safeParse(value).success;

/* ───────────── books ───────────── */

export type BookFilter = { q?: string; status?: string; page?: string | number };

export async function listBooks(session: Session, filter: BookFilter = {}) {
  assertOffice(session);
  const db = await getDb();
  const q = (filter.q ?? '').trim().slice(0, 80);
  const search = and(
    liveBook,
    q ? or(ilike(books.title, likeText(q)), ilike(books.author, likeText(q)), ilike(books.accessionNo, likeText(q)), ilike(books.subject, likeText(q)), ilike(books.isbn, likeText(q))) : undefined,
  );
  const where = (BOOK_STATUSES as readonly string[]).includes(filter.status ?? '') ? and(search, eq(books.status, filter.status as BookStatus)) : search;
  const page = pageOf(filter.page);
  const [rows, [{ n }], statusRows] = await Promise.all([
    db.select().from(books).where(where).orderBy(asc(books.accessionNo)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(books).where(where),
    db.select({ status: books.status, n: countInt() }).from(books).where(search).groupBy(books.status),
  ]);
  const counts = Object.fromEntries(BOOK_STATUSES.map((status) => [status, 0])) as Record<BookStatus, number>;
  for (const row of statusRows) counts[row.status] = row.n;
  return { rows, total: n, page, pageSize: PAGE_SIZE, counts };
}

const bookInput = z.object({
  id: optionalUuid,
  /** Empty: the next number is given, with the prefix from the library rules. */
  accessionNo: z.string().trim().max(30).default(''),
  title: requiredText('Title', 200),
  author: text(120),
  publisher: text(120),
  subject: text(80),
  language: z.string().trim().max(30).default('Bengali'),
  isbn: z.string().trim().max(20).default(''),
  shelf: text(40),
  price: rupees.default(0),
  addedOn: optionalDay,
});
export type BookInput = z.input<typeof bookInput>;

/** The next free accession number: PREFIX-00001. A number already typed in by hand is skipped. Call inside a transaction. */
async function takeAccession(db: DbOrTx, prefix: string): Promise<string> {
  for (let tries = 0; tries < 1000; tries++) {
    const [row] = await db
      .insert(counters)
      .values({ key: 'accession', value: 1 })
      .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
      .returning({ value: counters.value });
    const candidate = `${prefix ? `${prefix}-` : ''}${String(row.value).padStart(5, '0')}`;
    const [taken] = await db.select({ id: books.id }).from(books).where(eq(books.accessionNo, candidate)).limit(1);
    if (!taken) return candidate;
  }
  throw new ApiError(500, 'Could not find a free accession number');
}

export async function saveBook(session: Session, input: BookInput) {
  assertOffice(session);
  const data = bookInput.parse(input);
  const db = await getDb();
  const { accessionPrefix } = await libraryRules(db);
  const values = {
    title: data.title,
    author: data.author,
    publisher: data.publisher,
    subject: data.subject,
    language: data.language || 'Bengali',
    isbn: data.isbn,
    shelf: data.shelf,
    price: data.price,
    // Kept as it is on a change unless a new date is given.
    ...(data.addedOn ? { addedOn: data.addedOn } : {}),
  };
  const row = await db.transaction(async (tx) => {
    if (data.accessionNo) {
      const [taken] = await tx
        .select({ id: books.id })
        .from(books)
        .where(and(eq(books.accessionNo, data.accessionNo), data.id ? sql`${books.id} <> ${data.id}` : undefined))
        .limit(1);
      if (taken) throw new ApiError(400, 'Another book already has this accession number', { accessionNo: 'Already in use' });
    }
    if (data.id) {
      const [updated] = await tx
        .update(books)
        .set({ ...values, ...(data.accessionNo ? { accessionNo: data.accessionNo } : {}), updatedAt: new Date() })
        .where(and(eq(books.id, data.id), liveBook))
        .returning();
      if (!updated) throw new ApiError(404, 'Book not found');
      return updated;
    }
    const accessionNo = data.accessionNo || (await takeAccession(tx, accessionPrefix));
    const [created] = await tx.insert(books).values({ ...values, accessionNo, addedOn: data.addedOn ?? todayIST() }).returning();
    return created;
  });
  await audit(session, data.id ? 'book.update' : 'book.create', { entity: 'book', entityId: row.id, summary: `${row.accessionNo}: ${row.title}` });
  return row;
}

const importRow = z.object({
  accessionNo: z.string().trim().max(30).default(''),
  title: requiredText('Title', 200),
  author: text(120),
  publisher: text(120),
  subject: text(80),
  language: z.string().trim().max(30).default(''),
  isbn: z.string().trim().max(20).default(''),
  shelf: text(40),
  price: z
    .union([z.literal(''), rupees])
    .default('')
    .transform((v) => (v === '' ? 0 : v)),
});

/** An old accession register from a spreadsheet. A row without a number gets the next one. */
export async function importBooks(session: Session, rows: unknown): Promise<ImportResult> {
  assertOffice(session);
  const db = await getDb();
  const { accessionPrefix } = await libraryRules(db);
  const result = await runImport(rows, importRow, async (row) => {
    await db.transaction(async (tx) => {
      if (row.accessionNo) {
        const [taken] = await tx.select({ id: books.id }).from(books).where(eq(books.accessionNo, row.accessionNo)).limit(1);
        if (taken) throw new ApiError(400, 'This accession number is already in the library');
      }
      const accessionNo = row.accessionNo || (await takeAccession(tx, accessionPrefix));
      await tx.insert(books).values({ ...row, accessionNo, language: row.language || 'Bengali', addedOn: todayIST() });
    });
  });
  await audit(session, 'book.import', { entity: 'book', summary: `Imported ${result.added} books from a spreadsheet` });
  return result;
}

/**
 * Lost, withdrawn (worn out, given away) or back on the shelf. A book on loan
 * cannot be withdrawn; marking it lost closes the loan with the late fine so far.
 */
export async function setBookStatus(session: Session, id: string, status: BookStatus, note = '') {
  assertOffice(session);
  if (!(['available', 'lost', 'withdrawn'] as BookStatus[]).includes(status)) throw new ApiError(400, 'Choose lost, withdrawn or back on the shelf');
  const bookId = uuid.parse(id);
  const db = await getDb();
  const today = todayIST();
  const rules = await libraryRules(db);
  const book = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(books).where(and(eq(books.id, bookId), liveBook)).for('update').limit(1);
    if (!row) throw new ApiError(404, 'Book not found');
    if (row.status === status) return row;
    const [loan] = await tx.select().from(bookIssues).where(and(eq(bookIssues.bookId, row.id), openLoan)).limit(1);
    if (loan) {
      if (status !== 'lost') throw new ApiError(400, 'This book is on loan. Take it back first, or mark it lost.');
      await tx
        .update(bookIssues)
        .set({ returnedOn: today, fine: daysLate(loan.dueOn, today) * rules.finePerDay, note: [loan.note, `Lost${note ? `: ${note}` : ''}`].filter(Boolean).join('\n') })
        .where(eq(bookIssues.id, loan.id));
    }
    const [updated] = await tx.update(books).set({ status, updatedAt: new Date() }).where(eq(books.id, row.id)).returning();
    return updated;
  });
  await audit(session, `book.${status}`, { entity: 'book', entityId: book.id, summary: `${book.accessionNo} ${book.title}: marked ${status}${note ? ` (${note})` : ''}` });
  return book;
}

/* ───────────── lending ───────────── */

/** Students (by name or admission number) and staff (by name) who may borrow. */
export async function findBorrowers(session: Session, q: string) {
  assertOffice(session);
  const term = q.trim().slice(0, 80);
  if (term.length < 2) return { students: [], staff: [] };
  const db = await getDb();
  const year = await currentYear(db);
  const [studentRows, staffRows] = await Promise.all([
    db
      .select({
        id: students.id,
        name: students.name,
        admissionNo: students.admissionNo,
        grade: sections.grade,
        sectionName: sections.name,
        stream: sections.stream,
        shift: sections.shift,
        rollNo: enrolments.rollNo,
      })
      .from(students)
      .leftJoin(enrolments, and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, year.id)))
      .leftJoin(sections, eq(sections.id, enrolments.sectionId))
      .where(and(isNull(students.deletedAt), eq(students.status, 'active'), or(ilike(students.name, likeText(term)), ilike(students.admissionNo, likeText(term)))))
      .orderBy(asc(students.name))
      .limit(12),
    db
      .select({ id: staff.id, name: staff.name, designation: staff.designation })
      .from(staff)
      .where(and(isNull(staff.deletedAt), eq(staff.active, true), ilike(staff.name, likeText(term))))
      .orderBy(asc(staff.name))
      .limit(6),
  ]);
  return { students: studentRows, staff: staffRows };
}

/** Books on the shelf that match, for the Issue form. */
export async function findAvailableBooks(session: Session, q: string) {
  assertOffice(session);
  const term = q.trim().slice(0, 80);
  if (!term) return [];
  const db = await getDb();
  return db
    .select({ id: books.id, accessionNo: books.accessionNo, title: books.title, author: books.author })
    .from(books)
    .where(and(liveBook, eq(books.status, 'available'), or(ilike(books.accessionNo, likeText(term)), ilike(books.title, likeText(term)), ilike(books.author, likeText(term)))))
    .orderBy(asc(books.accessionNo))
    .limit(12);
}

const issueInput = z
  .object({
    bookId: uuid,
    studentId: optionalUuid,
    staffId: optionalUuid,
    issuedOn: day,
    dueOn: optionalDay,
    note: text(200),
  })
  .refine((v) => Boolean(v.studentId) !== Boolean(v.staffId), { message: 'Choose one student or one member of staff', path: ['studentId'] });
export type IssueInput = z.input<typeof issueInput>;

export async function issueBook(session: Session, input: IssueInput) {
  assertOffice(session);
  const data = issueInput.parse(input);
  const today = todayIST();
  if (data.issuedOn > today) throw new ApiError(400, 'The date cannot be in the future', { issuedOn: 'Pick today or an earlier date' });
  const db = await getDb();
  const rules = await libraryRules(db);
  const dueOn = data.dueOn ?? addDays(data.issuedOn, rules.loanDays);
  if (dueOn < data.issuedOn) throw new ApiError(400, 'The return date must be after the issue date', { dueOn: 'Check the date' });

  const loan = await db.transaction(async (tx) => {
    // Locked so the same copy cannot be lent twice at the same moment.
    const [book] = await tx.select().from(books).where(and(eq(books.id, data.bookId), liveBook)).for('update').limit(1);
    if (!book) throw new ApiError(404, 'Book not found');
    if (book.status !== 'available') {
      throw new ApiError(400, book.status === 'issued' ? 'This book is already issued. Take it back first.' : book.status === 'lost' ? 'This book is marked lost' : 'This book is withdrawn from the library');
    }
    let borrower = '';
    if (data.studentId) {
      const [student] = await tx
        .select({ id: students.id, name: students.name, status: students.status })
        .from(students)
        .where(and(eq(students.id, data.studentId), isNull(students.deletedAt)))
        .for('update')
        .limit(1);
      if (!student) throw new ApiError(404, 'Student not found');
      if (student.status !== 'active') throw new ApiError(400, 'This student is no longer on the roll');
      const [{ n }] = await tx.select({ n: countInt() }).from(bookIssues).where(and(eq(bookIssues.studentId, student.id), openLoan));
      if (n >= rules.maxBooks) throw new ApiError(400, `${student.name} already has ${n} books. A student may hold ${rules.maxBooks} at a time.`);
      borrower = student.name;
    } else {
      const [member] = await tx
        .select({ id: staff.id, name: staff.name })
        .from(staff)
        .where(and(eq(staff.id, data.staffId!), isNull(staff.deletedAt)))
        .limit(1);
      if (!member) throw new ApiError(404, 'Staff member not found');
      borrower = member.name;
    }
    const [row] = await tx
      .insert(bookIssues)
      .values({ bookId: book.id, studentId: data.studentId, staffId: data.staffId, issuedOn: data.issuedOn, dueOn, note: data.note, issuedBy: session.uid })
      .returning();
    await tx.update(books).set({ status: 'issued', updatedAt: new Date() }).where(eq(books.id, book.id));
    return { row, book, borrower };
  });
  await audit(session, 'book.issue', { entity: 'book', entityId: loan.book.id, summary: `${loan.book.accessionNo} ${loan.book.title} issued to ${loan.borrower}, back by ${dueOn}` });
  return loan.row;
}

const returnInput = z.object({ returnedOn: day, finePaid: z.boolean().default(false) });

/** The book comes back. The fine is the late days times the fine a day; it can be paid now or later. */
export async function returnBook(session: Session, issueId: string, input: z.input<typeof returnInput>) {
  assertOffice(session);
  const data = returnInput.parse(input);
  if (data.returnedOn > todayIST()) throw new ApiError(400, 'The date cannot be in the future', { returnedOn: 'Pick today or an earlier date' });
  const db = await getDb();
  const rules = await libraryRules(db);
  const result = await db.transaction(async (tx) => {
    const [loan] = await tx.select().from(bookIssues).where(eq(bookIssues.id, uuid.parse(issueId))).for('update').limit(1);
    if (!loan) throw new ApiError(404, 'Loan not found');
    if (loan.returnedOn) throw new ApiError(400, 'This book is already back');
    if (data.returnedOn < loan.issuedOn) throw new ApiError(400, 'The book cannot come back before it was issued', { returnedOn: 'Check the date' });
    const fine = daysLate(loan.dueOn, data.returnedOn) * rules.finePerDay;
    const [row] = await tx
      .update(bookIssues)
      .set({ returnedOn: data.returnedOn, fine, finePaid: fine > 0 ? data.finePaid : false })
      .where(eq(bookIssues.id, loan.id))
      .returning();
    const [book] = await tx.select().from(books).where(eq(books.id, loan.bookId)).limit(1);
    // A copy marked lost or withdrawn meanwhile keeps that mark; otherwise it is back on the shelf.
    if (book?.status === 'issued') await tx.update(books).set({ status: 'available', updatedAt: new Date() }).where(eq(books.id, book.id));
    return { row, book };
  });
  await audit(session, 'book.return', {
    entity: 'book',
    entityId: result.row.bookId,
    summary: `${result.book?.accessionNo ?? ''} ${result.book?.title ?? ''} returned${result.row.fine ? `, fine ${inr(result.row.fine)}${result.row.finePaid ? ' paid' : ' due'}` : ''}`,
  });
  return result.row;
}

export async function markFinePaid(session: Session, issueId: string) {
  assertOffice(session);
  const db = await getDb();
  const [row] = await db
    .update(bookIssues)
    .set({ finePaid: true })
    .where(and(eq(bookIssues.id, uuid.parse(issueId)), isNotNull(bookIssues.returnedOn), sql`${bookIssues.fine} > 0`, eq(bookIssues.finePaid, false)))
    .returning();
  if (!row) throw new ApiError(404, 'There is no unpaid fine on this loan');
  await audit(session, 'book.fine_paid', { entity: 'book', entityId: row.bookId, summary: `Library fine of ${inr(row.fine)} paid` });
  return row;
}

/* ───────────── loans ───────────── */

export type LoanFilter = { view?: string; q?: string; page?: string | number };

const loanColumns = {
  id: bookIssues.id,
  bookId: books.id,
  accessionNo: books.accessionNo,
  title: books.title,
  author: books.author,
  issuedOn: bookIssues.issuedOn,
  dueOn: bookIssues.dueOn,
  returnedOn: bookIssues.returnedOn,
  fine: bookIssues.fine,
  finePaid: bookIssues.finePaid,
  note: bookIssues.note,
  studentId: students.id,
  studentName: students.name,
  admissionNo: students.admissionNo,
  studentPhone: students.phone,
  staffId: staff.id,
  staffName: staff.name,
  staffPhone: staff.phone,
  grade: sections.grade,
  sectionName: sections.name,
  stream: sections.stream,
  shift: sections.shift,
  rollNo: enrolments.rollNo,
};

/**
 * Loans: 'open' (out now, the default), 'overdue' (out and past the return
 * date), 'fines' (back with a fine not paid yet) or 'returned'.
 */
export async function listLoans(session: Session, filter: LoanFilter = {}) {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const today = todayIST();
  const view = ['open', 'overdue', 'fines', 'returned'].includes(filter.view ?? '') ? (filter.view as string) : 'open';
  const q = (filter.q ?? '').trim().slice(0, 80);
  const viewWhere: Record<string, SQL | undefined> = {
    open: openLoan,
    overdue: and(openLoan, lt(bookIssues.dueOn, today)),
    fines: and(isNotNull(bookIssues.returnedOn), sql`${bookIssues.fine} > 0`, eq(bookIssues.finePaid, false)),
    returned: isNotNull(bookIssues.returnedOn),
  };
  const where = and(
    viewWhere[view],
    q ? or(ilike(books.title, likeText(q)), ilike(books.accessionNo, likeText(q)), ilike(students.name, likeText(q)), ilike(students.admissionNo, likeText(q)), ilike(staff.name, likeText(q))) : undefined,
  );
  const page = pageOf(filter.page);
  const base = () =>
    db
      .select(loanColumns)
      .from(bookIssues)
      .innerJoin(books, eq(books.id, bookIssues.bookId))
      .leftJoin(students, eq(students.id, bookIssues.studentId))
      .leftJoin(staff, eq(staff.id, bookIssues.staffId))
      .leftJoin(enrolments, and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, year.id)))
      .leftJoin(sections, eq(sections.id, enrolments.sectionId));
  const [rows, [{ n }], counts] = await Promise.all([
    base()
      .where(where)
      .orderBy(...(view === 'returned' ? [desc(bookIssues.returnedOn)] : [asc(bookIssues.dueOn)]))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: countInt() })
      .from(bookIssues)
      .innerJoin(books, eq(books.id, bookIssues.bookId))
      .leftJoin(students, eq(students.id, bookIssues.studentId))
      .leftJoin(staff, eq(staff.id, bookIssues.staffId))
      .where(where),
    loanCounts(db, today),
  ]);
  const rules = await libraryRules(db);
  return {
    view,
    today,
    rules,
    rows: rows.map((row) => ({ ...row, late: row.returnedOn ? 0 : daysLate(row.dueOn, today), fineSoFar: row.returnedOn ? row.fine : daysLate(row.dueOn, today) * rules.finePerDay })),
    total: n,
    page,
    pageSize: PAGE_SIZE,
    counts,
  };
}

async function loanCounts(db: DbOrTx, today: string) {
  const [row] = await db
    .select({
      open: sql<number>`(count(*) filter (where ${bookIssues.returnedOn} is null))::int`,
      overdue: sql<number>`(count(*) filter (where ${bookIssues.returnedOn} is null and ${bookIssues.dueOn} < ${today}))::int`,
      fines: sql<number>`(count(*) filter (where ${bookIssues.returnedOn} is not null and ${bookIssues.fine} > 0 and not ${bookIssues.finePaid}))::int`,
    })
    .from(bookIssues);
  return row;
}

/** Books out past their return date today. For the bell. */
export async function countOverdueBooks(today = todayIST()) {
  const db = await getDb();
  const [row] = await db
    .select({ n: countInt() })
    .from(bookIssues)
    .where(and(openLoan, lt(bookIssues.dueOn, today)));
  return row.n;
}

/**
 * A student's library loans, newest first, for the parents' corner. The
 * caller checks that this login may see this student.
 */
export async function listLoansForStudent(studentId: string) {
  if (!isUuid(studentId)) return [];
  const db = await getDb();
  const today = todayIST();
  const rules = await libraryRules(db);
  const rows = await db
    .select({
      id: bookIssues.id,
      accessionNo: books.accessionNo,
      title: books.title,
      author: books.author,
      issuedOn: bookIssues.issuedOn,
      dueOn: bookIssues.dueOn,
      returnedOn: bookIssues.returnedOn,
      fine: bookIssues.fine,
      finePaid: bookIssues.finePaid,
    })
    .from(bookIssues)
    .innerJoin(books, eq(books.id, bookIssues.bookId))
    .where(eq(bookIssues.studentId, studentId))
    .orderBy(desc(bookIssues.issuedOn))
    .limit(100);
  return rows.map((row) => ({
    ...row,
    overdue: !row.returnedOn && row.dueOn < today,
    /** The fine owed: settled on return, or what it comes to if returned today. */
    fineDue: row.returnedOn ? (row.finePaid ? 0 : row.fine) : daysLate(row.dueOn, today) * rules.finePerDay,
  }));
}

/** Open loans of one student or staff member (for the issue form: what they have now). */
export async function openLoansOf(session: Session, who: { studentId?: string; staffId?: string }) {
  assertOffice(session);
  const db = await getDb();
  const cond = isUuid(who.studentId) ? eq(bookIssues.studentId, who.studentId) : isUuid(who.staffId) ? eq(bookIssues.staffId, who.staffId) : undefined;
  if (!cond) return [];
  return db
    .select({ id: bookIssues.id, accessionNo: books.accessionNo, title: books.title, dueOn: bookIssues.dueOn })
    .from(bookIssues)
    .innerJoin(books, eq(books.id, bookIssues.bookId))
    .where(and(cond, openLoan))
    .orderBy(asc(bookIssues.dueOn));
}
