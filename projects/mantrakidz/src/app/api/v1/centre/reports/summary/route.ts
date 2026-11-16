/** GET ?period=YYYY-MM: collection, expenses and surplus of one month. Managers only (checked in the service). */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { currentPeriod } from '@/lib/date';
import { monthSummary } from '@/server/centre/money/reports';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await monthSummary(ctx, new URL(req.url).searchParams.get('period') || currentPeriod()));
});
