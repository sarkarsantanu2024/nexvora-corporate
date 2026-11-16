/** CSV of each report: ?report=statement|methods|ageing|admissions|attendance&from=&to= */
import { ApiError, handle } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';
import { METHOD_LABELS } from '@/server/centre/money/labels';
import { admissionsAndWithdrawals, attendanceByClass, collectionByMethod, duesAgeing, incomeStatement, rangeFrom } from '@/server/centre/money/reports';

type Line = { section: string; item: string; amount: number | string };
const lines = (rows: Line[]) =>
  toCsv(rows, [
    { header: 'Section', value: (r) => r.section },
    { header: 'Item', value: (r) => r.item },
    { header: 'Amount', value: (r) => r.amount },
  ]);

export const GET = handle(async (req) => {
  // The services refuse anyone who is not a manager; the role list here is only the first gate.
  const ctx = await apiCentre();
  const url = new URL(req.url);
  const report = url.searchParams.get('report');
  const range = rangeFrom({ from: url.searchParams.get('from') ?? '', to: url.searchParams.get('to') ?? '', month: url.searchParams.get('month') ?? '' });
  const span = `${range.from}-to-${range.to}`;

  if (report === 'statement') {
    const data = await incomeStatement(ctx, range);
    return csvResponse(
      `income-and-expenses-${span}.csv`,
      lines([
        ...data.income.map((row) => ({ section: 'Fees collected', item: row.label, amount: row.amount })),
        { section: 'Fees collected', item: 'Total collected', amount: data.collection },
        ...data.expenses.map((row) => ({ section: 'Expenses', item: row.category, amount: row.amount })),
        { section: 'Expenses', item: 'Total spent', amount: data.expenseTotal },
        { section: 'Result', item: data.surplus < 0 ? 'Shortfall' : 'Surplus', amount: data.surplus },
      ]),
    );
  }

  if (report === 'methods') {
    const data = await collectionByMethod(ctx, range);
    return csvResponse(
      `collection-by-method-${span}.csv`,
      toCsv([...data.methods.map((m) => ({ method: METHOD_LABELS[m.method], count: m.count, amount: m.amount })), { method: 'Total', count: data.count, amount: data.total }], [
        { header: 'Method', value: (r) => r.method },
        { header: 'Receipts', value: (r) => r.count },
        { header: 'Amount', value: (r) => r.amount },
      ]),
    );
  }

  if (report === 'ageing') {
    const data = await duesAgeing(ctx);
    return csvResponse(
      `dues-by-age-${data.asOf}.csv`,
      toCsv(data.rows, [
        { header: 'Child', value: (r) => r.name },
        { header: 'Admission no', value: (r) => r.admissionNo },
        { header: 'Class', value: (r) => r.batchName },
        { header: 'Mobile', value: (r) => r.guardianPhone },
        { header: 'Not yet due', value: (r) => r.notDue },
        { header: '0 to 30 days late', value: (r) => r.d0 },
        { header: '31 to 60 days late', value: (r) => r.d31 },
        { header: '61 days and more', value: (r) => r.d61 },
        { header: 'Total due', value: (r) => r.total },
      ]),
    );
  }

  if (report === 'admissions') {
    const data = await admissionsAndWithdrawals(ctx, range);
    const rows = [...data.admitted.map((r) => ({ ...r, what: 'Admitted', on: r.admissionDate })), ...data.left.map((r) => ({ ...r, what: 'Left', on: r.leftOn }))];
    return csvResponse(
      `admissions-and-withdrawals-${span}.csv`,
      toCsv(rows, [
        { header: 'What', value: (r) => r.what },
        { header: 'Date', value: (r) => r.on },
        { header: 'Child', value: (r) => r.name },
        { header: 'Admission no', value: (r) => r.admissionNo },
        { header: 'Class', value: (r) => r.batchName },
        { header: 'Reason for leaving', value: (r) => (r.what === 'Left' ? r.leftReason : '') },
      ]),
    );
  }

  if (report === 'attendance') {
    const data = await attendanceByClass(ctx, range);
    return csvResponse(
      `attendance-by-class-${span}.csv`,
      toCsv(data.rows, [
        { header: 'Class', value: (r) => r.batchName ?? 'No class' },
        { header: 'Days marked', value: (r) => r.days },
        { header: 'Present', value: (r) => r.present },
        { header: 'Absent', value: (r) => r.absent },
        { header: 'Leave', value: (r) => r.leave },
        { header: 'Attendance percent', value: (r) => r.percent },
      ]),
    );
  }

  throw new ApiError(400, 'Unknown report');
});
