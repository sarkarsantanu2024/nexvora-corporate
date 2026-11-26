import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { METHOD_LABELS, rupeesInWords } from '@/server/money/labels';
import type { ReceiptData } from '@/server/money/payments';
import { billName, classOf } from '../shared';

/**
 * The paper receipt. Sized for half an A4 sheet; the same component serves
 * the office and the parents' corner.
 */
export async function ReceiptSheet({ receipt }: { receipt: ReceiptData }) {
  const t = await getT();
  const lang = await getLang();
  const { school, student } = receipt;
  const numbers = receipt.lines.map((line) => line.receiptNo);
  const place = classOf(student, lang);

  return (
    <div className="receipt-sheet print-plain relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-7">
      {receipt.voided ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className="-rotate-12 rounded-xl border-[6px] border-accent-500/70 px-8 py-1 font-display text-6xl font-extrabold tracking-widest text-accent-500/70">{t('VOID')}</span>
        </div>
      ) : null}

      <div className="flex items-center gap-3 border-b-2 border-ink-900 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" width={52} height={52} className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14" />
        <div className="min-w-0 flex-1">
          {school.nameBn ? <p className="font-display text-lg font-bold leading-tight text-ink-900 sm:text-xl">{school.nameBn}</p> : null}
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-800 sm:text-sm">{school.name}</p>
          <p className="text-xs text-ink-600">{[school.addressBn || school.address, school.udise ? t('UDISE {code}', { code: school.udise }) : ''].filter(Boolean).join(' · ')}</p>
        </div>
        <p className="hidden shrink-0 rounded-lg bg-ink-900 px-3 py-1 text-sm font-bold uppercase tracking-wider text-white sm:block">{t('Fee receipt')}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Receipt no')}</dt>
          <dd className="tabular font-bold text-ink-900">{numbers.join(', ')}</dd>
        </div>
        <div className="text-right">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Date')}</dt>
          <dd className="font-bold text-ink-900">{formatDate(receipt.paidOn)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Received from')}</dt>
          <dd className="font-bold text-ink-900">{student.name}</dd>
          {student.fatherName ? <dd className="text-xs text-ink-600">{t('Father: {name}', { name: student.fatherName })}</dd> : null}
        </div>
        <div className="text-right">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Class, roll and admission no')}</dt>
          <dd className="text-ink-900">{[place, student.rollNo ? t('Roll {n}', { n: student.rollNo }) : '', student.admissionNo].filter(Boolean).join(' · ')}</dd>
        </div>
      </dl>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-ink-300 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <th className="py-2 pr-3">{t('Towards')}</th>
            <th className="py-2 pr-3">{t('Receipt')}</th>
            <th className="py-2 text-right">{t('Amount')}</th>
          </tr>
        </thead>
        <tbody>
          {receipt.lines.map((line) => (
            <tr key={line.id} className={`border-b border-ink-100 ${line.voidedAt ? 'text-ink-400' : 'text-ink-900'}`}>
              <td className="py-2 pr-3">
                <span className={line.voidedAt ? 'line-through' : 'font-medium'}>{billName(line, t)}</span>
                <span className="block text-xs text-ink-500">
                  {t('Bill {invoiceNo}', { invoiceNo: line.invoiceNo })}
                  {line.voidedAt ? ` · ${t('Void: {reason}', { reason: line.voidReason })}` : line.billBalance > 0 ? ` · ${t('{amount} still due on this bill', { amount: inr(line.billBalance) })}` : ''}
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
              {t('Amount received')}
            </td>
            <td className="tabular pt-3 text-right font-display text-2xl font-bold text-ink-900">{inr(receipt.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-1 text-sm text-ink-700">
        <span className="font-semibold">{t('In words:')}</span> {rupeesInWords(receipt.amount)}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink-200 pt-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Paid by')}</dt>
          <dd className="text-ink-900">
            {t(METHOD_LABELS[receipt.method])}
            {receipt.reference ? ` · ${receipt.reference}` : ''}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Balance still due')}</dt>
          <dd className={`tabular font-bold ${receipt.balanceDue > 0 ? 'text-accent-600' : 'text-ink-900'}`}>{receipt.balanceDue > 0 ? inr(receipt.balanceDue) : t('Nil')}</dd>
        </div>
        {receipt.note ? (
          <div className="col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Note')}</dt>
            <dd className="text-ink-900">{receipt.note}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-8 flex items-end justify-between gap-6 text-sm">
        <p className="max-w-[60%] text-xs text-ink-500">{receipt.footer}</p>
        <div className="text-right">
          <p className="font-medium text-ink-900">{receipt.receivedBy}</p>
          <p className="mt-0.5 border-t border-ink-400 pt-1 text-xs text-ink-500">{t('Received by')}</p>
        </div>
      </div>
    </div>
  );
}
