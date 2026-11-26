'use client';

import { RotateCcw, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/ui/client';
import { Button } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { purgeFromTrashAction, restoreFromTrashAction } from '@/server/trash/actions';
import { useAction } from '../_ui/use-action';

export function TrashActions({ kind, id, name }: { kind: string; id: string; name: string }) {
  const t = useT();
  const restore = useAction(restoreFromTrashAction, { success: t('Brought back') });
  const purge = useAction(purgeFromTrashAction, { success: t('Removed for good') });
  return (
    <span className="inline-flex items-center gap-1.5">
      <Button variant="secondary" size="sm" disabled={restore.busy} onClick={() => restore.run(kind, id)}>
        <RotateCcw size={15} /> {t('Bring back')}
      </Button>
      <ConfirmButton
        size="sm"
        variant="ghost"
        title={t('Remove {name} for good?', { name })}
        text={t('This cannot be undone.')}
        confirmLabel={t('Remove for good')}
        onConfirm={async () => void (await purge.run(kind, id))}
        aria-label={t('Remove for good')}
      >
        <Trash2 size={15} />
      </ConfirmButton>
    </span>
  );
}
