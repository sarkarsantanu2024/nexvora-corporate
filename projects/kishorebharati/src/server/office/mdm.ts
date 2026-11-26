/**
 * The mid-day meal (MDM) register: one line a school day with, for each
 * class, the boys present and the boys who ate; the menu; the cook-cum-
 * helpers who came; and rice and other stock received and used.
 *
 * "Present" is filled in from the attendance register of that day when the
 * class teachers have taken it, so the office only checks and types "ate".
 * Sundays and calendar holidays are shut and cannot be filled.
 */
import { and, asc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { attendance, enrolments, mdmClassCounts, mdmDays, mdmStock, sections, students } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { periodRange, todayIST, weekday } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day as dayField, text } from '@/lib/validators';
import { countInt } from '../admin/shared';
import { closedOn, daysOf, holidaysBetween, isMonth, type Closed } from '../daily/shared';
import { assertOffice, currentYear } from '../school/access';
import { qtyMilli } from './labels';
import { mdmGradesOf, officeSettings } from './shared';

/** Boys present per class on a day, from the attendance register (present or late). Only classes with a register that day. */
export async function presentFromAttendance(day: string, db?: DbOrTx): Promise<Map<number, number>> {
  const conn = db ?? (await getDb());
  const rows = await conn
    .select({
      grade: sections.grade,
      taken: countInt(),
      present: sql<number>`count(*) filter (where ${attendance.status} in ('present', 'late'))::int`,
    })
    .from(attendance)
    .innerJoin(sections, eq(sections.id, attendance.sectionId))
    .where(eq(attendance.day, day))
    .groupBy(sections.grade);
  return new Map(rows.filter((row) => row.taken > 0).map((row) => [row.grade, row.present]));
}

/** Boys on the roll of each class this year, as a guide beside the boxes. */
async function rollByGrade(db: DbOrTx): Promise<Map<number, number>> {
  let yearId: string;
  try {
    yearId = (await currentYear(db)).id;
  } catch {
    return new Map();
  }
  const rows = await db
    .select({ grade: sections.grade, n: countInt() })
    .from(enrolments)
    .innerJoin(sections, eq(sections.id, enrolments.sectionId))
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .where(and(eq(enrolments.yearId, yearId), eq(students.status, 'active'), sql`${students.deletedAt} is null`))
    .groupBy(sections.grade);
  return new Map(rows.map((row) => [row.grade, row.n]));
}

export type MdmDayForm = Awaited<ReturnType<typeof loadMdmDay>>;

/** Everything the daily entry needs: what was saved, or else a ready start from attendance and the menu of the weekday. */
export async function loadMdmDay(session: Session, day: string) {
  assertOffice(session);
  const db = await getDb();
  const settings = await officeSettings(db);
  const grades = mdmGradesOf(settings);
  const [closed, [saved], fromRegister, roll] = await Promise.all([
    closedOn(day, db),
    db.select().from(mdmDays).where(eq(mdmDays.day, day)).limit(1),
    presentFromAttendance(day, db),
    rollByGrade(db),
  ]);
  const [counts, stock] = saved
    ? await Promise.all([
        db.select().from(mdmClassCounts).where(eq(mdmClassCounts.dayId, saved.id)),
        db.select().from(mdmStock).where(eq(mdmStock.dayId, saved.id)),
      ])
    : [[], []];
  const countOf = new Map(counts.map((row) => [row.grade, row]));
  const stockOf = new Map(stock.map((row) => [row.item, row]));
  const items = [...settings.stockItems.map((item) => item.name), ...stock.map((row) => row.item).filter((name) => !settings.stockItems.some((item) => item.name === name))];
  return {
    day,
    closed,
    saved: Boolean(saved),
    menu: saved?.menu ?? settings.menu[String(weekday(day))] ?? '',
    cooksPresent: saved?.cooksPresent ?? null,
    note: saved?.note ?? '',
    classes: grades.map((grade) => ({
      grade,
      present: countOf.get(grade)?.present ?? fromRegister.get(grade) ?? null,
      ate: countOf.get(grade)?.ate ?? null,
      fromRegister: !countOf.has(grade) && fromRegister.has(grade),
      roll: roll.get(grade) ?? null,
    })),
    stock: items.map((name) => ({
      item: name,
      unit: settings.stockItems.find((item) => item.name === name)?.unit ?? 'kg',
      received: stockOf.get(name)?.received ?? 0,
      used: stockOf.get(name)?.used ?? 0,
    })),
  };
}

const count = z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole numbers only').min(0, 'Cannot be negative').max(5000, 'That number is too large');
const quantity = z.coerce
  .number({ invalid_type_error: 'Enter a number' })
  .min(0, 'Cannot be negative')
  .max(100000, 'That number is too large')
  .transform((value) => qtyMilli(value));

export const mdmInput = z.object({
  day: dayField,
  menu: text(300),
  cooksPresent: count,
  note: text(500),
  classes: z.array(z.object({ grade: z.coerce.number().int(), present: count, ate: count })).max(20),
  stock: z.array(z.object({ item: z.string().trim().min(1).max(60), received: quantity, used: quantity })).max(30),
});
export type MdmInput = z.input<typeof mdmInput>;

const closedMessage = (closed: NonNullable<Closed>) =>
  closed.reason === 'sunday' ? 'It is a Sunday. The mid-day meal register is not filled.' : 'It is a holiday. The mid-day meal register is not filled.';

/** Saves the day. Saving the same day again replaces what was there, so a mistake is put right by saving again. */
export async function saveMdmDay(session: Session, raw: MdmInput) {
  assertOffice(session);
  const input = mdmInput.parse(raw);
  if (input.day > todayIST()) throw new ApiError(400, 'The register cannot be filled for a day still to come');
  const db = await getDb();
  const closed = await closedOn(input.day, db);
  if (closed) throw new ApiError(400, closedMessage(closed));
  const grades = mdmGradesOf(await officeSettings(db));
  const fields: Record<string, string> = {};
  input.classes.forEach((row, index) => {
    if (!grades.includes(row.grade)) fields[`classes.${index}.grade`] = 'This class does not get the mid-day meal';
    if (row.ate > row.present) fields[`classes.${index}.ate`] = 'Cannot be more than present';
  });
  if (new Set(input.classes.map((row) => row.grade)).size !== input.classes.length) fields._ = 'A class is listed twice';
  if (Object.keys(fields).length) throw new ApiError(400, fields._ ?? Object.values(fields)[0], fields);

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(mdmDays)
      .values({ day: input.day, menu: input.menu, cooksPresent: input.cooksPresent, note: input.note, updatedBy: session.uid })
      .onConflictDoUpdate({ target: mdmDays.day, set: { menu: input.menu, cooksPresent: input.cooksPresent, note: input.note, updatedBy: session.uid, updatedAt: new Date() } })
      .returning({ id: mdmDays.id });
    await tx.delete(mdmClassCounts).where(eq(mdmClassCounts.dayId, row.id));
    await tx.delete(mdmStock).where(eq(mdmStock.dayId, row.id));
    if (input.classes.length) await tx.insert(mdmClassCounts).values(input.classes.map((c) => ({ dayId: row.id, grade: c.grade, present: c.present, ate: c.ate })));
    const stock = input.stock.filter((s) => s.received > 0 || s.used > 0);
    if (stock.length) await tx.insert(mdmStock).values(stock.map((s) => ({ dayId: row.id, item: s.item, received: s.received, used: s.used })));
    return row.id;
  });
  const ate = input.classes.reduce((sum, row) => sum + row.ate, 0);
  await audit(session, 'mdm.save', { entity: 'mdm_day', entityId: id, summary: `Mid-day meal register for ${input.day}: ${ate} meals` });
  return { id };
}

/** Has today's line been saved? (For the bell.) */
export async function mdmFilled(day: string, db?: DbOrTx): Promise<boolean> {
  const conn = db ?? (await getDb());
  const [row] = await conn.select({ id: mdmDays.id }).from(mdmDays).where(eq(mdmDays.day, day)).limit(1);
  return Boolean(row);
}

export type MdmMonth = Awaited<ReturnType<typeof mdmMonth>>;

/**
 * The month as the register book has it: a line a day (shut days say why),
 * the totals per class, and stock opening, received, used and closing.
 */
export async function mdmMonth(session: Session, month: string) {
  assertOffice(session);
  if (!isMonth(month)) throw new ApiError(400, 'Pick a month');
  const db = await getDb();
  const settings = await officeSettings(db);
  const { from, to } = periodRange(month);
  const today = todayIST();
  const days = daysOf(month, to < today ? to : today);
  const [dayRows, holidays] = await Promise.all([
    db.select().from(mdmDays).where(and(gte(mdmDays.day, from), lte(mdmDays.day, to))).orderBy(asc(mdmDays.day)),
    holidaysBetween(from, to, db),
  ]);
  const ids = dayRows.map((row) => row.id);
  const [counts, stockRows, before] = await Promise.all([
    ids.length ? db.select().from(mdmClassCounts).where(inArray(mdmClassCounts.dayId, ids)) : Promise.resolve([]),
    ids.length ? db.select().from(mdmStock).where(inArray(mdmStock.dayId, ids)) : Promise.resolve([]),
    db
      .select({ item: mdmStock.item, balance: sql<number>`coalesce(sum(${mdmStock.received} - ${mdmStock.used}), 0)::int` })
      .from(mdmStock)
      .innerJoin(mdmDays, eq(mdmDays.id, mdmStock.dayId))
      .where(lt(mdmDays.day, from))
      .groupBy(mdmStock.item),
  ]);

  // Classes: those the school gives the meal to, plus any saved earlier for a class since taken off the list.
  const grades = [...new Set([...mdmGradesOf(settings), ...counts.map((row) => row.grade)])].sort((a, b) => a - b);
  const byDay = new Map(dayRows.map((row) => [row.id, row]));
  const cell = new Map<string, { present: number; ate: number }>();
  for (const row of counts) cell.set(`${byDay.get(row.dayId)!.day}|${row.grade}`, { present: row.present, ate: row.ate });

  const savedOn = new Map(dayRows.map((row) => [row.day, row]));
  const lines = days.map((day) => {
    const saved = savedOn.get(day);
    const shut = weekday(day) === 0 ? 'Sunday' : holidays.get(day) ?? '';
    const perGrade = grades.map((grade) => cell.get(`${day}|${grade}`) ?? null);
    return {
      day,
      shut,
      saved: Boolean(saved),
      menu: saved?.menu ?? '',
      cooksPresent: saved?.cooksPresent ?? null,
      perGrade,
      totalPresent: perGrade.reduce((sum, c) => sum + (c?.present ?? 0), 0),
      totalAte: perGrade.reduce((sum, c) => sum + (c?.ate ?? 0), 0),
    };
  });

  const classTotals = grades.map((grade, index) => {
    const served = lines.filter((line) => (line.perGrade[index]?.ate ?? 0) > 0);
    return { grade, daysServed: served.length, meals: served.reduce((sum, line) => sum + (line.perGrade[index]?.ate ?? 0), 0) };
  });

  const openings = new Map(before.map((row) => [row.item, row.balance]));
  const items = [...new Set([...settings.stockItems.map((item) => item.name), ...stockRows.map((row) => row.item), ...openings.keys()])];
  const stock = items.map((item) => {
    const mine = stockRows.filter((row) => row.item === item);
    const opening = openings.get(item) ?? 0;
    const received = mine.reduce((sum, row) => sum + row.received, 0);
    const used = mine.reduce((sum, row) => sum + row.used, 0);
    return { item, unit: settings.stockItems.find((s) => s.name === item)?.unit ?? 'kg', opening, received, used, closing: opening + received - used };
  });

  const daysServed = lines.filter((line) => line.totalAte > 0).length;
  const schoolDays = lines.filter((line) => !line.shut).length;
  const missing = lines.filter((line) => !line.shut && !line.saved && line.day < today).length;
  return { month, grades, lines, classTotals, stock, daysServed, schoolDays, missing, meals: classTotals.reduce((sum, row) => sum + row.meals, 0) };
}
