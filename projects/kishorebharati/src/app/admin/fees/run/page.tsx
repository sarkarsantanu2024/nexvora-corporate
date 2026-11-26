import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/core';
import { ADMIN_ONLY, requireSession } from '@/lib/auth';
import { currentPeriod, todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { defaultDueDate, listFeeHeads } from '@/server/money/bills';
import { requirePlan } from '@/server/platform';
import { currentYear } from '@/server/school/access';
import { FeesTabs } from '../tabs';
import { RunForm } from './run-form';

export const metadata: Metadata = { title: 'Bill run' };

export default async function RunPage() {
  const t = await getT();
  const session = await requireSession(ADMIN_ONLY);
  await requirePlan('platinum');
  const [heads, year, dueDate] = await Promise.all([listFeeHeads({ activeOnly: true }), currentYear(), defaultDueDate()]);

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={t('Bill run')}
          description={t('Raises the bill of a year or a month for every student on roll in the classes you pick. Running it again adds nothing twice.')}
        />
        <FeesTabs session={session} active="run" />
      </div>
      <RunForm
        heads={heads.map((head) => ({ id: head.id, name: head.name, kind: head.kind, fromGrade: head.fromGrade, toGrade: head.toGrade, amount: head.amount }))}
        year={year.name}
        month={currentPeriod()}
        today={todayIST()}
        dueDate={dueDate}
      />
    </>
  );
}
