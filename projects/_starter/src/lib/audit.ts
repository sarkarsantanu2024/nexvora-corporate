import { getDb, type DbOrTx } from '@/db';
import { auditLog } from '@/db/schema';
import type { Session } from './session-token';

/**
 * Records who did what. Call it after every change that matters
 * (enquiries, logins, settings, website publishes).
 *
 *   await audit(session, 'enquiry.status', {
 *     entity: 'enquiry', entityId, summary: 'Enquiry from Asha Roy marked contacted',
 *   });
 */
export async function audit(
  /** The person; `uid: null` with a name for changes made by the system or by Nexvora. */
  session: (Pick<Session, 'name'> & { uid: string | null }) | null,
  action: string,
  details: {
    entity?: string;
    entityId?: string;
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
