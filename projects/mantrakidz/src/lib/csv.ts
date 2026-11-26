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
  return `\uFEFF${lines.join('\r\n')}`;
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

/* ───────────── reading a sheet back in (imports) ───────────── */

/**
 * Reads a spreadsheet saved as CSV, or cells copied from Excel or Google
 * Sheets and pasted (those arrive separated by tabs). Quoted cells may hold
 * commas, line breaks and doubled quotes, as Excel writes them.
 *
 *   parseCsv('Name,Mobile\nAsha,98300 12345') → [['Name','Mobile'],['Asha','98300 12345']]
 *
 * Empty lines are dropped and every cell is trimmed.
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? undefined : text.indexOf('\n'));
  const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell.trim() === '') {
      quoted = true;
      cell = '';
    } else if (ch === delimiter) {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n') {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell.trim());
  rows.push(row);
  return rows.filter((cells) => cells.some((value) => value !== ''));
}

/** "Mobile No." → "mobileno", for matching a sheet's headings to our fields. */
export const headingKey = (text: string) => text.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff\u0900-\u097f]/g, '');

/**
 * A date as a spreadsheet writes it, as 'YYYY-MM-DD'. Takes 2021-05-04 and
 * the Indian order 04-05-2021, 04/05/2021 or 4.5.21 (day first). '' for an
 * empty cell, null for something that is not a real date.
 */
export function sheetDate(input: string): string | '' | null {
  const text = input.trim();
  if (!text) return '';
  let y: number;
  let m: number;
  let d: number;
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  const indian = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (indian) {
    [d, m, y] = [Number(indian[1]), Number(indian[2]), Number(indian[3])];
    // A two-digit year is this century unless that would put it in the future.
    if (y < 100) y += y + 2000 > new Date().getFullYear() ? 1900 : 2000;
  } else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
