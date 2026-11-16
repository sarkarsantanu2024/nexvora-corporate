/** What the admission form needs besides the child: programmes, classes and class fees. Server only. */
import { and, eq, isNotNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { feeHeads } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { batchOptions, listProgrammes } from '@/server/centre/children/batches';
import type { Ctx } from '@/server/centre/children/shared';

/** Turns a service's "not found" into the 404 page; anything else is a real error. */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function studentFormData(ctx: Ctx, keepBatchId?: string | null) {
  const db = await getDb();
  const [programmes, classes, fees] = await Promise.all([
    listProgrammes(),
    batchOptions(ctx, { includeInactive: true }),
    db
      .select({ programmeId: feeHeads.programmeId, amount: feeHeads.amount })
      .from(feeHeads)
      .where(and(eq(feeHeads.centreId, ctx.centre.id), eq(feeHeads.kind, 'monthly'), eq(feeHeads.active, true), isNotNull(feeHeads.programmeId))),
  ]);
  return {
    programmes,
    // Closed classes are not offered, except the one the child is already in.
    classes: classes.filter((c) => c.active || c.id === keepBatchId),
    classFees: Object.fromEntries(fees.map((f) => [f.programmeId!, f.amount])),
  };
}
