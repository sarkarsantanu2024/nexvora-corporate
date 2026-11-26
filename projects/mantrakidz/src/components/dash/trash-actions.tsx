'use client';

/** Bring back, and (where the record allows it) remove for good: the buttons of a Trash row. */
import { RotateCcw, Trash2 } from 'lucide-react';
import { useAction } from '@/app/hq/_ui/use-action';
import { ConfirmButton } from '@/components/ui/client';
import { Button } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { ActionResult } from '@/lib/api';

type TrashCall = (kind: string, id: string) => Promise<ActionResult<string | null>>;

export function TrashActions({ kind, id, name, canPurge, restore, purge }: { kind: string; id: string; name: string; canPurge: boolean; restore: TrashCall; purge?: TrashCall }) {
  const t = useT();
  const back = useAction(restore, { success: t('Brought back') });
  const remove = useAction(purge ?? restore, { success: t('Removed for good') });
  return (
    <span className="inline-flex items-center gap-1.5">
      <Button variant="secondary" size="sm" disabled={back.busy} onClick={() => back.run(kind, id)}>
        <RotateCcw size={15} /> {t('Bring back')}
      </Button>
      {canPurge && purge ? (
        <ConfirmButton
          size="sm"
          variant="ghost"
          title={t('Remove {name} for good?', { name })}
          text={t('This cannot be undone.')}
          confirmLabel={t('Remove for good')}
          onConfirm={async () => void (await remove.run(kind, id))}
          aria-label={t('Remove for good')}
        >
          <Trash2 size={15} />
        </ConfirmButton>
      ) : null}
    </span>
  );
}
