/** The library line of the bell (src/server/notifications.ts): books kept past their return date. Office logins only. */
import { todayIST } from '@/lib/date';
import { planAllows } from '@/lib/plans';
import type { NotificationSource } from '../notifications';
import { getPlatform } from '../platform';
import { isOffice } from '../school/access';
import { countOverdueBooks } from './service';

export const booksOverdue: NotificationSource = async (session, t) => {
  if (!isOffice(session) || !planAllows((await getPlatform()).plan, 'platinum')) return [];
  const today = todayIST();
  const n = await countOverdueBooks(today);
  if (!n) return [];
  return [
    {
      id: `books-overdue-${today}-${n}`,
      kind: 'task',
      tone: 'amber',
      title: n === 1 ? t('1 library book is overdue') : t('{n} library books are overdue', { n }),
      text: t('Remind the borrowers on WhatsApp'),
      href: '/admin/library?tab=overdue',
    },
  ];
};
