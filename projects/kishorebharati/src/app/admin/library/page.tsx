import { BookOpen, BookX } from 'lucide-react';
import type { Metadata } from 'next';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, StatusBadge, TabLinks, Table, Td, Th, Tr } from '@/components/ui/core';
import { BOOK_STATUSES } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { fillTemplate, waLink } from '@/lib/wa';
import { getSetting } from '@/server/admin/shared';
import { BOOK_STATUS_LABELS } from '@/server/library/constants';
import { listBooks, listLoans } from '@/server/library/service';
import { requirePlan } from '@/server/platform';
import { wordingOf } from '@/server/reminders/service';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { WhatsAppLink } from '../fees/bits';
import { classOf } from '../fees/shared';
import { BookButton, BookStatusButton, ImportBooks } from './book-form';
import { IssueButton } from './issue-form';
import { FinePaidButton, ReturnButton } from './loan-actions';

export const metadata: Metadata = { title: 'Library' };

const LOAN_VIEWS = ['open', 'overdue', 'fines', 'returned'] as const;

export default async function LibraryPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const tab = (LOAN_VIEWS as readonly string[]).includes(params.tab ?? '') ? (params.tab as (typeof LOAN_VIEWS)[number]) : 'books';
  const [books, loans, reminders] = await Promise.all([
    tab === 'books' ? listBooks(session, { q: params.q, status: params.status, page: params.page }) : null,
    listLoans(session, { view: tab === 'books' ? 'open' : tab, q: tab === 'books' ? '' : params.q, page: params.page }),
    getSetting('reminders'),
  ]);
  const wording = wordingOf(reminders, 'library_overdue');

  const tabs = [
    { key: 'books', label: t('Books'), href: '/admin/library' },
    { key: 'open', label: t('On loan'), href: '/admin/library?tab=open', count: loans.counts.open },
    { key: 'overdue', label: t('Overdue'), href: '/admin/library?tab=overdue', count: loans.counts.overdue },
    { key: 'fines', label: t('Fines due'), href: '/admin/library?tab=fines', count: loans.counts.fines },
    { key: 'returned', label: t('Returned'), href: '/admin/library?tab=returned' },
  ];

  return (
    <>
      <PageHeader
        title={t('Library')}
        description={t('Books by accession number, who has which book, and what is overdue.')}
        actions={
          <>
            <IssueButton loanDays={loans.rules.loanDays} />
            <BookButton />
            <ImportBooks />
          </>
        }
      />
      <TabLinks tabs={tabs} active={tab} />

      {books ? (
        <>
          <FilterBar>
            <SearchInput placeholder={t('Title, author or accession no')} />
            <UrlSelect param="status" label={t('Status')} options={[{ value: '', label: t('Any status') }, ...BOOK_STATUSES.map((status) => ({ value: status, label: `${t(BOOK_STATUS_LABELS[status])} (${books.counts[status]})` }))]} />
          </FilterBar>
          <Card className="overflow-hidden">
            {books.rows.length ? (
              <>
                <Table>
                  <thead>
                    <tr>
                      <Th>{t('Accession no')}</Th>
                      <Th>{t('Title')}</Th>
                      <Th>{t('Subject')}</Th>
                      <Th>{t('Shelf')}</Th>
                      <Th>{t('Status')}</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {books.rows.map((book) => (
                      <Tr key={book.id}>
                        <Td className="tabular whitespace-nowrap font-semibold">{book.accessionNo}</Td>
                        <Td className="min-w-[200px]">
                          <span className="font-medium text-ink-900">{book.title}</span>
                          <span className="block text-xs text-ink-500">{[book.author, book.publisher].filter(Boolean).join(' · ')}</span>
                        </Td>
                        <Td>{book.subject}</Td>
                        <Td>{book.shelf}</Td>
                        <Td>
                          <StatusBadge status={book.status} label={t(BOOK_STATUS_LABELS[book.status])} />
                        </Td>
                        <Td>
                          <div className="no-print flex flex-wrap justify-end gap-2">
                            {book.status === 'available' ? <IssueButton book={{ id: book.id, accessionNo: book.accessionNo, title: book.title }} size="sm" loanDays={loans.rules.loanDays} /> : null}
                            <BookButton
                              initial={{
                                id: book.id,
                                accessionNo: book.accessionNo,
                                title: book.title,
                                author: book.author,
                                publisher: book.publisher,
                                subject: book.subject,
                                language: book.language,
                                isbn: book.isbn,
                                shelf: book.shelf,
                                price: String(book.price),
                              }}
                            />
                            <BookStatusButton id={book.id} status={book.status} title={book.title} />
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination page={books.page} pageSize={books.pageSize} total={books.total} />
              </>
            ) : (
              <EmptyState
                icon={<BookOpen size={26} />}
                title={params.q || params.status ? t('No books match') : t('No books yet')}
                text={params.q || params.status ? t('Try another word or status.') : t('Add each book with its accession number, or bring in the accession register from a spreadsheet.')}
                action={params.q || params.status ? undefined : <BookButton />}
              />
            )}
          </Card>
        </>
      ) : (
        <>
          <FilterBar>
            <SearchInput placeholder={t('Book, student or staff name')} />
          </FilterBar>
          <Card className="overflow-hidden">
            {loans.rows.length ? (
              <>
                <Table>
                  <thead>
                    <tr>
                      <Th>{t('Book')}</Th>
                      <Th>{t('Borrower')}</Th>
                      <Th>{t('Issued')}</Th>
                      <Th>{tab === 'returned' || tab === 'fines' ? t('Returned') : t('Return by')}</Th>
                      <Th className="text-right">{t('Fine')}</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {loans.rows.map((loan) => {
                      const who = loan.studentName ?? loan.staffName ?? '';
                      const phone = loan.studentPhone ?? loan.staffPhone ?? '';
                      const place = loan.studentId ? [classOf(loan, lang), loan.rollNo ? t('Roll {n}', { n: loan.rollNo }) : ''].filter(Boolean).join(' · ') : t('Staff');
                      const message = fillTemplate(wording, { student: who, book: loan.title, date: formatDate(loan.dueOn), fine: inr(loan.fineSoFar) });
                      return (
                        <Tr key={loan.id}>
                          <Td className="min-w-[180px]">
                            <span className="font-medium text-ink-900">{loan.title}</span>
                            <span className="tabular block text-xs text-ink-500">{loan.accessionNo}</span>
                          </Td>
                          <Td>
                            <span className="font-medium text-ink-900">{who}</span>
                            <span className="block text-xs text-ink-500">{place}</span>
                          </Td>
                          <Td className="whitespace-nowrap">{formatDate(loan.issuedOn)}</Td>
                          <Td className={`whitespace-nowrap ${loan.late ? 'font-semibold text-accent-600' : ''}`}>
                            {loan.returnedOn ? formatDate(loan.returnedOn) : formatDate(loan.dueOn)}
                            {loan.late ? <span className="block text-xs">{t('{n} days late', { n: loan.late })}</span> : null}
                          </Td>
                          <Td className="tabular text-right font-semibold">
                            {loan.fineSoFar ? inr(loan.fineSoFar) : ''}
                            {loan.returnedOn && loan.fine > 0 ? <span className="block text-xs font-normal text-ink-500">{loan.finePaid ? t('Paid') : t('Not paid')}</span> : null}
                          </Td>
                          <Td>
                            <div className="no-print flex flex-wrap justify-end gap-2">
                              {!loan.returnedOn && loan.late ? <WhatsAppLink href={waLink(phone, message)} label={t('Remind')} /> : null}
                              {!loan.returnedOn ? <ReturnButton id={loan.id} title={loan.title} dueOn={loan.dueOn} today={loans.today} finePerDay={loans.rules.finePerDay} /> : null}
                              {loan.returnedOn && loan.fine > 0 && !loan.finePaid ? <FinePaidButton id={loan.id} amount={loan.fine} /> : null}
                            </div>
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
                <Pagination page={loans.page} pageSize={loans.pageSize} total={loans.total} />
              </>
            ) : (
              <EmptyState
                icon={<BookX size={26} />}
                title={tab === 'overdue' ? t('No book is overdue') : tab === 'fines' ? t('No fine to collect') : tab === 'returned' ? t('No book returned yet') : t('No book is out')}
                text={t('Issue a book from the Books list or with Issue book. The return date is {days} days later; each late day costs {fine}.', { days: loans.rules.loanDays, fine: inr(loans.rules.finePerDay) })}
              />
            )}
          </Card>
        </>
      )}
    </>
  );
}
