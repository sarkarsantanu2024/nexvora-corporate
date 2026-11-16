/** GET the sheet for ?day=&batch=, PUT to save it. Saving a day again replaces its marks. */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { attendanceSheet, saveAttendance } from '@/server/centre/children/attendance';

const target = (req: Request) => {
  const q = new URL(req.url).searchParams;
  return { day: q.get('day') ?? '', batchId: q.get('batch') ?? '' };
};

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await attendanceSheet(ctx, target(req)));
});

export const PUT = handle(async (req) => {
  const ctx = await apiCentre();
  const body = (await req.json()) as { marks?: unknown };
  return ok(await saveAttendance(ctx, { ...target(req), marks: body.marks } as Parameters<typeof saveAttendance>[1]));
});
