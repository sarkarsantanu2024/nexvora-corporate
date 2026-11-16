/** GET the children list (same filters as the screen), POST to admit a child. */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { admitStudent, listStudents } from '@/server/centre/children/students';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  const q = new URL(req.url).searchParams;
  return ok(
    await listStudents(ctx, {
      q: q.get('q') ?? undefined,
      batch: q.get('batch') ?? undefined,
      programme: q.get('programme') ?? undefined,
      status: q.get('status') ?? undefined,
      page: Number(q.get('page')) || 1,
    }),
  );
});

export const POST = handle(async (req) => {
  const ctx = await apiCentre();
  const { enquiryId, ...input } = await req.json();
  return ok(await admitStudent(ctx, input, { enquiryId }), { status: 201 });
});
