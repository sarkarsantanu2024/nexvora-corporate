import type { Metadata } from 'next';
import { TrashList } from '@/components/dash/trash-list';
import { UrlSelect } from '@/components/ui/client';
import { PageHeader } from '@/components/ui/core';
import { CENTRE_MANAGERS, requireCentre } from '@/lib/auth';
import { getT } from '@/lib/t';
import { purgeSchoolTrashAction, restoreSchoolTrashAction } from '@/server/trash/actions';
import { SCHOOL_TRASH_KINDS, listSchoolTrash } from '@/server/trash/service';
import { FilterBar, readSearch, type Search } from '@/app/hq/_ui/bits';

export const metadata: Metadata = { title: 'Trash' };

export default async function SchoolTrashPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const ctx = await requireCentre(CENTRE_MANAGERS);
  const params = await readSearch(searchParams);
  const kind = SCHOOL_TRASH_KINDS.some((item) => item.kind === params.kind) ? params.kind : undefined;
  const rows = await listSchoolTrash(ctx, kind);

  return (
    <>
      <PageHeader title={t('Trash')} description={t('Children, staff and expenses deleted at this school stay here until you bring them back. Expenses are money records, so they are never removed for good.')} />
      <FilterBar>
        <UrlSelect param="kind" label={t('Kind')} options={[{ value: '', label: t('All kinds') }, ...SCHOOL_TRASH_KINDS.map((item) => ({ value: item.kind, label: t(item.label) }))]} />
      </FilterBar>
      <TrashList rows={rows} labels={Object.fromEntries(SCHOOL_TRASH_KINDS.map((item) => [item.kind, item.label]))} restore={restoreSchoolTrashAction} purge={purgeSchoolTrashAction} />
    </>
  );
}
