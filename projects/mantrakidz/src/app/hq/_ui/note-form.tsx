'use client';

import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Textarea } from '@/components/ui/core';
import { addCentreNoteAction, addLeadNoteAction } from '@/server/hq/actions';
import { useAction } from './use-action';

/** The box at the top of a notes timeline. */
export function NoteForm({ kind, id, placeholder }: { kind: 'lead' | 'centre'; id: string; placeholder: string }) {
  const [note, setNote] = useState('');
  const add = useAction(kind === 'lead' ? addLeadNoteAction : addCentreNoteAction, { success: 'Note added', onDone: () => setNote('') });
  return (
    <div className="no-print">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} aria-label="Note" invalid={Boolean(add.fields._)} />
      <div className="mt-2 flex justify-end">
        <LoadingButton size="sm" loading={add.busy} disabled={!note.trim()} onClick={() => add.run(id, note)}>
          Add note
        </LoadingButton>
      </div>
    </div>
  );
}
