'use client';

import { Check, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { assignEnquiryAction, setMessageHandledAction } from '@/server/hq/actions';
import { useAction } from '../_ui/use-action';

/** Gives an enquiry that came with no centre to the centre that should call the parent. */
export function AssignEnquiry({ id, centres }: { id: string; centres: { id: string; name: string }[] }) {
  const [centreId, setCentreId] = useState('');
  const assign = useAction(assignEnquiryAction, { success: 'Enquiry given to the centre' });
  return (
    <span className="flex items-center gap-1.5">
      <select aria-label="Centre" value={centreId} onChange={(e) => setCentreId(e.target.value)} className="control h-9 w-44 py-0 text-sm">
        <option value="">Choose a centre</option>
        {centres.map((centre) => (
          <option key={centre.id} value={centre.id}>
            {centre.name}
          </option>
        ))}
      </select>
      <LoadingButton size="sm" loading={assign.busy} disabled={!centreId} onClick={() => assign.run(id, centreId)}>
        Assign
      </LoadingButton>
    </span>
  );
}

export function HandledButton({ id, handled }: { id: string; handled: boolean }) {
  const toggle = useAction(setMessageHandledAction, { success: handled ? 'Moved back to waiting' : 'Marked as handled' });
  return (
    <LoadingButton variant={handled ? 'secondary' : 'primary'} size="sm" loading={toggle.busy} onClick={() => toggle.run(id, !handled)}>
      {handled ? <Undo2 size={15} /> : <Check size={15} />} {handled ? 'Not handled' : 'Mark handled'}
    </LoadingButton>
  );
}
