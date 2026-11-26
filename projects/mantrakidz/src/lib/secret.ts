import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Does the request carry `Authorization: Bearer <value of env var>`?
 *
 * Used by the two addresses that no person logs in to: the daily job
 * (CRON_SECRET, sent by Vercel itself) and Nexvora's control address
 * (PLATFORM_SECRET). A key shorter than 32 characters counts as not set,
 * so a weak key can never open them. Compared in constant time.
 */
export function bearerMatches(req: Request, envName: string): boolean {
  const expected = process.env[envName] ?? '';
  if (expected.length < 32) return false;
  const header = req.headers.get('authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  // Hashing first makes both sides the same length, as timingSafeEqual needs.
  const digest = (text: string) => createHash('sha256').update(text).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
