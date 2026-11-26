import type { Metadata } from 'next';
import { Avatar, Card, PageHeader } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { defaultDueDate, getStudentCard, listFeeHeads } from '@/server/money/bills';
import { requirePlan } from '@/server/platform';
import { readSearch, type Search } from '../../_ui/bits';
import { classOf } from '../shared';
import { StudentPicker } from '../student-picker';
import { BillForm } from './bill-form';

export const metadata: Metadata = { title: 'New bill' };

export default async function NewBillPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const student = params.student ? await getStudentCard(session, params.student) : null;

  if (!student) {
    return (
      <>
        <PageHeader title={t('New bill')} description={t('A single bill for one student: a certificate, a duplicate identity card, anything charged once.')} back={{ href: '/admin/fees', label: t('Fees') }} />
        <StudentPicker session={session} q={params.q ?? ''} section={params.section ?? ''} to="/admin/fees/new" hint={t('Find the student first.')} />
      </>
    );
  }

  const [heads, dueDate] = await Promise.all([listFeeHeads({ activeOnly: true }), defaultDueDate()]);
  return (
    <>
      <PageHeader title={t('New bill')} back={{ href: '/admin/fees/new', label: t('Choose another student') }} />
      <div className="mx-auto max-w-3xl">
        <Card className="mb-5 flex items-center gap-4 p-4">
          <Avatar name={student.name} src={student.photo} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-bold text-ink-900">{student.name}</p>
            <p className="truncate text-sm text-ink-500">{[classOf(student, lang), student.admissionNo].filter(Boolean).join(' · ')}</p>
          </div>
        </Card>
        <BillForm studentId={student.id} heads={heads.map((head) => ({ id: head.id, name: head.name, amount: head.amount }))} today={todayIST()} dueDate={dueDate} />
      </div>
    </>
  );
}
