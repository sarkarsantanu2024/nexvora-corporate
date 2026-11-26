'use client';

/**
 * Student ID cards, 88 × 56 mm, ten to an A4 sheet (two across, five down)
 * with dashed cut lines. Untick a student to leave his card out.
 */
import { Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, Button, Card } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { formatDate } from '@/lib/date';

export type CardStudent = {
  id: string;
  name: string;
  nameBn: string;
  photo: string;
  admissionNo: string;
  bloodGroup: string;
  phone: string;
  dob: string | null;
  rollNo: number | null;
  className: string;
};

type School = { name: string; nameBn: string; address: string; phone: string; udise: string };

const PER_SHEET = 10;

function IdCardFace({ card, school, year }: { card: CardStudent; school: School; year: string }) {
  const t = useT();
  return (
    <div className="idc-card relative flex flex-col overflow-hidden bg-white text-ink-900">
      <div className="idc-band flex items-center gap-[1.5mm] bg-brand-700 px-[2mm] py-[1.2mm] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" className="h-[8mm] w-[8mm] shrink-0 rounded-full bg-white object-contain p-[0.4mm]" />
        <div className="min-w-0 flex-1 text-center leading-tight">
          {school.nameBn ? <p className="truncate text-[9pt] font-bold">{school.nameBn}</p> : null}
          <p className="truncate text-[5.5pt] font-semibold">{school.name}</p>
          <p className="truncate text-[4.8pt] opacity-90">{school.address}</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-[2mm] px-[2mm] pt-[1.5mm]">
        <div className="h-[24mm] w-[19mm] shrink-0 overflow-hidden rounded-[1mm] border border-ink-300 bg-ink-50">
          {card.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <Avatar name={card.name} size={44} />
            </div>
          )}
        </div>
        <dl className="min-w-0 flex-1 space-y-[0.35mm] text-[6.5pt] leading-tight">
          <p className="truncate text-[8.5pt] font-bold">{card.name}</p>
          {card.nameBn ? <p className="truncate text-[7pt] font-semibold">{card.nameBn}</p> : null}
          <Row label={t('Class')} value={card.className} />
          <Row label={t('Roll')} value={card.rollNo ? String(card.rollNo) : ''} />
          <Row label={t('Adm. no.')} value={card.admissionNo} />
          <Row label={t('Date of birth')} value={card.dob ? formatDate(card.dob) : ''} />
          <Row label={t('Blood group')} value={card.bloodGroup} />
          <Row label={t('Guardian mobile')} value={card.phone} />
        </dl>
      </div>
      <div className="flex items-end justify-between px-[2mm] pb-[1.2mm] text-[5.5pt] text-ink-600">
        <span>
          {t('Session')} {year}
        </span>
        <span className="border-t border-ink-400 px-[1mm] pt-[0.3mm]">{t('Headmaster')}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-[1mm]">
      <dt className="shrink-0 text-ink-500">{label}:</dt>
      <dd className="tabular min-w-0 truncate font-semibold">{value}</dd>
    </div>
  );
}

export function IdCardSheet({ cards, school, year }: { cards: CardStudent[]; school: School; year: string }) {
  const t = useT();
  const [left, setLeft] = useState<Set<string>>(new Set());
  const chosen = useMemo(() => cards.filter((card) => !left.has(card.id)), [cards, left]);
  const sheets = useMemo(() => Array.from({ length: Math.ceil(chosen.length / PER_SHEET) }, (_, i) => chosen.slice(i * PER_SHEET, (i + 1) * PER_SHEET)), [chosen]);
  const toggle = (id: string) =>
    setLeft((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <style>{`
        .idc-sheet { display: grid; grid-template-columns: repeat(2, 88mm); grid-auto-rows: 56mm; width: 176mm; }
        .idc-card { width: 88mm; height: 56mm; outline: 0.2mm dashed #9ca3af; outline-offset: -0.1mm; }
        .idc-band { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          @page { size: A4 portrait; margin: 8mm 17mm; }
          .dash-app { padding-left: 0 !important; }
          main { padding: 0 !important; max-width: none !important; }
          .page-header { display: none !important; }
          .idc-scroll { overflow: visible !important; }
          .idc-sheet { break-after: page; margin: 0 auto; }
          .idc-sheet:last-child { break-after: auto; }
        }
      `}</style>

      {cards.length > 1 ? (
        <Card className="no-print mb-4 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-700">{t('{n} of {total} cards chosen', { n: chosen.length, total: cards.length })}</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setLeft(new Set())}>
                {t('Tick all')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLeft(new Set(cards.map((c) => c.id)))}>
                {t('Untick all')}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {cards.map((card) => (
              <label key={card.id} className="inline-flex items-center gap-2 text-sm text-ink-800">
                <input type="checkbox" checked={!left.has(card.id)} onChange={() => toggle(card.id)} className="h-4 w-4 accent-brand-700" />
                <span className="tabular text-ink-500">{card.rollNo ?? ''}</span> {card.name}
              </label>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="no-print mb-4 flex justify-end">
        <Button onClick={() => window.print()} disabled={!chosen.length}>
          <Printer size={18} /> {t('Print {n} cards', { n: chosen.length })}
        </Button>
      </div>

      <div className="idc-scroll overflow-x-auto">
        {sheets.map((sheet, i) => (
          <div key={i} className="idc-sheet mb-6 print:mb-0">
            {sheet.map((card) => (
              <IdCardFace key={card.id} card={card} school={school} year={year} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
