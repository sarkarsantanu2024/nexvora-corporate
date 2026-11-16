import { handle } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';
import { parseRange } from '@/server/hq/reports';
import { REPORTS, buildReport, type ReportKey } from '../columns';

export const GET = handle(async (req) => {
  await apiSession(HQ_ROLES);
  const url = new URL(req.url);
  const wanted = url.searchParams.get('tab');
  const key: ReportKey = REPORTS.find((r) => r.key === wanted)?.key ?? 'centres';
  const range = parseRange({ from: url.searchParams.get('from') ?? undefined, to: url.searchParams.get('to') ?? undefined });
  const report = await buildReport(key, range);
  // Plain numbers in the file, so Excel can add them up; the % sign goes in the heading.
  const csv = toCsv(
    [...report.rows, report.totals],
    report.columns.map((column) => ({ header: column.suffix ? `${column.header} ${column.suffix}` : column.header, value: (row: never) => column.value(row) })),
  );
  return csvResponse(`${key}-report-${range.from}-to-${range.to}.csv`, csv);
});
