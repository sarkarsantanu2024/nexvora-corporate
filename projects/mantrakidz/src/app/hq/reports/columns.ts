/**
 * The columns of each network report, written once: the screen draws its
 * table from them and the CSV export writes the same columns.
 */
import { ENQUIRY_STAGES, PAYMENT_METHODS } from '@/db/schema';
import { inr } from '@/lib/money';
import { admissionsFunnel, centreComparison, collectionByMethod, royaltySummary, type ComparisonRow, type FunnelRow, type MethodRow, type Range, type RoyaltySummaryRow } from '@/server/hq/reports';

export type Column<T> = { header: string; value: (row: T) => string | number; money?: boolean; text?: boolean; suffix?: string };
export type Report<T> = { title: string; note: string; columns: Column<T>[]; rows: T[]; totals: T };

const word = (value: string) => value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const METHOD_NAMES: Record<string, string> = { cash: 'Cash', upi: 'UPI', bank: 'Bank transfer', cheque: 'Cheque', card: 'Card' };

export const REPORTS = [
  { key: 'centres', label: 'Centre comparison' },
  { key: 'funnel', label: 'Admissions funnel' },
  { key: 'methods', label: 'Collection by payment method' },
  { key: 'royalty', label: 'Royalty summary' },
] as const;
export type ReportKey = (typeof REPORTS)[number]['key'];

export async function buildReport(key: ReportKey, range: Range): Promise<Report<never>> {
  const cast = <T,>(report: Report<T>) => report as unknown as Report<never>;
  if (key === 'funnel') {
    const data = await admissionsFunnel(range);
    return cast<FunnelRow>({
      title: 'Admissions funnel',
      note: 'Enquiries received in these dates, by the stage each one has reached. Conversion is admitted out of all received.',
      columns: [
        { header: 'Centre', value: (r) => r.name, text: true },
        { header: 'Enquiries', value: (r) => r.total },
        ...ENQUIRY_STAGES.map((stage) => ({ header: word(stage), value: (r: FunnelRow) => r[stage] })),
        { header: 'Conversion', value: (r) => r.conversion, suffix: '%' },
      ],
      ...data,
    });
  }
  if (key === 'methods') {
    const data = await collectionByMethod(range);
    return cast<MethodRow>({
      title: 'Collection by payment method',
      note: 'Fees received in these dates, by how they were paid. Cancelled receipts are left out.',
      columns: [
        { header: 'Centre', value: (r) => r.name, text: true },
        ...PAYMENT_METHODS.map((method) => ({ header: METHOD_NAMES[method], value: (r: MethodRow) => r[method], money: true })),
        { header: 'Total', value: (r) => r.total, money: true },
      ],
      rows: data.rows,
      totals: data.totals,
    });
  }
  if (key === 'royalty') {
    const data = await royaltySummary(range);
    return cast<RoyaltySummaryRow>({
      title: 'Royalty summary',
      note: 'Raised is for the months inside these dates; received is money that came in during them. Outstanding and overdue are as of today, across all months.',
      columns: [
        { header: 'Code', value: (r) => r.code, text: true },
        { header: 'Centre', value: (r) => r.name, text: true },
        { header: 'Raised', value: (r) => r.raised, money: true },
        { header: 'Received', value: (r) => r.received, money: true },
        { header: 'Outstanding', value: (r) => r.outstanding, money: true },
        { header: 'Overdue', value: (r) => r.overdue, money: true },
      ],
      ...data,
    });
  }
  const data = await centreComparison(range);
  return cast<ComparisonRow>({
    title: 'Centre comparison',
    note: 'Children on roll, seats and fee dues are as of today. Admissions, withdrawals, collection, expenses and royalty are for the dates chosen.',
    columns: [
      { header: 'Code', value: (r) => r.code, text: true },
      { header: 'Centre', value: (r) => r.name, text: true },
      { header: 'On roll', value: (r) => r.onRoll },
      { header: 'Seats filled', value: (r) => r.seatsFilled, suffix: '%' },
      { header: 'Admissions', value: (r) => r.admissions },
      { header: 'Withdrawals', value: (r) => r.withdrawals },
      { header: 'Collection', value: (r) => r.collection, money: true },
      { header: 'Fee dues', value: (r) => r.dues, money: true },
      { header: 'Expenses', value: (r) => r.expenses, money: true },
      { header: 'Surplus', value: (r) => r.surplus, money: true },
      { header: 'Royalty raised', value: (r) => r.royaltyRaised, money: true },
      { header: 'Royalty received', value: (r) => r.royaltyReceived, money: true },
    ],
    ...data,
  });
}

/** How a cell reads on screen. A minus sits before the rupee sign. */
export function show<T>(column: Column<T>, row: T): string {
  const value = column.value(row);
  if (typeof value !== 'number') return value;
  if (column.money) return value < 0 ? `-${inr(-value)}` : inr(value);
  return `${value.toLocaleString('en-IN')}${column.suffix ?? ''}`;
}
