/**
 * The top of a printed register or timetable: the school's seal, its Bengali
 * and English names, address and UDISE code (from Settings), then what the
 * sheet is. Shown only on paper.
 */
import { getSetting } from '@/server/admin/shared';

/** Paper size for the page, and no room kept for the sidebar on paper. */
export function PrintSetup({ landscape = false }: { landscape?: boolean }) {
  return (
    <style>{`@media print { @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 8mm; } .dash-app { padding-left: 0 !important; } main { padding: 0 !important; max-width: none !important; } }`}</style>
  );
}

export async function DailyPrintHead({ title, subtitle }: { title: string; subtitle?: string }) {
  const school = (await getSetting('school')).high;
  return (
    <div className="hidden border-b border-ink-300 pb-2 print:mb-3 print:block">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" width={52} height={52} className="h-[52px] w-[52px] object-contain" />
        <div className="min-w-0 flex-1 text-center">
          {school.nameBn ? <p className="text-lg font-bold leading-tight text-ink-900">{school.nameBn}</p> : null}
          <p className="text-sm font-semibold leading-tight text-ink-900">{school.name}</p>
          <p className="text-[11px] leading-tight text-ink-700">
            {[school.address, school.udise ? `UDISE ${school.udise}` : ''].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="w-[52px]" aria-hidden />
      </div>
      <p className="mt-2 text-center text-sm font-bold text-ink-900">{title}</p>
      {subtitle ? <p className="text-center text-xs text-ink-700">{subtitle}</p> : null}
    </div>
  );
}
