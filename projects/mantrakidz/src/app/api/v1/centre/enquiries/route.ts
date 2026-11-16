/** GET the enquiries of this centre, POST to add one. */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { createEnquiry, listEnquiries } from '@/server/centre/children/enquiries';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  const q = new URL(req.url).searchParams;
  return ok(
    await listEnquiries(ctx, {
      stage: q.get('stage') ?? undefined,
      q: q.get('q') ?? undefined,
      source: q.get('source') ?? undefined,
      due: q.get('due') === '1',
      page: Number(q.get('page')) || 1,
    }),
  );
});

export const POST = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await createEnquiry(ctx, await req.json()), { status: 201 });
});
