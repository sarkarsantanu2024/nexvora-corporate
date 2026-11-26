import type { Metadata } from 'next';
import { TrashList } from '@/components/dash/trash-list';
import { PageHeader } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { restoreHqTrashAction } from '@/server/trash/actions';
import { listHqTrash } from '@/server/trash/service';

export const metadata: Metadata = { title: 'Trash' };

export default async function HqTrashPage() {
  const t = await getT();
  const session = await requireSession(['hq_admin']);
  const rows = await listHqTrash(session);

  return (
    <>
      <PageHeader
        title={t('Trash')}
        description={t('Schools deleted by head office stay here and can be brought back with their logins. For children, staff and expenses, open the school and its own Trash.')}
      />
      <TrashList rows={rows} labels={{ centre: 'School' }} restore={restoreHqTrashAction} />
    </>
  );
}
