/**
 * Sample library: well-known Bengali and English books a school library
 * holds, with accession numbers, a few lent to sample students and one kept
 * past its return date. Never loaded into Neon unless SEED_DEMO=1.
 */
import { eq } from 'drizzle-orm';
import { addDays, todayIST } from '@/lib/date';
import type { DB } from '../index';
import * as s from '../schema';
import type { SampleContext } from './index';

type BookSeed = [title: string, author: string, subject: string, language: string];

const BOOKS: BookSeed[] = [
  ['Sahaj Path (Part 1)', 'Rabindranath Tagore', 'Primer', 'Bengali'],
  ['Sahaj Path (Part 2)', 'Rabindranath Tagore', 'Primer', 'Bengali'],
  ['Gitanjali', 'Rabindranath Tagore', 'Poetry', 'Bengali'],
  ['Galpaguchchha', 'Rabindranath Tagore', 'Stories', 'Bengali'],
  ['Chokher Bali', 'Rabindranath Tagore', 'Novel', 'Bengali'],
  ['Gora', 'Rabindranath Tagore', 'Novel', 'Bengali'],
  ['Shesher Kabita', 'Rabindranath Tagore', 'Novel', 'Bengali'],
  ['Dak Ghar', 'Rabindranath Tagore', 'Drama', 'Bengali'],
  ['Anandamath', 'Bankim Chandra Chattopadhyay', 'Novel', 'Bengali'],
  ['Kapalkundala', 'Bankim Chandra Chattopadhyay', 'Novel', 'Bengali'],
  ['Durgeshnandini', 'Bankim Chandra Chattopadhyay', 'Novel', 'Bengali'],
  ['Devi Chaudhurani', 'Bankim Chandra Chattopadhyay', 'Novel', 'Bengali'],
  ['Srikanta', 'Sarat Chandra Chattopadhyay', 'Novel', 'Bengali'],
  ['Devdas', 'Sarat Chandra Chattopadhyay', 'Novel', 'Bengali'],
  ['Parineeta', 'Sarat Chandra Chattopadhyay', 'Novel', 'Bengali'],
  ['Pather Dabi', 'Sarat Chandra Chattopadhyay', 'Novel', 'Bengali'],
  ['Abol Tabol', 'Sukumar Ray', 'Poetry', 'Bengali'],
  ['HaJaBaRaLa', 'Sukumar Ray', 'Stories', 'Bengali'],
  ['Pagla Dashu', 'Sukumar Ray', 'Stories', 'Bengali'],
  ['Feluda Samagra (Part 1)', 'Satyajit Ray', 'Detective', 'Bengali'],
  ['Sonar Kella', 'Satyajit Ray', 'Detective', 'Bengali'],
  ['Badshahi Angti', 'Satyajit Ray', 'Detective', 'Bengali'],
  ['Professor Shonku', 'Satyajit Ray', 'Science fiction', 'Bengali'],
  ['Pather Panchali', 'Bibhutibhushan Bandyopadhyay', 'Novel', 'Bengali'],
  ['Aparajito', 'Bibhutibhushan Bandyopadhyay', 'Novel', 'Bengali'],
  ['Chander Pahar', 'Bibhutibhushan Bandyopadhyay', 'Adventure', 'Bengali'],
  ['Aranyak', 'Bibhutibhushan Bandyopadhyay', 'Novel', 'Bengali'],
  ['Tuntunir Boi', 'Upendrakishore Ray Chowdhury', 'Stories', 'Bengali'],
  ['Goopy Gyne Bagha Byne', 'Upendrakishore Ray Chowdhury', 'Stories', 'Bengali'],
  ['Thakurmar Jhuli', 'Dakshinaranjan Mitra Majumder', 'Folk tales', 'Bengali'],
  ['Khirer Putul', 'Abanindranath Tagore', 'Stories', 'Bengali'],
  ['Raj Kahini', 'Abanindranath Tagore', 'History', 'Bengali'],
  ['Padi Pishir Barmi Baksho', 'Leela Majumdar', 'Stories', 'Bengali'],
  ['Agnibeena', 'Kazi Nazrul Islam', 'Poetry', 'Bengali'],
  ['Ruposhi Bangla', 'Jibanananda Das', 'Poetry', 'Bengali'],
  ['Barnaparichay', 'Ishwar Chandra Vidyasagar', 'Primer', 'Bengali'],
  ['Sabuj Dwiper Raja', 'Sunil Gangopadhyay', 'Adventure', 'Bengali'],
  ['Wings of Fire', 'A P J Abdul Kalam', 'Biography', 'English'],
  ['The Discovery of India', 'Jawaharlal Nehru', 'History', 'English'],
  ['The Story of My Experiments with Truth', 'M K Gandhi', 'Biography', 'English'],
  ['Malgudi Days', 'R K Narayan', 'Stories', 'English'],
  ['Swami and Friends', 'R K Narayan', 'Novel', 'English'],
  ['The Room on the Roof', 'Ruskin Bond', 'Novel', 'English'],
  ['The Blue Umbrella', 'Ruskin Bond', 'Stories', 'English'],
  ['Treasure Island', 'Robert Louis Stevenson', 'Adventure', 'English'],
  ['Robinson Crusoe', 'Daniel Defoe', 'Adventure', 'English'],
  ["Gulliver's Travels", 'Jonathan Swift', 'Adventure', 'English'],
  ['Oliver Twist', 'Charles Dickens', 'Novel', 'English'],
  ['The Jungle Book', 'Rudyard Kipling', 'Stories', 'English'],
  ['Tales from Shakespeare', 'Charles and Mary Lamb', 'Stories', 'English'],
  ['Mathematics, Textbook for Class X', 'NCERT', 'Reference', 'English'],
  ['Science, Textbook for Class X', 'NCERT', 'Reference', 'English'],
  ['Ganit Prabha, Class 10', 'WBBSE', 'Reference', 'Bengali'],
  ['Sahitya Mela, Class 10', 'WBBSE', 'Reference', 'Bengali'],
  ["Oxford Advanced Learner's Dictionary", 'Oxford University Press', 'Reference', 'English'],
  ['Samsad Bengali-English Dictionary', 'Sahitya Samsad', 'Reference', 'Bengali'],
];

export async function seedLibrarySample(db: DB, context: SampleContext): Promise<void> {
  const today = todayIST();
  const shelves = ['A', 'B', 'C', 'D', 'E'];
  const rows = BOOKS.map(([title, author, subject, language], index) => ({
    accessionNo: `KB-${String(index + 1).padStart(5, '0')}`,
    title,
    author,
    subject,
    language,
    shelf: `${shelves[index % shelves.length]}-${Math.floor(index / shelves.length) + 1}`,
    addedOn: addDays(today, -400 + index),
  }));
  const books = await db.insert(s.books).values(rows).returning({ id: s.books.id, title: s.books.title });
  await db
    .insert(s.counters)
    .values({ key: 'accession', value: rows.length })
    .onConflictDoUpdate({ target: s.counters.key, set: { value: rows.length } });

  // Four loans to sample students of Class 8 and above; the first is past its return date.
  const borrowers = await db
    .select({ studentId: s.enrolments.studentId, grade: s.sections.grade })
    .from(s.enrolments)
    .innerJoin(s.sections, eq(s.sections.id, s.enrolments.sectionId))
    .where(eq(s.enrolments.yearId, context.yearId));
  const older = borrowers.filter((row) => row.grade >= 8).slice(0, 4);
  const plan = [
    { book: 'Chander Pahar', issuedOn: addDays(today, -24), dueOn: addDays(today, -10) },
    { book: 'Sonar Kella', issuedOn: addDays(today, -6), dueOn: addDays(today, 8) },
    { book: 'Wings of Fire', issuedOn: addDays(today, -3), dueOn: addDays(today, 11) },
    { book: 'Abol Tabol', issuedOn: addDays(today, -1), dueOn: addDays(today, 13) },
  ];
  for (const [index, loan] of plan.entries()) {
    const borrower = older[index];
    const book = books.find((row) => row.title === loan.book);
    if (!borrower || !book) continue;
    await db.insert(s.bookIssues).values({ bookId: book.id, studentId: borrower.studentId, issuedOn: loan.issuedOn, dueOn: loan.dueOn, issuedBy: context.officeUserId });
    await db.update(s.books).set({ status: 'issued' }).where(eq(s.books.id, book.id));
  }

  // One returned late with the fine still to pay, so the Fines list has a line.
  const late = books.find((row) => row.title === 'Malgudi Days');
  const lateBorrower = older[1];
  if (late && lateBorrower) {
    await db.insert(s.bookIssues).values({
      bookId: late.id,
      studentId: lateBorrower.studentId,
      issuedOn: addDays(today, -30),
      dueOn: addDays(today, -16),
      returnedOn: addDays(today, -12),
      fine: 4,
      issuedBy: context.officeUserId,
    });
  }
}
