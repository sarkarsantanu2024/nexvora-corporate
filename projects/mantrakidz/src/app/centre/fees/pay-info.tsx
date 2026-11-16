import { Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/core';
import { hasBank, upiPayLink, type PaymentDetails } from '@/server/centre/money/payment-info';
import { CopyButton } from './pickers';

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
 * How to pay a centre: QR, UPI ID and bank details. Used on the printed bill
 * and in the parent corner. Nothing is marked paid from here; the centre
 * records the receipt when the money arrives.
 */
export function PayInfo({
  details,
  amount,
  note,
  centreName,
  upiLink,
  children,
}: {
  details: PaymentDetails;
  amount: number;
  /** Goes into the UPI payment as its note: the bill number. */
  note: string;
  centreName: string;
  /** 'always' in the parent corner; 'without-qr' where the QR does the job. */
  upiLink: 'always' | 'without-qr';
  children?: ReactNode;
}) {
  const link = upiLink === 'always' || !details.qrImage ? upiPayLink(details, amount, note, centreName) : '';
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {details.qrImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={details.qrImage} alt="UPI QR code" className="h-44 w-44 shrink-0 self-center rounded-xl border border-ink-200 bg-white object-contain p-1 sm:self-start" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="divide-y divide-ink-100">
          <Row label="UPI ID" value={details.upiId} copy />
          <Row label="Pay to" value={details.payeeName} />
          {hasBank(details) ? (
            <>
              <Row label="Account name" value={details.accountName} />
              <Row label="Account number" value={details.accountNumber} copy />
              <Row label="IFSC" value={details.ifsc} copy />
              <Row label="Bank and branch" value={[details.bank, details.branch].filter(Boolean).join(', ')} />
            </>
          ) : null}
        </div>
        {link ? (
          // A upi:// link only opens on a phone with a UPI app, so it is offered on small screens.
          <a href={link} className={buttonClass('primary', 'md', 'no-print mt-3 w-full lg:hidden')}>
            <Smartphone size={18} /> Pay by UPI app
          </a>
        ) : null}
        {details.note ? <p className="mt-3 text-sm text-ink-600">{details.note}</p> : null}
        {children}
      </div>
    </div>
  );
}
