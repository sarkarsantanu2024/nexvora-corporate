import { ApiError, handle } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';
import { formatDate, periodLabel } from '@/lib/date';
import { period as periodSchema } from '@/lib/validators';
import { listRoyalty } from '@/server/hq/royalty';

export const GET = handle(async (req) => {
  await apiSession(HQ_ROLES);
  const parsed = periodSchema.safeParse(new URL(req.url).searchParams.get('period'));
  if (!parsed.success) throw new ApiError(400, 'Pick a month');
  const { rows, totals } = await listRoyalty(parsed.data);
  const csv = toCsv(
    [...rows, { centreCode: '', centreName: 'Total', ownerName: '', basisAmount: totals.basis, royaltyType: null, royaltyValue: null, amount: totals.amount, paid: totals.paid, balance: totals.balance, status: '', dueDate: '', overdue: false }],
    [
      { header: 'Code', value: (r) => r.centreCode },
      { header: 'Centre', value: (r) => r.centreName },
      { header: 'Owner', value: (r) => r.ownerName },
      { header: 'Month', value: () => periodLabel(parsed.data) },
      { header: 'Fee collection', value: (r) => r.basisAmount },
      { header: 'Royalty type', value: (r) => (r.royaltyType === 'fixed' ? 'Fixed' : r.royaltyType === 'percent' ? 'Percent' : '') },
      { header: 'Rate', value: (r) => r.royaltyValue },
      { header: 'Royalty', value: (r) => r.amount },
      { header: 'Paid', value: (r) => r.paid },
      { header: 'Balance', value: (r) => r.balance },
      { header: 'Status', value: (r) => r.status },
      { header: 'Due date', value: (r) => formatDate(r.dueDate) },
      { header: 'Overdue', value: (r) => (r.overdue ? 'Yes' : '') },
    ],
  );
  return csvResponse(`royalty-${parsed.data}.csv`, csv);
});
