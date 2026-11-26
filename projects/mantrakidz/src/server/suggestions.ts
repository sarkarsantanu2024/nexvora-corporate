/**
 * "What to do next" cards on the overviews. Each is a plain rule over what is
 * in the database: nothing is guessed and no number is made up. A card goes
 * away by itself once the thing is done.
 *
 * The bell and a school's "Today" card already say what needs doing today
 * (attendance, follow-ups, bills to raise or chase). These are the slower
 * things: money going the wrong way, children outside a class, families who
 * cannot see their fees, set-up left half done.
 *
 * ADDING YOUR OWN
 *   Write a rule like the ones below and add it to SCHOOL_RULES or HQ_RULES.
 *   Count with a query; leave out what this person's role cannot open. Add
 *   its sentences to src/i18n/ui-hi.ts and ui-bn.ts.
 */
import { and, eq, gte, inArray, isNull, lte, ne, sql } from 'drizzle-orm';
import { getDb, usingNeon } from '@/db';
import { centres, expenses, franchiseLeads, invoices, payments, students } from '@/db/schema';
import type { Translate } from '@/i18n/ui';
import { canManageCentre, type Session } from '@/lib/auth';
import { currentPeriod, formatDate, periodLabel, periodRange, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import type { Ctx } from './centre/money/shared';
import { countInt, getSetting, isAdmin, total } from './hq/shared';
import { kindEnabled } from './reminders/service';

export type Suggestion = {
  id: string;
  /** warn: something is wrong or missing. tip: worth doing when there is time. */
  tone: 'warn' | 'tip';
  title: string;
  text: string;
  href: string;
  action: string;
};

/** Below this share of the month's billed fees collected, the school is told. */
const LOW_COLLECTION = 70;

type SchoolRule = (ctx: Ctx, t: Translate) => Promise<Suggestion[]>;
type HqRule = (session: Session, t: Translate) => Promise<Suggestion[]>;

const liveChild = and(isNull(students.deletedAt), eq(students.status, 'active'));

/* ───────────── a school ───────────── */

/** More went out than came in this month. Only the school head sees money totals. */
const spendingOverIncome: SchoolRule = async (ctx, t) => {
  if (!canManageCentre(ctx.session)) return [];
  const db = await getDb();
  const month = currentPeriod();
  const { from, to } = periodRange(month);
  const [[paid], [spent]] = await Promise.all([
    db.select({ sum: total(payments.amount) }).from(payments).where(and(eq(payments.centreId, ctx.centre.id), isNull(payments.voidedAt), gte(payments.paidOn, from), lte(payments.paidOn, to))),
    db.select({ sum: total(expenses.amount) }).from(expenses).where(and(eq(expenses.centreId, ctx.centre.id), isNull(expenses.deletedAt), gte(expenses.spentOn, from), lte(expenses.spentOn, to))),
  ]);
  if (spent.sum <= paid.sum || spent.sum === 0) return [];
  return [
    {
      id: `over-${month}-${spent.sum}-${paid.sum}`,
      tone: 'warn',
      title: t('Expenses are more than the fees collected in {month}', { month: periodLabel(month) }),
      text: t('{spent} spent against {paid} collected so far.', { spent: inr(spent.sum), paid: inr(paid.sum) }),
      href: '/centre/reports',
      action: t('Open Reports'),
    },
  ];
};

/** Of this month's bills already due, how much has come in. */
const lowCollection: SchoolRule = async (ctx, t) => {
  const db = await getDb();
  const month = currentPeriod();
  const [row] = await db
    .select({ billed: total(invoices.total), paid: total(invoices.paid) })
    .from(invoices)
    .where(and(eq(invoices.centreId, ctx.centre.id), eq(invoices.period, month), ne(invoices.status, 'cancelled'), lte(invoices.dueDate, todayIST())));
  if (!row.billed) return [];
  const share = Math.floor((row.paid * 100) / row.billed);
  if (share >= LOW_COLLECTION) return [];
  return [
    {
      id: `collection-${month}-${share}`,
      tone: 'warn',
      title: t('Only {share}% of the fees due in {month} are in', { share, month: periodLabel(month) }),
      text: t('{due} is still to come. The Reminders screen has a message ready for each family.', { due: inr(row.billed - row.paid) }),
      href: '/centre/fees?tab=dues',
      action: t('See who has not paid'),
    },
  ];
};

/** A child outside every class is missed by attendance and the class lists. */
const childrenWithoutClass: SchoolRule = async (ctx, t) => {
  const db = await getDb();
  const [row] = await db.select({ n: countInt() }).from(students).where(and(eq(students.centreId, ctx.centre.id), liveChild, isNull(students.batchId)));
  if (!row.n) return [];
  return [
    {
      id: `no-class-${row.n}`,
      tone: 'warn',
      title: row.n === 1 ? t('1 child is not in a class') : t('{n} children are not in a class', { n: row.n }),
      text: t('They do not appear in attendance. Open each child and choose a class.'),
      href: '/centre/students',
      action: t('Open Children'),
    },
  ];
};

/** Families with no parent login cannot see fees, receipts and attendance themselves. */
const familiesWithoutLogin: SchoolRule = async (ctx, t) => {
  if (!canManageCentre(ctx.session)) return [];
  const db = await getDb();
  const [row] = await db.select({ n: countInt() }).from(students).where(and(eq(students.centreId, ctx.centre.id), liveChild, isNull(students.parentUserId)));
  if (!row.n) return [];
  return [
    {
      id: `parent-login-${row.n}`,
      tone: 'tip',
      title: row.n === 1 ? t('1 child has no parent login yet') : t('{n} children have no parent login yet', { n: row.n }),
      text: t('With a login, parents see fees, receipts and attendance on their phone and ask the office less.'),
      href: '/centre/students',
      action: t('Open Children'),
    },
  ];
};

const birthdaysToday: SchoolRule = async (ctx, t) => {
  const db = await getDb();
  const [row] = await db
    .select({ n: countInt() })
    .from(students)
    .where(and(eq(students.centreId, ctx.centre.id), liveChild, sql`to_char(${students.dob}, 'MM-DD') = ${todayIST().slice(5)}`));
  if (!row.n) return [];
  const greet = kindEnabled(await getSetting('reminders'), 'birthday');
  return [
    {
      id: `birthdays-${todayIST()}-${row.n}`,
      tone: 'tip',
      title: row.n === 1 ? t('1 birthday today') : t('{n} birthdays today', { n: row.n }),
      text: greet ? t('A greeting for each family is ready on the Reminders screen.') : t('Wish the child in class today.'),
      href: greet ? '/centre/reminders?kind=birthday' : '/centre/students',
      action: greet ? t('Open Reminders') : t('Open Children'),
    },
  ];
};

const SCHOOL_RULES: SchoolRule[] = [spendingOverIncome, lowCollection, childrenWithoutClass, birthdaysToday, familiesWithoutLogin];

/* ───────────── head office ───────────── */

const organisationDetails: HqRule = async (session, t) => {
  if (!isAdmin(session)) return [];
  const org = await getSetting('org');
  if (org.phone && org.address) return [];
  return [
    {
      id: 'org-details',
      tone: 'warn',
      title: t('Fill in the organisation details'),
      text: t('The phone number and address are used on receipts, letters and reminders.'),
      href: '/hq/settings',
      action: t('Open Settings'),
    },
  ];
};

const sampleData: HqRule = async (session, t) => {
  if (!isAdmin(session)) return [];
  const db = await getDb();
  const [[schools], [leads]] = await Promise.all([
    db.select({ n: countInt() }).from(centres).where(and(eq(centres.isDemo, true), isNull(centres.deletedAt))),
    db.select({ n: countInt() }).from(franchiseLeads).where(eq(franchiseLeads.isDemo, true)),
  ]);
  if (!schools.n && !leads.n) return [];
  return [
    {
      id: `sample-${schools.n}-${leads.n}`,
      tone: 'warn',
      title: t('The sample data is still in'),
      text: t('Sample schools and leads count in every report. Remove them before real work starts.'),
      href: '/hq/settings',
      action: t('Open Settings'),
    },
  ];
};

/** Open schools that visitors cannot find on the website. */
const hiddenSchools: HqRule = async (_session, t) => {
  const db = await getDb();
  const [row] = await db
    .select({ n: countInt() })
    .from(centres)
    .where(and(isNull(centres.deletedAt), eq(centres.isDemo, false), inArray(centres.status, ['active']), eq(centres.showOnWebsite, false)));
  if (!row.n) return [];
  return [
    {
      id: `hidden-${row.n}`,
      tone: 'tip',
      title: row.n === 1 ? t('1 open school is not on the website') : t('{n} open schools are not on the website', { n: row.n }),
      text: t('Parents looking for a school near them cannot find it.'),
      href: '/hq/centres',
      action: t('Open Schools'),
    },
  ];
};

/** On the live site the daily check runs every morning; if it stopped, reminders stop too. */
const dailyCheck: HqRule = async (session, t) => {
  if (!isAdmin(session) || !usingNeon()) return [];
  const { lastRunAt } = await getSetting('jobs');
  const stale = !lastRunAt || Date.now() - new Date(lastRunAt).getTime() > 2 * 86_400_000;
  if (!stale) return [];
  return [
    {
      id: `daily-check-${lastRunAt}`,
      tone: 'warn',
      title: t('The daily check has not run for two days'),
      text: lastRunAt ? t('It last ran on {date}. Reminders are not being made. Tell Nexvora.', { date: formatDate(lastRunAt.slice(0, 10)) }) : t('It has never run. Reminders are not being made. Tell Nexvora.'),
      href: '/hq/settings',
      action: t('Open Settings'),
    },
  ];
};

const HQ_RULES: HqRule[] = [organisationDetails, sampleData, dailyCheck, hiddenSchools];

const problemsFirst = (all: Suggestion[]) => [...all.filter((item) => item.tone === 'warn'), ...all.filter((item) => item.tone === 'tip')];

export async function schoolSuggestions(ctx: Ctx, t: Translate): Promise<Suggestion[]> {
  return problemsFirst((await Promise.all(SCHOOL_RULES.map((rule) => rule(ctx, t)))).flat());
}

export async function hqSuggestions(session: Session, t: Translate): Promise<Suggestion[]> {
  return problemsFirst((await Promise.all(HQ_RULES.map((rule) => rule(session, t)))).flat());
}
