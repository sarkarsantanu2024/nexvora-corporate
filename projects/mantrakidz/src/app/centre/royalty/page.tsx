import type { Metadata } from 'next';
import { PrintButton } from '@/components/ui/client';
import { Notice, PageHeader } from '@/components/ui/core';
import { CENTRE_MANAGERS, requireCentre } from '@/lib/auth';
import { getT } from '@/lib/t';
import { royaltyStatement } from '@/server/hq/royalty';
import { StatementView } from '../../hq/royalty/statement-view';

export const metadata: Metadata = { title: 'Royalty to head office' };

/** Read-only: the centre head sees what head office has raised and received. Only head office records payments. */
export default async function CentreRoyaltyPage() {
  // The centre always comes from the login (or the centre head office stepped into), never from the address bar.
  const t = await getT();
  const { centre } = await requireCentre(CENTRE_MANAGERS);
  const data = await royaltyStatement(centre.id);

  return (
    <>
      <PageHeader
        title={t('Royalty to head office')}
        description={t('What this school owes head office each month, and what has been paid.')}
        actions={<PrintButton />}
      />
      {centre.isCompanyOwned ? (
        <Notice className="mb-5">{t('This school is run by head office, so it pays no royalty.')}</Notice>
      ) : data.totals.overdue > 0 ? (
        <Notice tone="red" className="mb-5">
          {t('Some royalty is past its due date. Please pay head office and share the payment reference, so it can be recorded here.')}
        </Notice>
      ) : null}
      <StatementView data={data} />
    </>
  );
}
