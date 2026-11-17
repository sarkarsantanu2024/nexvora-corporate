import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/ui/client';
import { Card, LinkButton, Notice, PageHeader } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { waLink } from '@/lib/wa';
import { getReceipt, receiptMessage } from '@/server/centre/money/payments';
import { WhatsAppLink } from '../../pickers';
import { ReceiptSheet } from '../receipt-sheet';
import { VoidButton } from './void-button';

export const metadata: Metadata = { title: 'Receipt' };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const { id } = await params;
  const receipt = await getReceipt(ctx, id);
  if (!receipt) notFound();
  const manager = canManageCentre(ctx.session);
  const live = receipt.lines.filter((line) => !line.voidedAt);

  return (
    <div className="animate-fade-up">
      <div className="no-print">
        <PageHeader
          title={t('Receipt')}
          description={`${receipt.student.name} · ${inr(receipt.amount)}`}
          back={{ href: '/centre/fees', label: t('Fees') }}
          actions={
            <>
              <PrintButton />
              {receipt.voided ? null : <WhatsAppLink href={waLink(receipt.student.guardianPhone, receiptMessage(receipt))} label={t('Send on WhatsApp')} size="md" />}
              <LinkButton href="/centre/fees/collect" variant="secondary">
                {t('Next payment')}
              </LinkButton>
            </>
          }
        />
        {receipt.voided ? (
          <Notice tone="red" className="mx-auto mb-4 max-w-2xl">
            {t('This receipt is void. It is kept on record and left out of every total.')}
          </Notice>
        ) : null}
      </div>

      <ReceiptSheet receipt={receipt} />

      <div className="no-print mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-between gap-3 text-sm">
        <Link href={`/centre/fees?student=${receipt.student.id}`} className="font-semibold text-brand-700 hover:underline">
          {t('All bills of {name}', { name: receipt.student.name })}
        </Link>
      </div>

      {manager && live.length ? (
        <Card className="no-print mx-auto mt-4 max-w-2xl p-4">
          <p className="text-sm font-bold text-ink-900">{t('Entered by mistake?')}</p>
          <p className="mt-0.5 text-sm text-ink-500">{t('Void the receipt. It stays on record marked void, and the bill goes back to unpaid.')}</p>
          <ul className="mt-3 space-y-2">
            {live.map((line) => (
              <li key={line.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-ink-800">
                  <span className="tabular font-semibold">{line.receiptNo}</span> · {line.title} · <span className="tabular">{inr(line.amount)}</span>
                </span>
                <VoidButton id={line.id} receiptNo={line.receiptNo} amount={line.amount} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
