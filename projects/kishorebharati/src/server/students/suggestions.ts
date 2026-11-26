/** "What to do next" cards of the students module (see src/server/suggestions.ts). */
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { students } from '@/db/schema';
import type { Translate } from '@/i18n/ui';
import type { Session } from '@/lib/session-token';
import { countInt } from '../admin/shared';
import { isOffice } from '../school/access';
import type { Suggestion } from '../suggestions';

/** Without a mobile number there are no reminders and no parent login. */
export async function studentsWithoutPhone(session: Session, t: Translate): Promise<Suggestion[]> {
  if (!isOffice(session)) return [];
  const db = await getDb();
  const [row] = await db.select({ n: countInt() }).from(students).where(and(eq(students.status, 'active'), isNull(students.deletedAt), eq(students.phone, '')));
  if (!row.n) return [];
  return [
    {
      id: `students-no-phone-${row.n}`,
      tone: 'warn',
      title: t('{n} students have no mobile number', { n: row.n }),
      text: t('Without it the guardian gets no reminders and cannot have a parent login.'),
      href: '/admin/students?phone=none',
      action: t('See the students'),
    },
  ];
}
