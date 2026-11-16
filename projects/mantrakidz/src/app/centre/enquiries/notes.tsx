'use client';

/** Follow-up notes on an enquiry or a child: newest first, with a box to add one. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Textarea } from '@/components/ui/core';
import { formatDateTime } from '@/lib/date';
import { addEnquiryNoteAction, addStudentNoteAction } from '@/server/centre/children/actions';

export type NoteRow = { id: string; note: string; by: string; at: Date };

export function NotesTimeline({ kind, id, notes, placeholder }: { kind: 'enquiry' | 'student'; id: string; notes: NoteRow[]; placeholder: string }) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!text.trim()) return;
    setSaving(true);
    const result = await (kind === 'enquiry' ? addEnquiryNoteAction : addStudentNoteAction)(id, text);
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    setText('');
    toast.success('Note added');
    router.refresh();
  }

  return (
    <div>
      <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} aria-label="New note" maxLength={1000} />
      <div className="mt-2 flex justify-end">
        <LoadingButton size="sm" loading={saving} disabled={!text.trim()} onClick={add}>
          Add note
        </LoadingButton>
      </div>
      {notes.length ? (
        <ol className="mt-4 space-y-4 border-l-2 border-ink-100 pl-4">
          {notes.map((note) => (
            <li key={note.id} className="relative">
              <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" aria-hidden />
              <p className="whitespace-pre-line text-[15px] text-ink-800">{note.note}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {note.by || 'Someone'}, {formatDateTime(note.at)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-ink-500">No notes yet.</p>
      )}
    </div>
  );
}
