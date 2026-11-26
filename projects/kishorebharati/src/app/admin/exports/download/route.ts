/** The government exports as CSV files for Excel and the state portals. Office only. */
import { handle } from '@/lib/api';
import { TEAM_ROLES, apiSession } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { exportSheet, toCsv } from '@/server/office/exports';
import { assertPlan } from '@/server/platform';

export const GET = handle(async (req) => {
  const session = await apiSession(TEAM_ROLES);
  await assertPlan('platinum');
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const { sheet, name } = await exportSheet(session, params.kind ?? '', params);
  return new Response(toCsv(sheet), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-${todayIST()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});
