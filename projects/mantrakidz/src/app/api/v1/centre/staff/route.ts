/** GET the staff list, POST to add a staff member. Centre heads and head office admin only. */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { createStaff, listStaff } from '@/server/centre/children/staff';

export const GET = handle(async () => {
  const ctx = await apiCentre();
  return ok(await listStaff(ctx));
});

export const POST = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await createStaff(ctx, await req.json()), { status: 201 });
});
