/** CSV downloads for the fees screens: ?type=dues or ?type=daybook&day=YYYY-MM-DD. */
import { ApiError, handle } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';
import { todayIST } from '@/lib/date';
import { listDues } from '@/server/centre/money/bills';
import { METHOD_LABELS } from '@/server/centre/money/labels';
import { dayBook } from '@/server/centre/money/payments';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  const url = new URL(req.url);
  const type = url.searchParams.get('type');

  if (type === 'dues') {
    const rows = await listDues(ctx, {
      sort: url.searchParams.get('sort') ?? '',
      batch: url.searchParams.get('batch') ?? '',
      q: url.searchParams.get('q') ?? '',
    });
    return csvResponse(
      `dues-${todayIST()}.csv`,
      toCsv(rows, [
        { header: 'Child', value: (r) => r.name },
        { header: 'Admission no', value: (r) => r.admissionNo },
        { header: 'Class', value: (r) => r.batchName },
        { header: 'Father', value: (r) => r.fatherName },
        { header: 'Mother', value: (r) => r.motherName },
        { header: 'Mobile', value: (r) => r.guardianPhone },
        { header: 'Bills pending', value: (r) => r.bills },
        { header: 'Pending for', value: (r) => r.pending.join('; ') },
        { header: 'Oldest due date', value: (r) => r.oldestDue },
        { header: 'Total due', value: (r) => r.due },
      ]),
    );
  }

  if (type === 'daybook') {
    const book = await dayBook(ctx, url.searchParams.get('day') ?? '');
    return csvResponse(
      `day-book-${book.day}.csv`,
      toCsv(book.rows, [
        { header: 'Receipt no', value: (r) => r.receiptNo },
        { header: 'Date', value: (r) => r.paidOn },
        { header: 'Child', value: (r) => r.studentName },
        { header: 'Admission no', value: (r) => r.admissionNo },
        { header: 'For', value: (r) => r.title },
        { header: 'Bill no', value: (r) => r.invoiceNo },
        { header: 'Method', value: (r) => METHOD_LABELS[r.method] },
        { header: 'Reference', value: (r) => r.reference },
        { header: 'Received by', value: (r) => r.receivedBy },
        { header: 'Amount', value: (r) => r.amount },
        { header: 'Void', value: (r) => (r.voidedAt ? 'Void' : '') },
      ]),
    );
  }

  throw new ApiError(400, 'Unknown export');
});
