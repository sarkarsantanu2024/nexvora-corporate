'use client';

import { BookUp, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Notice } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { addDays, formatDate, todayIST } from '@/lib/date';
import { findBooksAction, findBorrowersAction, issueBookAction, openLoansAction } from '@/server/library/actions';
import { useAction } from '../_ui/use-action';
import { classOf } from '../fees/shared';

type BookPick = { id: string; accessionNo: string; title: string };
type Borrower = { kind: 'student' | 'staff'; id: string; name: string; detail: string };
type Found = Awaited<ReturnType<typeof findBorrowersAction>>;

/** Runs a search action a moment after the person stops typing. */
function useSearch<T>(q: string, run: (q: string) => Promise<{ ok: true; data: T } | { ok: false; error: string }>, empty: T, min = 1) {
  const [found, setFound] = useState<T>(empty);
  useEffect(() => {
    if (q.trim().length < min) {
      setFound(empty);
      return;
    }
    let live = true;
    const timer = window.setTimeout(async () => {
      const result = await run(q);
      if (live && result.ok) setFound(result.data);
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
    // `run` and `empty` are fixed for the life of the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, min]);
  return found;
}

const NO_BORROWERS: Extract<Found, { ok: true }>['data'] = { students: [], staff: [] };

/** Lend a book: pick the book (or come with one), pick the student or staff member, check the dates. */
export function IssueButton({ book: preset, size = 'md', loanDays = 14 }: { book?: BookPick; size?: 'sm' | 'md'; loanDays?: number }) {
  const t = useT();
  const lang = useUiLang();
  const today = todayIST();
  const [open, setOpen] = useState(false);
  const [book, setBook] = useState<BookPick | null>(preset ?? null);
  const [bookQ, setBookQ] = useState('');
  const [who, setWho] = useState<Borrower | null>(null);
  const [whoQ, setWhoQ] = useState('');
  const [issuedOn, setIssuedOn] = useState(today);
  const [dueOn, setDueOn] = useState('');
  const [holding, setHolding] = useState<{ id: string; accessionNo: string; title: string; dueOn: string }[]>([]);
  const issue = useAction(issueBookAction, { success: (data) => t('Issued. Return by {date}', { date: formatDate(data.dueOn) }), onDone: () => setOpen(false) });

  const books = useSearch<BookPick[]>(open && !book ? bookQ : '', async (q) => findBooksAction(q), []);
  const people = useSearch(open && !who ? whoQ : '', async (q) => findBorrowersAction(q), NO_BORROWERS, 2);

  useEffect(() => {
    if (!who) {
      setHolding([]);
      return;
    }
    let live = true;
    openLoansAction(who.kind === 'student' ? { studentId: who.id } : { staffId: who.id }).then((result) => {
      if (live && result.ok) setHolding(result.data);
    });
    return () => {
      live = false;
    };
  }, [who]);

  function start() {
    setBook(preset ?? null);
    setBookQ('');
    setWho(null);
    setWhoQ('');
    setIssuedOn(today);
    setDueOn('');
    issue.clearFields();
    setOpen(true);
  }

  const err = (key: string) => (issue.fields[key] ? t(issue.fields[key]) : undefined);

  return (
    <>
      <Button size={size} variant={preset ? 'secondary' : 'primary'} onClick={start}>
        <BookUp size={size === 'sm' ? 15 : 18} /> {preset ? t('Issue') : t('Issue book')}
      </Button>
      <Drawer
        open={open}
        onClose={() => !issue.busy && setOpen(false)}
        title={t('Issue a book')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={issue.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton
              loading={issue.busy}
              disabled={!book || !who}
              onClick={() =>
                book &&
                who &&
                issue.run({ bookId: book.id, studentId: who.kind === 'student' ? who.id : '', staffId: who.kind === 'staff' ? who.id : '', issuedOn, dueOn, note: '' })
              }
            >
              {t('Issue')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label={t('Book')} required>
            {book ? (
              <Chosen text={`${book.accessionNo} · ${book.title}`} onClear={preset ? undefined : () => setBook(null)} />
            ) : (
              <>
                <Input value={bookQ} placeholder={t('Accession no or title')} onChange={(e) => setBookQ(e.target.value)} autoFocus />
                <Choices
                  items={books.map((b) => ({ key: b.id, title: b.title, detail: b.accessionNo }))}
                  onPick={(key) => setBook(books.find((b) => b.id === key) ?? null)}
                  empty={bookQ.trim() ? t('No book on the shelf matches') : ''}
                />
              </>
            )}
          </Field>

          <Field label={t('Borrower')} required error={err('studentId')}>
            {who ? (
              <Chosen text={`${who.name}${who.detail ? ` · ${who.detail}` : ''}`} onClear={() => setWho(null)} />
            ) : (
              <>
                <Input value={whoQ} placeholder={t('Student name or admission no, or staff name')} onChange={(e) => setWhoQ(e.target.value)} />
                <Choices
                  items={[
                    ...people.students.map((s) => ({ key: `student:${s.id}`, title: s.name, detail: [classOf(s, lang), s.rollNo ? t('Roll {n}', { n: s.rollNo }) : '', s.admissionNo].filter(Boolean).join(' · ') })),
                    ...people.staff.map((s) => ({ key: `staff:${s.id}`, title: s.name, detail: [t('Staff'), s.designation].filter(Boolean).join(' · ') })),
                  ]}
                  onPick={(key) => {
                    const [kind, id] = key.split(':') as ['student' | 'staff', string];
                    const row = kind === 'student' ? people.students.find((s) => s.id === id) : people.staff.find((s) => s.id === id);
                    if (!row) return;
                    setWho({ kind, id, name: row.name, detail: kind === 'student' && 'admissionNo' in row ? row.admissionNo : t('Staff') });
                  }}
                  empty={whoQ.trim().length >= 2 ? t('Nobody found') : ''}
                />
              </>
            )}
          </Field>

          {holding.length ? (
            <Notice tone="amber">
              {t('Has now:')} {holding.map((h) => `${h.accessionNo} ${h.title} (${formatDate(h.dueOn)})`).join('; ')}
            </Notice>
          ) : null}

          <FormGrid>
            <Field label={t('Issued on')} required error={err('issuedOn')}>
              <Input type="date" max={today} value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
            </Field>
            <Field label={t('Return by')} error={err('dueOn')} hint={t('Empty: {date}', { date: formatDate(addDays(issuedOn || today, loanDays)) })}>
              <Input type="date" min={issuedOn} value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
            </Field>
          </FormGrid>
        </div>
      </Drawer>
    </>
  );
}

function Chosen({ text, onClear }: { text: string; onClear?: () => void }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-[15px] font-semibold text-brand-900">
      <Check size={16} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{text}</span>
      {onClear ? (
        <button type="button" aria-label={t('Change')} onClick={onClear} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-brand-100">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

function Choices({ items, onPick, empty }: { items: { key: string; title: string; detail: string }[]; onPick: (key: string) => void; empty: string }) {
  if (!items.length) return empty ? <p className="mt-2 text-sm text-ink-500">{empty}</p> : null;
  return (
    <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-ink-200">
      {items.map((item) => (
        <li key={item.key} className="border-b border-ink-100 last:border-b-0">
          <button type="button" onClick={() => onPick(item.key)} className="block w-full px-3.5 py-2.5 text-left hover:bg-brand-50/60">
            <span className="block truncate font-semibold text-ink-900">{item.title}</span>
            <span className="block truncate text-xs text-ink-500">{item.detail}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
