/**
 * A small per-visitor limit for the public forms, so a script cannot flood
 * the enquiry tables. Counts live in memory: enough to stop a casual bot on
 * one server. (On several serverless instances each keeps its own count; a
 * shared store would be needed for a hard limit.)
 */
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

/** True once the same visitor has used `form` `max` times within a minute. Counts the call when it is allowed. */
export function overLimit(req: Request, form: string, max = 5): boolean {
  const key = `${form}:${clientIp(req)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing for ever on a long-running server.
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((at) => now - at >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}
