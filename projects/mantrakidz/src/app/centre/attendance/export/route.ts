/** The monthly register of one class as a CSV file. */
import { handle } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { csvResponse, toCsv, type CsvColumn } from '@/lib/csv';
import { monthlyRegister } from '@/server/centre/children/attendance';
import { ATTENDANCE_LETTER } from '@/server/centre/children/constants';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  const params = new URL(req.url).searchParams;
  const register = await monthlyRegister(ctx, { period: params.get('month') ?? '', batchId: params.get('batch') ?? '' });
  type Row = (typeof register.rows)[number];

  const columns: CsvColumn<Row>[] = [
    { header: 'Admission no.', value: (r) => r.admissionNo },
    { header: 'Child', value: (r) => r.name },
    ...register.days.map((d, i): CsvColumn<Row> => ({ header: String(Number(d.slice(8))), value: (r) => (r.marks[i] ? ATTENDANCE_LETTER[r.marks[i]] : '') })),
    { header: 'Present', value: (r) => r.present },
    { header: 'Absent', value: (r) => r.absent },
    { header: 'Leave', value: (r) => r.leave },
    { header: 'Holiday', value: (r) => r.holiday },
    { header: 'Percent', value: (r) => (r.present + r.absent + r.leave ? r.percent : '') },
  ];
  return csvResponse(`attendance-${register.batch.name}-${register.period}.csv`, toCsv(register.rows, columns));
});
