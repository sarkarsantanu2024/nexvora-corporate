/** The children list as a CSV file, with the same filters as the screen. */
import { handle } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { toCsv, csvResponse } from '@/lib/csv';
import { formatDate, todayIST } from '@/lib/date';
import { statusLabel } from '@/components/ui/core';
import { exportStudents } from '@/server/centre/children/students';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  const params = new URL(req.url).searchParams;
  const rows = await exportStudents(ctx, {
    q: params.get('q') ?? undefined,
    batch: params.get('batch') ?? undefined,
    programme: params.get('programme') ?? undefined,
    status: params.get('status') ?? undefined,
  });
  const csv = toCsv(rows, [
    { header: 'Admission no.', value: (r) => r.admissionNo },
    { header: 'Child', value: (r) => r.name },
    { header: 'Programme', value: (r) => r.programmeName },
    { header: 'Class', value: (r) => r.batchName },
    { header: 'Date of birth', value: (r) => formatDate(r.dob) },
    { header: 'Gender', value: (r) => r.gender },
    { header: 'Admission date', value: (r) => formatDate(r.admissionDate) },
    { header: 'Father', value: (r) => r.fatherName },
    { header: 'Mother', value: (r) => r.motherName },
    { header: 'Guardian mobile', value: (r) => r.guardianPhone },
    { header: 'Other mobile', value: (r) => r.altPhone },
    { header: 'Address', value: (r) => r.address },
    { header: 'Status', value: (r) => statusLabel(r.status) },
  ]);
  return csvResponse(`children-${ctx.centre.code}-${todayIST()}.csv`, csv);
});
