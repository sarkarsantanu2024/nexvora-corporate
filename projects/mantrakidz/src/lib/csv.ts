/** CSV export that opens cleanly in Excel (BOM, quoted cells, formula-safe). */
export type CsvColumn<T> = { header: string; value: (row: T) => string | number | null | undefined };

function cell(value: string | number | null | undefined): string {
  let text = value == null ? '' : String(value);
  // A text cell starting with = + - @ would run as a formula in Excel.
  if (typeof value !== 'number' && /^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => cell(c.header)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(','));
  return `﻿${lines.join('\r\n')}`;
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename.replace(/[^\w.\-]/g, '_')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
