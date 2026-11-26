/**
 * The money lines of the bell (src/server/notifications.ts) and the money
 * card of "What to do next" (src/server/suggestions.ts). Office logins only.
 */
import { and, gte, inArray, lte } from 'drizzle-orm';
import { getDb } from '@/db';
import { invoices } from '@/db/schema';
import { addDays, todayIST } from '@/lib/date';
import { planAllows } from '@/lib/plans';
import { countInt, isAdmin } from '../admin/shared';
import type { NotificationSource } from '../notifications';
import { getPlatform } from '../platform';
import { isOffice } from '../school/access';
import type { Suggestion } from '../suggestions';
import type { Translate } from '@/i18n/ui';
import type { Session } from '@/lib/session-token';
import { inr } from '@/lib/money';
import { monthInOut } from './reports';

/** Unpaid bills falling due in the next seven days. */
export const billsDueThisWeek: NotificationSource = async (session, t) => {
  if (!isOffice(session) || !planAllows((await getPlatform()).plan, 'platinum')) return [];
  const db = await getDb();
  const today = todayIST();
  const [row] = await db
    .select({ n: countInt() })
    .from(invoices)
    .where(and(inArray(invoices.status, ['unpaid', 'partial']), gte(invoices.dueDate, today), lte(invoices.dueDate, addDays(today, 7))));
  if (!row.n) return [];
  return [
    {
      // The day is part of the id, so the line comes back the next morning while bills are still due.
      id: `bills-due-week-${today}-${row.n}`,
      kind: 'money',
      tone: 'amber',
      title: row.n === 1 ? t('1 bill falls due this week') : t('{n} bills fall due this week', { n: row.n }),
      text: t('Send the parents a reminder from Dues'),
      href: '/admin/fees?tab=dues&sort=age',
    },
  ];
};

/** "This month the school spent more than it collected." Head of school only, like Reports. */
export async function costsAboveTakings(session: Session, t: Translate): Promise<Suggestion[]> {
  if (!isAdmin(session) || !planAllows((await getPlatform()).plan, 'platinum')) return [];
  const { collected, spent } = await monthInOut();
  if (spent <= 0 || spent <= collected) return [];
  return [
    {
      id: `costs-above-takings-${todayIST().slice(0, 7)}`,
      tone: 'warn',
      title: t('This month the expenses are higher than the fees collected'),
      text: t('{spent} spent and {collected} collected so far this month.', { spent: inr(spent), collected: inr(collected) }),
      href: '/admin/reports',
      action: t('Open Reports'),
    },
  ];
}

