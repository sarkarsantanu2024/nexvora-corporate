/** Everything the centre's first screen shows, in a handful of grouped queries. */
import { and, asc, desc, eq, gte, inArray, isNull, lte, notInArray, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { admissionEnquiries, attendance, batches, expenses, invoices, payments, students, users } from '@/db/schema';
import { canManageCentre } from '@/lib/auth';
import { currentPeriod, lastPeriods, periodLabel, periodRange, todayIST, weekday } from '@/lib/date';
import { countInt, livePayment, liveStudent, monthOf, sumInt, type Ctx } from './shared';

export async function centreOverview(ctx: Ctx) {
  const db = await getDb();
  const centreId = ctx.centre.id;
  const manager = canManageCentre(ctx.session);
  const today = todayIST();
  const month = currentPeriod();
  const { from, to } = periodRange(month);
  const months = lastPeriods(6);
  const sixFrom = `${months[0]}-01`;
  const open = inArray(invoices.status, ['unpaid', 'partial']);
  const activeChild = and(eq(students.centreId, centreId), eq(students.status, 'active'), liveStudent);

  const [classes, [money], [dues], collectedByMonth, spentByMonth, markedToday, [followUps], [unbilled], latest] = await Promise.all([
    // Every active class with how many children sit in it.
    db
      .select({ id: batches.id, name: batches.name, capacity: batches.capacity, children: sql<number>`count(${students.id})::int` })
      .from(batches)
      .leftJoin(students, and(eq(students.batchId, batches.id), eq(students.status, 'active'), liveStudent))
      .where(and(eq(batches.centreId, centreId), eq(batches.active, true)))
      .groupBy(batches.id)
      .orderBy(asc(batches.createdAt), asc(batches.name)),
    db
      .select({
        month: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.paidOn} >= ${from}), 0)::int`,
        today: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.paidOn} = ${today}), 0)::int`,
        todayCount: sql<number>`(count(*) filter (where ${payments.paidOn} = ${today}))::int`,
      })
      .from(payments)
      .where(and(eq(payments.centreId, centreId), livePayment, gte(payments.paidOn, from), lte(payments.paidOn, to))),
    db
      .select({
        amount: sumInt(sql`${invoices.total} - ${invoices.paid}`),
        children: sql<number>`count(distinct ${invoices.studentId})::int`,
        overdue: sql<number>`(count(*) filter (where ${invoices.dueDate} < ${today}))::int`,
      })
      .from(invoices)
      .where(and(eq(invoices.centreId, centreId), open)),
    db
      .select({ month: monthOf(payments.paidOn), amount: sumInt(payments.amount) })
      .from(payments)
      .where(and(eq(payments.centreId, centreId), livePayment, gte(payments.paidOn, sixFrom)))
      .groupBy(monthOf(payments.paidOn)),
    manager
      ? db
          .select({ month: monthOf(expenses.spentOn), amount: sumInt(expenses.amount) })
          .from(expenses)
          .where(and(eq(expenses.centreId, centreId), isNull(expenses.deletedAt), gte(expenses.spentOn, sixFrom)))
          .groupBy(monthOf(expenses.spentOn))
      : Promise.resolve([] as { month: string; amount: number }[]),
    db
      .selectDistinct({ batchId: students.batchId })
      .from(attendance)
      .innerJoin(students, eq(students.id, attendance.studentId))
      .where(and(eq(attendance.centreId, centreId), eq(attendance.day, today))),
    db
      .select({ n: countInt() })
      .from(admissionEnquiries)
      .where(and(eq(admissionEnquiries.centreId, centreId), lte(admissionEnquiries.nextFollowUp, today), notInArray(admissionEnquiries.stage, ['admitted', 'lost']))),
    // Active children who should have this month's bill and do not.
    db
      .select({ n: countInt() })
      .from(students)
      .leftJoin(invoices, and(eq(invoices.studentId, students.id), eq(invoices.period, month)))
      .where(and(activeChild, lte(students.admissionDate, to), isNull(invoices.id))),
    db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        amount: payments.amount,
        method: payments.method,
        paidOn: payments.paidOn,
        studentName: students.name,
        title: invoices.title,
        receivedBy: users.name,
      })
      .from(payments)
      .innerJoin(students, eq(students.id, payments.studentId))
      .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
      .leftJoin(users, eq(users.id, payments.receivedBy))
      .where(and(eq(payments.centreId, centreId), livePayment))
      .orderBy(desc(payments.paidOn), desc(payments.receiptNo))
      .limit(8),
  ]);

  const onRoll = classes.reduce((sum, c) => sum + c.children, 0);
  const seats = classes.reduce((sum, c) => sum + c.capacity, 0);
  const marked = new Set(markedToday.map((row) => row.batchId));
  const schoolDay = weekday(today) !== 0;
  const spentThisMonth = spentByMonth.find((row) => row.month === month)?.amount ?? 0;

  return {
    manager,
    today,
    month,
    tiles: {
      onRoll,
      seatsFree: Math.max(0, seats - onRoll),
      seats,
      collectedMonth: money.month,
      collectedToday: money.today,
      receiptsToday: money.todayCount,
      dues: dues.amount,
      childrenWithDues: dues.children,
      expensesMonth: manager ? spentThisMonth : null,
      surplusMonth: manager ? money.month - spentThisMonth : null,
    },
    todo: {
      // Sunday is not a school day, so nothing is "not marked" then.
      attendancePending: schoolDay ? classes.filter((c) => c.children > 0 && !marked.has(c.id)).map((c) => ({ id: c.id, name: c.name })) : [],
      followUps: followUps.n,
      unbilled: unbilled.n,
      overdue: dues.overdue,
    },
    trend: months.map((m) => ({
      label: periodLabel(m).slice(0, 3),
      collected: collectedByMonth.find((row) => row.month === m)?.amount ?? 0,
      spent: spentByMonth.find((row) => row.month === m)?.amount ?? 0,
    })),
    classes,
    latest,
  };
}
