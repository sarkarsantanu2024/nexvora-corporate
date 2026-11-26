import { Smartphone } from 'lucide-react';
import { buttonClass } from '@/components/ui/core';
import { getT } from '@/lib/t';
import { hasBank, upiPayLink, type PaymentDetails } from '@/server/money/labels';
import { CopyButton } from './bits';

function Row({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="tabular break-all text-[15px] font-semibold text-ink-900">{value}</p>
      </div>
      {copy ? <CopyButton value={value} label={label} /> : null}
    </div>
  );
}

/**
 * How to pay the school: QR, UPI ID and bank details. On the printed bill,
 * and for the parents' corner. Nothing is marked paid from here; the office
 * records the receipt when the money arrives.
 */
export async function PayInfo({ details, amount, note, payee, upiLink }: { details: PaymentDetails; amount: number; note: string; payee: string; upiLink: 'always' | 'without-qr' }) {
  const t = await getT();
  const link = upiLink === 'always' || !details.qrImage ? upiPayLink(details, amount, note, payee) : '';
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {details.qrImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={details.qrImage} alt={t('UPI QR code')} className="h-44 w-44 shrink-0 self-center rounded-xl border border-ink-200 bg-white object-contain p-1 sm:self-start" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="divide-y divide-ink-100">
          <Row label={t('UPI ID')} value={details.upiId} copy />
          <Row label={t('Pay to')} value={details.payeeName} />
          {hasBank(details) ? (
            <>
              <Row label={t('Account name')} value={details.accountName} />
              <Row label={t('Account number')} value={details.accountNumber} copy />
              <Row label={t('IFSC')} value={details.ifsc} copy />
              <Row label={t('Bank and branch')} value={[details.bank, details.branch].filter(Boolean).join(', ')} />
            </>
          ) : null}
        </div>
        {link ? (
          // A upi:// link opens only on a phone with a UPI app, so it is offered on small screens.
          <a href={link} className={buttonClass('primary', 'md', 'no-print mt-3 w-full lg:hidden')}>
            <Smartphone size={18} /> {t('Pay by UPI app')}
          </a>
        ) : null}
        {details.note ? <p className="mt-3 text-sm text-ink-600">{details.note}</p> : null}
      </div>
    </div>
  );
}
