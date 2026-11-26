/**
 * The school's letterhead for certificates and other single papers: seal,
 * Bengali and English names, address, UDISE code and phone (from Settings).
 * Unlike a register's print head it shows on screen too, so the paper can be
 * checked before printing.
 */
import { getSetting } from '@/server/admin/shared';

export async function SchoolLetterhead({ compact = false }: { compact?: boolean }) {
  const school = (await getSetting('school')).high;
  const size = compact ? 44 : 64;
  return (
    <div className="flex items-center gap-3 border-b-2 border-ink-800 pb-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark.png" alt="" width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />
      <div className="min-w-0 flex-1 text-center">
        {school.nameBn ? <p className={compact ? 'text-base font-bold leading-tight text-ink-900' : 'text-xl font-bold leading-tight text-ink-900'}>{school.nameBn}</p> : null}
        <p className={compact ? 'text-xs font-semibold leading-tight text-ink-900' : 'text-[15px] font-semibold leading-tight text-ink-900'}>{school.name}</p>
        <p className="mt-0.5 text-[11px] leading-tight text-ink-700">{[school.address, school.udise ? `UDISE ${school.udise}` : '', school.phone].filter(Boolean).join(' · ')}</p>
        {!compact && school.board ? <p className="text-[11px] leading-tight text-ink-600">{school.board}</p> : null}
      </div>
      <span className="shrink-0" style={{ width: size }} aria-hidden />
    </div>
  );
}
