/** Small pieces the students, classes, certificates and schemes services share. */
import { asc, eq, sql } from 'drizzle-orm';
import type { DbOrTx } from '@/db';
import { counters, sections, type Section } from '@/db/schema';

/** Class 5 A, 5 B, ... 11 Arts A, 11 Science A: the order every list uses. */
export const bySection = (a: Pick<Section, 'grade' | 'shift' | 'stream' | 'name'>, b: Pick<Section, 'grade' | 'shift' | 'stream' | 'name'>) =>
  a.grade - b.grade || a.shift.localeCompare(b.shift) || a.stream.localeCompare(b.stream) || a.name.localeCompare(b.name);

export async function sectionsOfYear(db: DbOrTx, yearId: string): Promise<Section[]> {
  const rows = await db.select().from(sections).where(eq(sections.yearId, yearId)).orderBy(asc(sections.grade));
  return rows.sort(bySection);
}

/** Takes the next running number for a key ('admission', 'certificate:tc:2026'). Call inside the transaction that uses it. */
export async function nextNumber(db: DbOrTx, key: string): Promise<number> {
  const [row] = await db
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return row.value;
}

/** True when the error is Postgres refusing a duplicate on a unique index. */
export const isUniqueViolation = (error: unknown) => {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
};
