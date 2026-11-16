import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/client';
import { PageHeader } from '@/components/ui/core';
import { ApiError } from '@/lib/api';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { uuid } from '@/lib/validators';
import { royaltyStatement } from '@/server/hq/royalty';
import { isAdmin } from '@/server/hq/shared';
import { ContactLinks } from '../../../_ui/bits';
import { StatementView } from '../../statement-view';

export const metadata: Metadata = { title: 'Royalty statement' };

export default async function RoyaltyStatementPage({ params }: { params: Promise<{ centreId: string }> }) {
  const session = await requireSession(HQ_ROLES);
  const { centreId } = await params;
  if (!uuid.safeParse(centreId).success) notFound();
  const data = await royaltyStatement(centreId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        back={{ href: '/hq/royalty', label: 'Royalty' }}
        title={`Royalty statement, ${data.centre.name}`}
        description={`${data.centre.code} · ${data.centre.ownerName || 'Owner not added'}`}
        actions={
          <>
            <ContactLinks phone={data.centre.ownerPhone} email={data.centre.ownerEmail} size="md" />
            <PrintButton />
          </>
        }
      />
      <StatementView data={data} canCancel={isAdmin(session)} />
    </>
  );
}
