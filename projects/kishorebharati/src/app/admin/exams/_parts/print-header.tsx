/** The school's letterhead at the top of a printed result sheet or report card. Shown only on paper. */
import Image from 'next/image';
import { BRAND } from '@/config/brand';
import type { SchoolSettings } from '@/server/admin/shared';

export function PrintHeader({ school, title, subtitle, screen = false }: { school: SchoolSettings; title: string; subtitle?: string; screen?: boolean }) {
  const high = school.high;
  return (
    <div className={screen ? 'mb-4 border-b border-ink-300 pb-3' : 'hidden border-b border-ink-300 pb-3 print:mb-4 print:block'}>
      <div className="flex items-center gap-4">
        <Image src={BRAND.mark} alt="" width={64} height={64} className="h-16 w-16 shrink-0 object-contain" />
        <div className="min-w-0 flex-1 text-center">
          {high.nameBn ? <p className="font-display text-xl font-bold leading-tight text-ink-900">{high.nameBn}</p> : null}
          <p className="text-base font-semibold text-ink-900">{high.name}</p>
          <p className="text-xs text-ink-600">{[high.addressBn || high.address, high.udise ? `UDISE ${high.udise}` : ''].filter(Boolean).join(' · ')}</p>
          {high.addressBn && high.address ? <p className="text-xs text-ink-600">{high.address}</p> : null}
        </div>
        <div className="h-16 w-16 shrink-0" aria-hidden />
      </div>
      <p className="mt-2 text-center text-sm font-bold uppercase tracking-wide text-ink-900">{title}</p>
      {subtitle ? <p className="text-center text-sm text-ink-700">{subtitle}</p> : null}
    </div>
  );
}
