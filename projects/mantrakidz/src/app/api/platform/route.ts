/**
 * Nexvora's control address for this client's app. No person logs in here:
 * the request carries `Authorization: Bearer <PLATFORM_SECRET>`.
 *
 *   GET   what plan the client is on, whether the account runs, and a few
 *         counts that show the app is being used
 *   POST  { plan?, status?, note? }  change the plan, pause the account
 *         ('suspended') or switch it back on ('active')
 *
 * Without PLATFORM_SECRET (32 characters or more) on the server, this
 * address answers "not found" to everyone.
 */
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { BRAND } from '@/config/brand';
import { getDb } from '@/db';
import { centres, students, users } from '@/db/schema';
import { handle, ok } from '@/lib/api';
import { bearerMatches } from '@/lib/secret';
import { getSetting } from '@/server/hq/shared';
import { getPlatform, updatePlatform } from '@/server/platform';

export const dynamic = 'force-dynamic';

const notFound = () => NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
const count = sql<number>`count(*)::int`;

export const GET = handle(async (req) => {
  if (!bearerMatches(req, 'PLATFORM_SECRET')) return notFound();
  const db = await getDb();
  const [platform, jobs, [logins], [lastLogin], [schools], [children]] = await Promise.all([
    getPlatform(),
    getSetting('jobs'),
    db.select({ n: count }).from(users).where(eq(users.active, true)),
    db.select({ at: users.lastLoginAt }).from(users).where(sql`${users.lastLoginAt} is not null`).orderBy(desc(users.lastLoginAt)).limit(1),
    // The figure the monthly care fee is charged on: schools that are not samples.
    db.select({ n: count }).from(centres).where(and(isNull(centres.deletedAt), eq(centres.isDemo, false))),
    db.select({ n: count }).from(students).where(and(isNull(students.deletedAt), eq(students.status, 'active'))),
  ]);
  return ok({
    app: BRAND.name,
    plan: platform.plan,
    status: platform.status,
    note: platform.note,
    changedAt: platform.changedAt,
    usage: { activeLogins: logins.n, lastLoginAt: lastLogin?.at ?? null, schools: schools.n, childrenOnRoll: children.n },
    dailyJob: { lastRunAt: jobs.lastRunAt || null },
  });
});

export const POST = handle(async (req) => {
  if (!bearerMatches(req, 'PLATFORM_SECRET')) return notFound();
  const next = await updatePlatform(await req.json());
  return ok({ plan: next.plan, status: next.status, note: next.note, changedAt: next.changedAt });
});
