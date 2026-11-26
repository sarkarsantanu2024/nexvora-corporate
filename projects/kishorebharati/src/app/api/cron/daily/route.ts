/**
 * Called by Vercel once a day (see vercel.json). Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` by itself when the CRON_SECRET
 * variable is set on the project; any other caller is turned away.
 */
import { NextResponse } from 'next/server';
import { handle, ok } from '@/lib/api';
import { bearerMatches } from '@/lib/secret';
import { runDailyJobs } from '@/server/jobs';

export const dynamic = 'force-dynamic';
// The jobs touch the database a few times each; give them room on a cold start.
export const maxDuration = 60;

export const GET = handle(async (req) => {
  if (!bearerMatches(req, 'CRON_SECRET')) return NextResponse.json({ ok: false, error: 'Not allowed' }, { status: 401 });
  return ok({ ran: await runDailyJobs() });
});
