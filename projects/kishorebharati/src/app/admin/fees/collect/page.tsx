import { CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { Avatar, Card, EmptyState, LinkButton, PageHeader } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { getStudentCard, openBills } from '@/server/money/bills';
import { requirePlan } from '@/server/platform';
import { readSearch, type Search } from '../../_ui/bits';
import { billName, classOf } from '../shared';
import { StudentPicker } from '../student-picker';
import { FeesTabs } from '../tabs';
import { CollectForm } from './collect-form';

export const metadata: Metadata = { title: 'Take payment' };

export default async function CollectPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const student = params.student ? await getStudentCard(session, params.student) : null;

  if (!student) {
    return (
      <>
        <div className="no-print">
          <PageHeader title={t('Take payment')} description={t('Find the student first.')} />
          <FeesTabs session={session} active="collect" />
        </div>
        <StudentPicker session={session} q={params.q ?? ''} section={params.section ?? ''} to="/admin/fees/collect" hint={t('Students with the most to pay are listed first.')} />
      </>
    );
  }

  const bills = await openBills(session, student.id);
  return (
    <>
      <PageHeader title={t('Take payment')} back={{ href: '/admin/fees/collect', label: t('Choose another student') }} />
      <div className="mx-auto max-w-3xl">
        <Card className="mb-5 flex items-center gap-4 p-4">
          <Avatar name={student.name} src={student.photo} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-bold text-ink-900">{student.name}</p>
            <p className="truncate text-sm text-ink-500">
              {[classOf(student, lang), student.rollNo ? t('Roll {n}', { n: student.rollNo }) : '', student.admissionNo, student.phone].filter(Boolean).join(' · ')}
            </p>
          </div>
        </Card>

        {bills.length ? (
          <CollectForm
            studentId={student.id}
            today={todayIST()}
            bills={bills.map((bill) => ({ id: bill.id, invoiceNo: bill.invoiceNo, title: billName(bill, t), dueDate: bill.dueDate, total: bill.total, paid: bill.paid }))}
          />
        ) : (
          <Card>
            <EmptyState
              icon={<CheckCircle2 size={26} />}
              title={t('Nothing due')}
              text={t('{name} has no unpaid bill. To take money for something new, raise a bill first.', { name: student.name })}
              action={<LinkButton href={`/admin/fees/new?student=${student.id}`}>{t('New bill')}</LinkButton>}
            />
          </Card>
        )}
      </div>
    </>
  );
}
