/**
 * The server half of an import from a spreadsheet (the screen half is
 * src/components/ui/import.tsx). Each row is checked with the module's zod
 * schema and saved on its own: a bad row is listed with its reason and the
 * rest still go in.
 *
 *   return runImport(rows, rowSchema, async (row) => { await db.insert(…) });
 *
 * `save` may throw an ApiError with a plain message ("Already in the list"),
 * or a ZodError from a further check, to leave a row out.
 */
import { type z, ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '@/lib/api';

export type ImportResult = { added: number; skipped: { row: number; error: string }[] };

export const IMPORT_MAX_ROWS = 2000;

/** Row 1 of the sheet is the headings, so the first data row is row 2. */
const sheetRow = (index: number) => index + 2;

export async function runImport<S extends ZodTypeAny>(rows: unknown, schema: S, save: (row: z.output<S>, index: number) => Promise<void>): Promise<ImportResult> {
  if (!Array.isArray(rows)) throw new ApiError(400, 'Nothing to import');
  if (rows.length > IMPORT_MAX_ROWS) throw new ApiError(400, `At most ${IMPORT_MAX_ROWS} rows at a time`);
  const result: ImportResult = { added: 0, skipped: [] };
  for (const [index, raw] of rows.entries()) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      result.skipped.push({ row: sheetRow(index), error: firstMessage(parsed.error) });
      continue;
    }
    try {
      await save(parsed.data, index);
      result.added++;
    } catch (error) {
      if (error instanceof ZodError) result.skipped.push({ row: sheetRow(index), error: firstMessage(error) });
      else if (error instanceof ApiError) result.skipped.push({ row: sheetRow(index), error: error.message });
      else throw error;
    }
  }
  return result;
}

/**
 * The message a person can act on. A field that may be empty or a valid value
 * (an optional mobile number) fails as "invalid union"; the useful message is
 * inside, on the branch that was not about being empty.
 */
function firstMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Please check this row';
  if (issue.code === 'invalid_union') {
    const inner = issue.unionErrors.flatMap((branch) => branch.issues).find((item) => item.code !== 'invalid_literal');
    if (inner) return inner.message;
  }
  return issue.message;
}
