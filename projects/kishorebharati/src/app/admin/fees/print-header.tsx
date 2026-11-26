/**
 * The school's heading on paper: the seal, the name in Bengali and English,
 * the address and the UDISE code. Used by receipts, bills, the day book and
 * the income and expense statement.
 */
import { getT } from '@/lib/t';
import { cn } from '@/lib/cn';
import { schoolHeader } from '@/server/money/shared';

export async function SchoolPrintHeader({ title, sub, onlyOnPaper, className }: { title?: string; sub?: string; onlyOnPaper?: boolean; className?: string }) {
  const t = await getT();
  const school = await schoolHeader();
  return (
    <div className={cn('mb-4 border-b-2 border-ink-900 pb-3', onlyOnPaper && 'hidden print:block', className)}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          {school.nameBn ? <p className="font-display text-lg font-bold leading-tight text-ink-900 sm:text-xl">{school.nameBn}</p> : null}
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-800">{school.name}</p>
          <p className="text-xs text-ink-600">{[school.addressBn || school.address, school.udise ? t('UDISE {code}', { code: school.udise }) : ''].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      {title ? (
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-base font-bold text-ink-900">{title}</p>
          {sub ? <p className="text-sm text-ink-600">{sub}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
