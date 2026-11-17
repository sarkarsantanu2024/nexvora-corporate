import { IndianRupee, MessageCircle, Pencil, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Avatar, Badge, buttonClass, Card, CardBody, CardHeader, Detail, LinkButton, Meter, Notice, StatusBadge, TabLinks, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { ageLabel, formatDate, formatDateTime, periodLabel, periodRange, todayIST, weekday } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { telLink, waLink } from '@/lib/wa';
import { batchOptions } from '@/server/centre/children/batches';
import { ATTENDANCE_LETTER } from '@/server/centre/children/constants';
import { listNotes } from '@/server/centre/children/shared';
import { getStudent, studentAttendance, studentFeeSummary } from '@/server/centre/children/students';
import { NotesTimeline } from '../../enquiries/notes';
import { orNotFound } from '../form-data';
import { DeleteStudent, MarkLeft, MoveClass, ParentLogin, Readmit } from './student-actions';

export const metadata: Metadata = { title: 'Child' };

const TABS = ['profile', 'fees', 'attendance', 'notes'] as const;
type Tab = (typeof TABS)[number];

const MARK_STYLE = {
  present: 'bg-mint-100 text-mint-700',
  absent: 'bg-accent-100 text-accent-700',
  leave: 'bg-sun-100 text-sun-700',
  holiday: 'bg-ink-100 text-ink-500',
} as const;

export default async function StudentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const { id } = await params;
  const requested = (await searchParams).tab;
  const tab: Tab = TABS.find((t) => t === requested) ?? 'profile';
  const row = await orNotFound(getStudent(ctx, id));
  const { student } = row;
  const manager = canManageCentre(ctx.session);
  const today = todayIST();
  const base = `/centre/students/${student.id}`;
  const parentName = student.motherName || student.fatherName;
  const whatsapp = waLink(student.guardianPhone, `Hello${parentName ? ` ${parentName}` : ''}, this is ${ctx.centre.name}, about ${student.name}.`);

  return (
    <>
      <Link href="/centre/students" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-brand-700">
        <span aria-hidden>←</span> {t('Children')}
      </Link>

      <Card className="mb-5 animate-fade-up p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={student.name} src={student.photo || null} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold leading-tight text-ink-900">{student.name}</h1>
              <StatusBadge t={t} status={student.status} />
            </div>
            <p className="mt-1 text-[15px] text-ink-600">
              {[row.batchName ?? t('No class yet'), row.programmeName, row.yearName].filter(Boolean).join(', ')}
            </p>
            <p className="tabular text-sm text-ink-500">
              {student.admissionNo}
              {student.dob ? `, ${ageLabel(student.dob)}` : ''}
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <LinkButton href={`/centre/fees/collect?student=${student.id}`}>
              <IndianRupee size={17} /> {t('Take payment')}
            </LinkButton>
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
                <MessageCircle size={17} /> {t('WhatsApp parent')}
              </a>
            ) : null}
            <LinkButton href={`${base}/edit`} variant="secondary">
              <Pencil size={17} /> {t('Edit')}
            </LinkButton>
          </div>
        </div>
        {student.status !== 'active' ? (
          <Notice tone="amber" className="mt-4">
            {student.leftOn
              ? student.status === 'passed_out'
                ? t('Passed out on {date}', { date: formatDate(student.leftOn) })
                : t('Left on {date}', { date: formatDate(student.leftOn) })
              : student.status === 'passed_out'
                ? t('Passed out')
                : t('Left')}
            {student.leftReason ? `: ${student.leftReason}` : ''}
          </Notice>
        ) : null}
      </Card>

      <TabLinks
        active={tab}
        tabs={[
          { key: 'profile', label: t('Profile'), href: base },
          { key: 'fees', label: t('Fees'), href: `${base}?tab=fees` },
          { key: 'attendance', label: t('Attendance'), href: `${base}?tab=attendance` },
          { key: 'notes', label: t('Notes'), href: `${base}?tab=notes` },
        ]}
      />

      {tab === 'profile' ? <ProfileTab ctx={ctx} row={row} manager={manager} today={today} /> : null}
      {tab === 'fees' ? <FeesTab ctx={ctx} studentId={student.id} /> : null}
      {tab === 'attendance' ? <AttendanceTab ctx={ctx} studentId={student.id} admissionDate={student.admissionDate} today={today} /> : null}
      {tab === 'notes' ? (
        <Card className="max-w-2xl animate-fade-up">
          <CardHeader title={t('Notes')} description={t('Anything worth remembering about this child or the family.')} />
          <CardBody>
            <NotesTimeline kind="student" id={student.id} notes={await listNotes('student', student.id)} placeholder={t('Mother asked for a later pick-up time from Monday')} />
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

type Ctx = Awaited<ReturnType<typeof requireCentre>>;
type Row = Awaited<ReturnType<typeof getStudent>>;

async function ProfileTab({ ctx, row, manager, today }: { ctx: Ctx; row: Row; manager: boolean; today: string }) {
  const t = await getT();
  const { student } = row;
  const classes = await batchOptions(ctx);
  const hasLogin = Boolean(student.parentUserId && row.parentUsername);
  const parentName = student.motherName || student.fatherName;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="space-y-5">
        <Card className="animate-fade-up">
          <CardHeader title={t('Child')} />
          <CardBody>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail empty={t('Not added')} label={t('Date of birth')}>{student.dob ? `${formatDate(student.dob)} (${ageLabel(student.dob)})` : ''}</Detail>
              <Detail empty={t('Not added')} label={t('Gender')}>{student.gender ? t(student.gender) : null}</Detail>
              <Detail empty={t('Not added')} label={t('Admission date')}>{formatDate(student.admissionDate)}</Detail>
              <Detail empty={t('Not added')} label={t('Monthly fee')}>{student.monthlyFee === null ? t('Class fee') : inr(student.monthlyFee)}</Detail>
            </dl>
          </CardBody>
        </Card>
        <Card className="animate-fade-up">
          <CardHeader title={t('Family')} />
          <CardBody>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail empty={t('Not added')} label={t('Father')}>{student.fatherName}</Detail>
              <Detail empty={t('Not added')} label={t('Mother')}>{student.motherName}</Detail>
              <Detail empty={t('Not added')} label={t('Guardian mobile')}>
                {student.guardianPhone ? (
                  <a href={telLink(student.guardianPhone)} className="tabular inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                    <Phone size={15} /> {student.guardianPhone}
                  </a>
                ) : (
                  ''
                )}
              </Detail>
              <Detail empty={t('Not added')} label={t('Other mobile')}>
                {student.altPhone ? (
                  <a href={telLink(student.altPhone)} className="tabular inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                    <Phone size={15} /> {student.altPhone}
                  </a>
                ) : (
                  ''
                )}
              </Detail>
              <Detail empty={t('Not added')} label={t('Email')}>{student.email}</Detail>
              <Detail empty={t('Not added')} label={t('Address')} className="sm:col-span-2">
                {student.address}
              </Detail>
            </dl>
          </CardBody>
        </Card>
        <Card className="animate-fade-up">
          <CardHeader title={t('Care')} />
          <CardBody>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail empty={t('Not added')} label={t('Blood group')}>{student.bloodGroup}</Detail>
              <Detail empty={t('Not added')} label={t('T-shirt size')}>{student.tshirtSize}</Detail>
              <Detail empty={t('Not added')} label={t('Who collects the child')}>{student.pickupPerson}</Detail>
              <Detail empty={t('Not added')} label={t('Medical notes or allergies')} className="sm:col-span-2">
                {student.medicalNotes ? <span className="whitespace-pre-line font-medium text-accent-700">{student.medicalNotes}</span> : ''}
              </Detail>
            </dl>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="animate-fade-up">
          <CardHeader title={t('Parent login')} description={t('Lets the parent see fees, attendance and notices on their phone.')} />
          <CardBody className="space-y-3">
            {hasLogin ? (
              <dl className="grid gap-3">
                <Detail empty={t('Not added')} label={t('Username')}>
                  <span className="tabular font-semibold">{row.parentUsername}</span> {row.parentActive ? null : <Badge tone="amber">{t('Switched off')}</Badge>}
                </Detail>
                <Detail empty={t('Not added')} label={t('Last login')}>{row.parentLastLogin ? formatDateTime(row.parentLastLogin) : t('Never logged in')}</Detail>
              </dl>
            ) : (
              <p className="text-sm text-ink-600">
                {t('No login yet. The username will be the guardian mobile{phone}. Brothers and sisters with the same mobile share one login.', { phone: student.guardianPhone ? ` (${student.guardianPhone})` : '' })}
              </p>
            )}
            <ParentLogin studentId={student.id} hasLogin={hasLogin} phone={student.guardianPhone} parentName={parentName} />
          </CardBody>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader title={t('Class and status')} />
          <CardBody className="flex flex-col items-start gap-2">
            {student.status === 'active' ? <MoveClass studentId={student.id} currentBatchId={student.batchId ?? ''} classes={classes} /> : null}
            {manager && student.status === 'active' ? <MarkLeft studentId={student.id} name={student.name} today={today} admissionDate={student.admissionDate} /> : null}
            {manager && student.status !== 'active' ? <Readmit studentId={student.id} name={student.name} /> : null}
            {!manager && student.status !== 'active' ? <p className="text-sm text-ink-500">{t('Only the school head can re-admit a child.')}</p> : null}
            {manager ? (
              <div className="mt-2 w-full border-t border-ink-100 pt-3">
                <DeleteStudent studentId={student.id} name={student.name} />
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

async function FeesTab({ ctx, studentId }: { ctx: Ctx; studentId: string }) {
  const t = await getT();
  const fees = await studentFeeSummary(ctx, studentId);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { key: 'billed', label: t('Billed so far'), value: fees.billed, tone: 'text-ink-900' },
          { key: 'paid', label: t('Paid'), value: fees.paid, tone: 'text-mint-700' },
          { key: 'balance', label: t('Balance due'), value: fees.balance, tone: fees.balance > 0 ? 'text-accent-700' : 'text-ink-900' },
        ].map((tile) => (
          <Card key={tile.label} className="animate-fade-up p-5">
            <p className="text-sm font-medium text-ink-500">{tile.label}</p>
            <p className={cn('tabular mt-2 font-display text-[28px] font-bold leading-none', tile.tone)}>{inr(tile.value)}</p>
            {tile.key === 'balance' && fees.unpaidBills > 0 ? (
              <p className="mt-2 text-sm text-ink-500">
                {fees.unpaidBills === 1 ? t('{n} bill not fully paid', { n: fees.unpaidBills }) : t('{n} bills not fully paid', { n: fees.unpaidBills })}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <LinkButton href={`/centre/fees/collect?student=${studentId}`}>
          <IndianRupee size={17} /> {t('Take payment')}
        </LinkButton>
        <LinkButton href={`/centre/fees/new?student=${studentId}`} variant="secondary">
          {t('Raise a bill')}
        </LinkButton>
        <LinkButton href={`/centre/fees?student=${studentId}`} variant="secondary">
          {t('See all bills')}
        </LinkButton>
      </div>
      <Card className="animate-fade-up overflow-hidden">
        <CardHeader title={t('Last five receipts')} className="pb-4" />
        {fees.receipts.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t('Receipt')}</Th>
                <Th>{t('Date')}</Th>
                <Th>{t('For')}</Th>
                <Th>{t('Paid by')}</Th>
                <Th className="text-right">{t('Amount')}</Th>
              </tr>
            </thead>
            <tbody>
              {fees.receipts.map((receipt) => (
                <Tr key={receipt.id}>
                  <Td className="tabular whitespace-nowrap font-semibold">{receipt.receiptNo}</Td>
                  <Td className="whitespace-nowrap">{formatDate(receipt.paidOn)}</Td>
                  <Td>{receipt.title}</Td>
                  <Td className="uppercase">{receipt.method}</Td>
                  <Td className="tabular text-right font-semibold">{inr(receipt.amount)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="px-5 pb-5 text-sm text-ink-500">{t('No payment has been taken for this child yet.')}</p>
        )}
      </Card>
    </div>
  );
}

async function AttendanceTab({ ctx, studentId, admissionDate, today }: { ctx: Ctx; studentId: string; admissionDate: string; today: string }) {
  const t = await getT();
  const data = await studentAttendance(ctx, studentId);
  const { from, to } = periodRange(data.period);
  const marks = new Map(data.days.map((d) => [d.day, d.status]));
  const lastDay = Number(to.slice(8));
  const days = Array.from({ length: lastDay }, (_, i) => `${data.period}-${String(i + 1).padStart(2, '0')}`);
  const current = data.summary[data.summary.length - 1];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <Card className="animate-fade-up">
        <CardHeader title={periodLabel(data.period)} description={current.schoolDays ? t('Present {present} of {schoolDays} days, {percent}%', { present: current.present, schoolDays: current.schoolDays, percent: current.percent }) : t('No attendance marked this month yet')} />
        <CardBody>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((letter, i) => (
              <span key={i} className="text-xs font-semibold text-ink-400">
                {letter}
              </span>
            ))}
            {Array.from({ length: weekday(from) }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {days.map((d) => {
              const status = marks.get(d);
              const weekend = weekday(d) === 0 || weekday(d) === 6;
              return (
                <div
                  key={d}
                  title={status ? `${formatDate(d)}: ${t(status)}` : formatDate(d)}
                  className={cn(
                    'grid aspect-square place-items-center rounded-lg text-xs',
                    status ? MARK_STYLE[status] : weekend ? 'bg-ink-50 text-ink-300' : 'text-ink-500',
                    d === today && 'ring-2 ring-brand-500',
                    (d > today || d < admissionDate) && !status && 'opacity-50',
                  )}
                >
                  <span className="tabular leading-none">{Number(d.slice(8))}</span>
                  {status ? <span className="font-bold leading-none">{ATTENDANCE_LETTER[status]}</span> : null}
                </div>
              );
            })}
          </div>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            <span><strong className="text-mint-700">P</strong> {t('present')}</span>
            <span><strong className="text-accent-700">A</strong> {t('absent')}</span>
            <span><strong className="text-sun-700">L</strong> {t('leave')}</span>
            <span><strong>H</strong> {t('holiday')}</span>
          </p>
        </CardBody>
      </Card>

      <Card className="animate-fade-up self-start">
        <CardHeader title={t('Last three months')} description={t('Days present out of the days school was open.')} />
        <CardBody className="space-y-4">
          {data.summary.map((month) => (
            <div key={month.month}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold text-ink-800">{periodLabel(month.month)}</span>
                <span className="tabular text-ink-600">{month.schoolDays ? t('{present} of {schoolDays} days, {percent}%', { present: month.present, schoolDays: month.schoolDays, percent: month.percent }) : t('Nothing marked')}</span>
              </div>
              <Meter value={month.percent} tone={month.percent >= 75 ? 'green' : month.percent >= 50 ? 'amber' : 'red'} className="mt-1.5" />
            </div>
          ))}
          <LinkButton href="/centre/attendance" variant="secondary" size="sm">
            {t('Open attendance')}
          </LinkButton>
        </CardBody>
      </Card>
    </div>
  );
}
