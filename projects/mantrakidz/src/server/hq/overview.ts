/**
 * The head office overview: the health of the whole chain on one screen.
 * Every figure is a grouped query; nothing here loads rows to add them up.
 */
import { and, asc, desc, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { admissionEnquiries, attendance, auditLog, centres, franchiseLeads, payments, programmes, royaltyInvoices, students } from '@/db/schema';
import { addDays, currentPeriod, formatDate, lastPeriods, periodLabel, todayIST, weekday } from '@/lib/date';
import { inr } from '@/lib/money';
import { centreFigures } from './centres';
import { followUpsDue } from './leads';
import { countInt, liveCentre, livePayment, monthOf, total } from './shared';

export type AttentionItem = { centreId: string; centreName: string; reasons: { text: string; tone: 'red' | 'amber' }[] };

/** The earliest of the last three school days (Monday to Friday), counting today. */
function thirdWorkingDayBack(today: string) {
  let day = today;
  let found = 0;
  for (;;) {
    const wd = weekday(day);
    if (wd !== 0 && wd !== 6) found += 1;
    if (found === 3) return day;
    day = addDays(day, -1);
  }
}

export async function getOverview() {
  const db = await getDb();
  const today = todayIST();
  const period = currentPeriod();
  const periods = lastPeriods(6);
  const attendanceSince = thirdWorkingDayBack(today);

  const [centreRows, figures, byMonth, byProgramme, [leadsWeek], [waiting], overdue, marked, followUps, activity] = await Promise.all([
    db.select().from(centres).where(liveCentre).orderBy(asc(centres.code)),
    centreFigures(db, period),
    db
      .select({ period: monthOf(payments.paidOn), n: total(payments.amount) })
      .from(payments)
      .innerJoin(centres, eq(centres.id, payments.centreId))
      .where(and(livePayment, liveCentre, gte(payments.paidOn, `${periods[0]}-01`)))
      .groupBy(monthOf(payments.paidOn)),
    db
      .select({ name: programmes.name, n: countInt() })
      .from(students)
      .innerJoin(programmes, eq(programmes.id, students.programmeId))
      .innerJoin(centres, eq(centres.id, students.centreId))
      .where(and(eq(students.status, 'active'), isNull(students.deletedAt), liveCentre))
      .groupBy(programmes.name, programmes.sort)
      .orderBy(asc(programmes.sort)),
    db
      .select({ n: countInt() })
      .from(franchiseLeads)
      .where(gte(franchiseLeads.createdAt, sql`now() - interval '7 days'`)),
    db.select({ n: countInt() }).from(admissionEnquiries).where(eq(admissionEnquiries.stage, 'new')),
    db
      .select({ centreId: royaltyInvoices.centreId, n: total(sql`${royaltyInvoices.amount} - ${royaltyInvoices.paid}`), months: countInt() })
      .from(royaltyInvoices)
      .where(and(inArray(royaltyInvoices.status, ['unpaid', 'partial']), lt(royaltyInvoices.dueDate, today)))
      .groupBy(royaltyInvoices.centreId),
    db
      .select({ centreId: attendance.centreId })
      .from(attendance)
      .where(gte(attendance.day, attendanceSince))
      .groupBy(attendance.centreId),
    followUpsDue(8),
    db
      .select({ id: auditLog.id, userName: auditLog.userName, action: auditLog.action, summary: auditLog.summary, createdAt: auditLog.createdAt })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(8),
  ]);

  const active = centreRows.filter((centre) => centre.status === 'active');
  const figureOf = (id: string) => figures.get(id) ?? { onRoll: 0, seats: 0, collection: 0, dues: 0, royaltyDue: 0 };
  const sumOf = (key: 'onRoll' | 'collection' | 'royaltyDue') => centreRows.reduce((sum, centre) => sum + figureOf(centre.id)[key], 0);

  const overdueBy = new Map(overdue.map((row) => [row.centreId, row]));
  const markedIds = new Set(marked.map((row) => row.centreId));
  const soon = addDays(today, 90);

  const attention: AttentionItem[] = [];
  for (const centre of active) {
    const f = figureOf(centre.id);
    const reasons: AttentionItem['reasons'] = [];
    const late = overdueBy.get(centre.id);
    if (late && late.n > 0) reasons.push({ tone: 'red', text: `Royalty of ${inr(late.n)} overdue (${late.months} ${late.months === 1 ? 'month' : 'months'})` });
    if (centre.agreementEnd && centre.agreementEnd <= soon) {
      reasons.push(
        centre.agreementEnd < today
          ? { tone: 'red', text: 'Agreement has ended' }
          : { tone: 'amber', text: `Agreement ends on ${formatDate(centre.agreementEnd)}` },
      );
    }
    // Only centres that have children can be expected to collect fees or mark attendance.
    if (f.onRoll > 0 && f.collection === 0) reasons.push({ tone: 'amber', text: `No fee collected in ${periodLabel(period)}` });
    if (f.onRoll > 0 && !markedIds.has(centre.id)) reasons.push({ tone: 'amber', text: 'Attendance not marked in the last 3 working days' });
    if (reasons.length) attention.push({ centreId: centre.id, centreName: centre.name, reasons });
  }

  return {
    period,
    tiles: {
      activeCentres: active.length,
      totalCentres: centreRows.length,
      childrenOnRoll: sumOf('onRoll'),
      collectedThisMonth: sumOf('collection'),
      royaltyOutstanding: sumOf('royaltyDue'),
      leadsThisWeek: leadsWeek?.n ?? 0,
      enquiriesWaiting: waiting?.n ?? 0,
    },
    collectionByMonth: periods.map((p) => ({ period: p, label: periodLabel(p).slice(0, 3), collected: byMonth.find((row) => row.period === p)?.n ?? 0 })),
    childrenByProgramme: byProgramme.map((row) => ({ name: row.name, value: row.n })),
    centreComparison: active.map((centre) => ({
      id: centre.id,
      label: centre.name.replace(/^Mantra Kidz\s+/i, '').replace(/\s*\(sample\)$/i, ''),
      collected: figureOf(centre.id).collection,
    })),
    followUps,
    attention,
    activity,
  };
}
