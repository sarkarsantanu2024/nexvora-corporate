import { getDb, type DbOrTx } from '@/db';
import { auditLog } from '@/db/schema';
import type { Session } from './session-token';

/**
 * Records who did what. Call it after every change that matters
 * (money, students, centres, logins, website publishes).
 *
 *   await audit(session, 'payment.create', {
 *     entity: 'payment', entityId, centreId, summary: '₹2,500 from Aarav Das',
 *   });
 */
export async function audit(
  /** The person; `uid: null` with a name for changes made by the system or by Nexvora. */
  session: (Pick<Session, 'name'> & { uid: string | null }) | null,
  action: string,
  details: {
    entity?: string;
    entityId?: string;
    centreId?: string | null;
    summary?: string;
    meta?: Record<string, unknown>;
  } = {},
  dbOrTx?: DbOrTx,
) {
  try {
    const db = dbOrTx ?? (await getDb());
    await db.insert(auditLog).values({
      userId: session?.uid ?? null,
      userName: session?.name ?? '',
      centreId: details.centreId ?? null,
      action,
      entity: details.entity ?? '',
      entityId: details.entityId ?? '',
      summary: details.summary ?? '',
      meta: details.meta ?? {},
    });
  } catch (error) {
    // The log must never be the reason a real action fails.
    console.error('[audit]', action, error);
  }
}
