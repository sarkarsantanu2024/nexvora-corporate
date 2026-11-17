'use client';

import { Check, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { assignEnquiryAction, setMessageHandledAction } from '@/server/hq/actions';
import { useAction } from '../_ui/use-action';

/** Gives an enquiry that came with no centre to the centre that should call the parent. */
export function AssignEnquiry({ id, centres }: { id: string; centres: { id: string; name: string }[] }) {
  const t = useT();
  const [centreId, setCentreId] = useState('');
  const assign = useAction(assignEnquiryAction, { success: t('Enquiry given to the school') });
  return (
    <span className="flex items-center gap-1.5">
      <select aria-label={t('School')} value={centreId} onChange={(e) => setCentreId(e.target.value)} className="control h-9 w-44 py-0 text-sm">
        <option value="">{t('Choose a school')}</option>
        {centres.map((centre) => (
          <option key={centre.id} value={centre.id}>
            {centre.name}
          </option>
        ))}
      </select>
      <LoadingButton size="sm" loading={assign.busy} disabled={!centreId} onClick={() => assign.run(id, centreId)}>
        {t('Assign')}
      </LoadingButton>
    </span>
  );
}

export function HandledButton({ id, handled }: { id: string; handled: boolean }) {
  const t = useT();
  const toggle = useAction(setMessageHandledAction, { success: handled ? t('Moved back to waiting') : t('Marked as handled') });
  return (
    <LoadingButton variant={handled ? 'secondary' : 'primary'} size="sm" loading={toggle.busy} onClick={() => toggle.run(id, !handled)}>
      {handled ? <Undo2 size={15} /> : <Check size={15} />} {handled ? t('Not handled') : t('Mark handled')}
    </LoadingButton>
  );
}
