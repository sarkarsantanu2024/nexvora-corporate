import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/client';
import { PageHeader } from '@/components/ui/core';
import { ApiError } from '@/lib/api';
import { requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { getReceipt } from '@/server/parent/service';
import { ReceiptSheet } from '../../../../centre/fees/receipts/receipt-sheet';

export const metadata: Metadata = { title: 'Receipt' };

export default async function ParentReceipt({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(['parent']);
  const { id } = await params;
  const receipt = await getReceipt(session, id).catch((error) => {
    // Another family's receipt and a receipt that does not exist look the same from here.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return (
    <div className="animate-fade-up">
      <div className="no-print">
        <PageHeader title={t('Receipt')} description={receipt.student.name} back={{ href: '/parent/fees', label: t('Fees') }} actions={<PrintButton />} />
      </div>
      <ReceiptSheet receipt={receipt} />
    </div>
  );
}
