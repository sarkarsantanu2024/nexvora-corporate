import { formatDate } from '@/lib/date';
import { inr } from '@/lib/money';
import { METHOD_LABELS, rupeesInWords } from '@/server/centre/money/labels';
import type { ReceiptData } from '@/server/centre/money/payments';

/**
 * The paper receipt. Sized to sit on half an A4 sheet; the same component
 * prints for the centre and shows in the parent corner.
 */
export function ReceiptSheet({ receipt }: { receipt: ReceiptData }) {
  const { centre, student } = receipt;
  const address = [centre.address, centre.area, centre.city, centre.pincode].filter(Boolean).join(', ');
  const numbers = receipt.lines.map((line) => line.receiptNo);

  return (
    <div className="print-plain relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-7">
      {receipt.voided ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className="-rotate-12 rounded-xl border-[6px] border-accent-500/70 px-8 py-1 font-display text-7xl font-extrabold tracking-widest text-accent-500/70">VOID</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink-900 pb-3">
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold leading-tight text-ink-900">{centre.name}</p>
          {address ? <p className="text-sm text-ink-600">{address}</p> : null}
          {centre.phone ? <p className="text-sm text-ink-600">Phone {centre.phone}</p> : null}
        </div>
        <p className="rounded-lg bg-ink-900 px-3 py-1 text-sm font-bold uppercase tracking-wider text-white">Fee receipt</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Receipt no</dt>
          <dd className="tabular font-bold text-ink-900">{numbers.length > 1 ? `${numbers[0]} to ${numbers[numbers.length - 1].split('/').pop()}` : numbers[0]}</dd>
        </div>
        <div className="text-right">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Date</dt>
          <dd className="font-bold text-ink-900">{formatDate(receipt.paidOn)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Received from</dt>
          <dd className="font-bold text-ink-900">{student.name}</dd>
        </div>
        <div className="text-right">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Class and admission no</dt>
          <dd className="text-ink-900">
            {student.batchName ?? 'No class'} · {student.admissionNo}
          </dd>
        </div>
      </dl>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-ink-300 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <th className="py-2 pr-3">Towards</th>
            <th className="py-2 pr-3">Receipt</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.lines.map((line) => (
            <tr key={line.id} className={`border-b border-ink-100 ${line.voidedAt ? 'text-ink-400' : 'text-ink-900'}`}>
              <td className="py-2 pr-3">
                <span className={line.voidedAt ? 'line-through' : 'font-medium'}>{line.title}</span>
                <span className="block text-xs text-ink-500">
                  Bill {line.invoiceNo}
                  {line.voidedAt ? ` · Void: ${line.voidReason}` : line.billBalance > 0 ? ` · ${inr(line.billBalance)} still due on this bill` : ''}
                </span>
              </td>
              <td className="tabular whitespace-nowrap py-2 pr-3 align-top">{line.receiptNo}</td>
              <td className={`tabular py-2 text-right align-top font-semibold ${line.voidedAt ? 'line-through' : ''}`}>{inr(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="pt-3 text-right font-semibold text-ink-700">
              Amount received
            </td>
            <td className="tabular pt-3 text-right font-display text-2xl font-bold text-ink-900">{inr(receipt.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-1 text-sm text-ink-700">
        <span className="font-semibold">In words:</span> {rupeesInWords(receipt.amount)}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink-200 pt-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Paid by</dt>
          <dd className="text-ink-900">
            {METHOD_LABELS[receipt.method]}
            {receipt.reference ? ` · ${receipt.reference}` : ''}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Balance still due</dt>
          <dd className={`tabular font-bold ${receipt.balanceDue > 0 ? 'text-accent-600' : 'text-ink-900'}`}>{receipt.balanceDue > 0 ? inr(receipt.balanceDue) : 'Nil'}</dd>
        </div>
        {receipt.note ? (
          <div className="col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Note</dt>
            <dd className="text-ink-900">{receipt.note}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-8 flex items-end justify-between gap-6 text-sm">
        <p className="max-w-[60%] text-xs text-ink-500">{receipt.footer}</p>
        <div className="text-right">
          <p className="font-medium text-ink-900">{receipt.receivedBy}</p>
          <p className="mt-0.5 border-t border-ink-400 pt-1 text-xs text-ink-500">Received by</p>
        </div>
      </div>
    </div>
  );
}
