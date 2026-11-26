'use server';

/** Server actions of the Library screens: who is asking, the service, then refresh. */
import { revalidatePath } from 'next/cache';
import type { BookStatus } from '@/db/schema';
import { action } from '@/lib/api';
import { ADMIN_ONLY, TEAM_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';

const refresh = () => {
  revalidatePath('/admin', 'layout');
  revalidatePath('/parent', 'layout');
};

export const saveBookAction = action(async (input: service.BookInput) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await service.saveBook(session, input);
  refresh();
  return { id: row.id, accessionNo: row.accessionNo };
});

export const importBooksAction = action(async (rows: Record<string, string>[]) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await service.importBooks(session, rows);
  refresh();
  return result;
});

export const setBookStatusAction = action(async (id: string, status: BookStatus, note: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.setBookStatus(session, id, status, note);
  refresh();
});

export const issueBookAction = action(async (input: service.IssueInput) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await service.issueBook(session, input);
  refresh();
  return { id: row.id, dueOn: row.dueOn };
});

export const returnBookAction = action(async (issueId: string, input: { returnedOn: string; finePaid: boolean }) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await service.returnBook(session, issueId, input);
  refresh();
  return { fine: row.fine, finePaid: row.finePaid };
});

export const markFinePaidAction = action(async (issueId: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.markFinePaid(session, issueId);
  refresh();
});

/** Search for the Issue form, called as the person types. */
export const findBorrowersAction = action(async (q: string) => {
  const session = await requireSession(TEAM_ROLES);
  return service.findBorrowers(session, q);
});

export const findBooksAction = action(async (q: string) => {
  const session = await requireSession(TEAM_ROLES);
  return service.findAvailableBooks(session, q);
});

export const openLoansAction = action(async (who: { studentId?: string; staffId?: string }) => {
  const session = await requireSession(TEAM_ROLES);
  return service.openLoansOf(session, who);
});

export const saveLibraryRulesAction = action(async (input: { loanDays: number; finePerDay: number; maxBooks: number; accessionPrefix: string }) => {
  const session = await requireSession(ADMIN_ONLY);
  const saved = await service.saveLibraryRules(session, input);
  refresh();
  return saved;
});
