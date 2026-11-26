/**
 * The stock and assets register: what the school owns outside the library
 * (furniture, lab equipment, computers, sports goods, books), where it is,
 * its condition, where it came from and its value, with every movement
 * (received, issued, returned, damaged, written off). The quantity on each
 * line is kept in step with its movements inside one transaction.
 */
import { and, asc, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { ASSET_CONDITIONS, ASSET_MOVEMENT_KINDS, ASSET_SOURCES, assetMovements, assets, type AssetSource } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day as dayField, optionalDay, requiredText, rupees, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, pageOf } from '../admin/shared';
import { assertOffice } from '../school/access';
import { ASSET_SOURCE_LABELS, MOVEMENT_LABELS, UNITS } from './labels';

export type StockFilters = { q?: string; category?: string; source?: string; page?: string | number };
const isSource = (value: unknown): value is AssetSource => (ASSET_SOURCES as readonly string[]).includes(value as string);

function stockWhere(filters: StockFilters): SQL | undefined {
  const parts: (SQL | undefined)[] = [];
  const term = filters.q?.trim();
  if (term) parts.push(or(ilike(assets.name, `%${term}%`), ilike(assets.location, `%${term}%`), ilike(assets.note, `%${term}%`)));
  if (filters.category) parts.push(eq(assets.category, filters.category));
  if (isSource(filters.source)) parts.push(eq(assets.source, filters.source));
  return and(...parts);
}

export async function listAssets(session: Session, filters: StockFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const where = stockWhere(filters);
  const [rows, [{ n }], categories] = await Promise.all([
    db.select().from(assets).where(where).orderBy(asc(assets.category), asc(assets.name)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(assets).where(where),
    db.selectDistinct({ category: assets.category }).from(assets).orderBy(asc(assets.category)),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE, categories: categories.map((row) => row.category) };
}

/** Every line for the printed register, by category, with the totals of value. */
export async function stockRegister(session: Session, filters: StockFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const rows = await db.select().from(assets).where(stockWhere(filters)).orderBy(asc(assets.category), asc(assets.name));
  return { rows, value: rows.reduce((sum, row) => sum + row.value, 0) };
}

export async function getAsset(session: Session, id: string) {
  assertOffice(session);
  if (!uuid.safeParse(id).success) return null;
  const db = await getDb();
  const [row] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  if (!row) return null;
  const movements = await db.select().from(assetMovements).where(eq(assetMovements.assetId, row.id)).orderBy(desc(assetMovements.day), desc(assetMovements.createdAt)).limit(200);
  return { row, movements };
}

const details = {
  name: requiredText('Name', 120),
  category: requiredText('Category', 60),
  unit: z.enum(UNITS).default('pcs'),
  location: text(80),
  condition: z.enum(ASSET_CONDITIONS).default('good'),
  purchasedOn: optionalDay,
  source: z.enum(ASSET_SOURCES).default('school_fund'),
  value: rupees,
  note: text(500),
};

export const assetInput = z.object({
  ...details,
  quantity: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole numbers only').min(0, 'Cannot be negative').max(100000, 'That number is too large'),
});
export type AssetInput = z.input<typeof assetInput>;

/** A new line. Its starting quantity is written as "received", so the movements always add up to the quantity. */
export async function createAsset(session: Session, raw: AssetInput) {
  assertOffice(session);
  const input = assetInput.parse(raw);
  const db = await getDb();
  const row = await db.transaction(async (tx) => {
    const [created] = await tx.insert(assets).values(input).returning();
    if (input.quantity > 0) {
      await tx.insert(assetMovements).values({
        assetId: created.id,
        day: input.purchasedOn && input.purchasedOn <= todayIST() ? input.purchasedOn : todayIST(),
        kind: 'received',
        quantity: input.quantity,
        party: ASSET_SOURCE_LABELS[input.source],
        note: 'Opening entry',
        createdBy: session.uid,
        createdByName: session.name,
      });
    }
    return created;
  });
  await audit(session, 'stock.create', { entity: 'asset', entityId: row.id, summary: `Stock register: ${row.quantity} ${row.unit} ${row.name}` });
  return row;
}

export const assetDetailsInput = z.object(details);

/** Changes the details of a line. The quantity changes only through a movement. */
export async function updateAsset(session: Session, id: string, raw: z.input<typeof assetDetailsInput>) {
  assertOffice(session);
  const input = assetDetailsInput.parse(raw);
  const db = await getDb();
  const [row] = await db.update(assets).set({ ...input, updatedAt: new Date() }).where(eq(assets.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Item not found');
  await audit(session, 'stock.update', { entity: 'asset', entityId: row.id, summary: `Stock register: ${row.name} changed` });
  return row;
}

export const movementInput = z.object({
  day: dayField,
  kind: z.enum(ASSET_MOVEMENT_KINDS),
  quantity: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole numbers only').min(1, 'At least 1').max(100000, 'That number is too large'),
  party: text(120),
  note: text(300),
});
export type MovementInput = z.input<typeof movementInput>;

export async function addMovement(session: Session, assetId: string, raw: MovementInput) {
  assertOffice(session);
  const input = movementInput.parse(raw);
  if (input.day > todayIST()) throw new ApiError(400, 'Pick today or an earlier day');
  const db = await getDb();
  const row = await db.transaction(async (tx) => {
    const [asset] = await tx.select().from(assets).where(eq(assets.id, uuid.parse(assetId))).limit(1);
    if (!asset) throw new ApiError(404, 'Item not found');
    let { quantity, damaged } = asset;
    switch (input.kind) {
      case 'received':
      case 'returned':
        quantity += input.quantity;
        break;
      case 'issued':
        if (input.quantity > quantity - damaged) throw new ApiError(400, 'There are not that many in stock', { quantity: 'There are not that many in stock' });
        quantity -= input.quantity;
        break;
      case 'damaged':
        if (input.quantity > quantity - damaged) throw new ApiError(400, 'There are not that many in stock', { quantity: 'There are not that many in stock' });
        damaged += input.quantity;
        break;
      case 'written_off':
        if (input.quantity > quantity) throw new ApiError(400, 'There are not that many in stock', { quantity: 'There are not that many in stock' });
        quantity -= input.quantity;
        // What is written off is taken from the damaged ones first.
        damaged = Math.max(0, damaged - input.quantity);
        break;
    }
    await tx.update(assets).set({ quantity, damaged, updatedAt: new Date() }).where(eq(assets.id, asset.id));
    const [movement] = await tx
      .insert(assetMovements)
      .values({ assetId: asset.id, ...input, createdBy: session.uid, createdByName: session.name })
      .returning();
    return { asset, movement };
  });
  await audit(session, `stock.${input.kind}`, {
    entity: 'asset',
    entityId: row.asset.id,
    summary: `${MOVEMENT_LABELS[input.kind]}: ${input.quantity} ${row.asset.unit} ${row.asset.name}`,
  });
  return row.movement;
}

/** A line entered by mistake, with its movements. Only the head of school. */
export async function deleteAsset(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const [row] = await db.delete(assets).where(eq(assets.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Item not found');
  await audit(session, 'stock.delete', { entity: 'asset', entityId: row.id, summary: `Removed ${row.name} from the stock register` });
}
