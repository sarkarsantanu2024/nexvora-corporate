/**
 * The library reminder of REMINDER_KINDS (src/server/reminders/kinds.ts): a
 * book kept past its return date. Sent once per loan; set aside by itself when
 * the book comes back.
 */
import { and, eq, inArray, isNull, lt, ne } from 'drizzle-orm';
import { bookIssues, books, students } from '@/db/schema';
import { formatDate } from '@/lib/date';
import { inr } from '@/lib/money';
import type { ReminderKind } from '../reminders/kinds';
import { daysLate, libraryRules } from './service';

export const libraryOverdueReminder: ReminderKind = {
  key: 'library_overdue',
  label: 'Library book overdue',
  description: 'A WhatsApp to the parent when a student keeps a library book past its return date.',
  defaultTemplate: 'নমস্কার, {student} গ্রন্থাগারের বই "{book}" {date}-এর মধ্যে ফেরত দেওয়ার কথা ছিল। দয়া করে বইটি তাড়াতাড়ি ফেরত দিতে বলুন। এখন পর্যন্ত জরিমানা {fine}। ধন্যবাদ।',
  placeholders: ['student', 'book', 'date', 'fine'],
  defaultOn: true,
  async collect({ db, today }) {
    const rules = await libraryRules(db);
    const rows = await db
      .select({ id: bookIssues.id, dueOn: bookIssues.dueOn, title: books.title, studentName: students.name, phone: students.phone })
      .from(bookIssues)
      .innerJoin(books, eq(books.id, bookIssues.bookId))
      .innerJoin(students, eq(students.id, bookIssues.studentId))
      .where(and(isNull(bookIssues.returnedOn), lt(bookIssues.dueOn, today), isNull(students.deletedAt), ne(students.phone, '')));
    return rows.map((row) => ({
      dedupeKey: `library_overdue:${row.id}`,
      toName: row.studentName,
      phone: row.phone,
      values: { student: row.studentName, book: row.title, date: formatDate(row.dueOn), fine: inr(daysLate(row.dueOn, today) * rules.finePerDay) },
      entity: 'book_issue',
      entityId: row.id,
      href: '/admin/library?tab=overdue',
      dueOn: today,
    }));
  },
  async resolved(db, ids) {
    if (!ids.length) return [];
    const open = await db.select({ id: bookIssues.id }).from(bookIssues).where(and(inArray(bookIssues.id, ids), isNull(bookIssues.returnedOn)));
    const still = new Set(open.map((row) => row.id));
    return ids.filter((id) => !still.has(id));
  },
};

