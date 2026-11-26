'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, LoadingButton } from '@/components/ui/client';
import { Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { ENQUIRY_STATUSES, type EnquiryStatus } from '@/db/schema';
import { cn } from '@/lib/cn';
import { addEnquiryNoteAction, deleteEnquiryAction, setEnquiryStatusAction } from '@/server/enquiries/actions';
import { STATUS_LABELS } from '@/server/enquiries/constants';
import { useAction } from '../_ui/use-action';

/** The three statuses as one row of buttons; the current one is filled in. */
export function StatusControl({ id, status }: { id: string; status: EnquiryStatus }) {
  const t = useT();
  const change = useAction(setEnquiryStatusAction, { success: t('Status changed') });
  return (
    <div role="group" aria-label={t('Status')} className="inline-flex flex-wrap gap-2">
      {ENQUIRY_STATUSES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === status}
          disabled={change.busy || option === status}
          onClick={() => change.run(id, option)}
          className={cn(
            'min-h-[40px] rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-default',
            option === status ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 disabled:opacity-60',
          )}
        >
          {t(STATUS_LABELS[option])}
        </button>
      ))}
    </div>
  );
}

/** The box at the top of the notes timeline. */
export function NoteForm({ id }: { id: string }) {
  const t = useT();
  const [note, setNote] = useState('');
  const add = useAction(addEnquiryNoteAction, { success: t('Note added'), onDone: () => setNote('') });
  return (
    <div className="no-print">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Called back, asked to visit on Saturday')} aria-label={t('Note')} invalid={Boolean(add.fields._)} />
      <div className="mt-2 flex justify-end">
        <LoadingButton size="sm" loading={add.busy} disabled={!note.trim()} onClick={() => add.run(id, note)}>
          {t('Add note')}
        </LoadingButton>
      </div>
    </div>
  );
}

export function DeleteEnquiry({ id, name }: { id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const remove = useAction(deleteEnquiryAction, { success: t('Moved to the Trash'), onDone: () => router.push('/admin/enquiries') });
  return (
    <ConfirmButton
      size="sm"
      title={t('Delete the enquiry from {name}?', { name })}
      text={t('Use this for spam and test entries only. It goes to the Trash, where an admin can bring it back.')}
      confirmLabel={t('Delete')}
      onConfirm={async () => void (await remove.run(id))}
    >
      <Trash2 size={15} /> {t('Delete')}
    </ConfirmButton>
  );
}
