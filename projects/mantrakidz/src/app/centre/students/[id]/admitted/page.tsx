import { CircleCheck, ReceiptText, UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Card, LinkButton } from '@/components/ui/core';
import { requireCentre } from '@/lib/auth';
import { getStudent } from '@/server/centre/children/students';
import { orNotFound } from '../../form-data';
import { ParentLogin } from '../student-actions';

export const metadata: Metadata = { title: 'Child admitted' };

function Step({ n, title, text, children }: { n: number; title: string; text: string; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-4">
      <span className="tabular grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{n}</span>
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-semibold text-ink-900">{title}</p>
        <p className="text-sm text-ink-500">{text}</p>
      </div>
      {children}
    </li>
  );
}

/** Shown once, straight after admission: what was saved and what to do next. */
export default async function AdmittedPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCentre();
  const { id } = await params;
  const row = await orNotFound(getStudent(ctx, id));
  const { student } = row;
  const hasLogin = Boolean(student.parentUserId && row.parentUsername);

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="animate-fade-up overflow-hidden">
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-mint-100 text-mint-700">
            <CircleCheck size={30} />
          </span>
          <h1 className="font-display text-2xl font-bold text-ink-900">{student.name} is admitted</h1>
          <p className="mt-1 text-[15px] text-ink-600">
            Admission number <strong className="tabular text-ink-900">{student.admissionNo}</strong>
            {row.batchName ? `, ${row.batchName}` : row.programmeName ? `, ${row.programmeName}` : ''}
          </p>
        </div>
        <p className="border-t border-ink-100 px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">What to do next</p>
        <ol className="divide-y divide-ink-100">
          <Step n={1} title="Raise the admission bill" text="Admission fee, kit and anything else due now.">
            <LinkButton href={`/centre/fees/new?student=${student.id}`}>
              <ReceiptText size={17} /> Raise the bill
            </LinkButton>
          </Step>
          <Step
            n={2}
            title="Create parent login"
            text={hasLogin ? `Already has one: ${row.parentUsername}. You can reset its password.` : 'So the parent can see fees, attendance and notices.'}
          >
            <ParentLogin studentId={student.id} hasLogin={hasLogin} phone={student.guardianPhone} parentName={student.motherName || student.fatherName} />
          </Step>
          <Step n={3} title="Add another child" text="A brother or sister, or the next admission.">
            <LinkButton href="/centre/students/new" variant="secondary">
              <UserPlus size={17} /> Add another
            </LinkButton>
          </Step>
        </ol>
        <div className="flex justify-center border-t border-ink-100 px-5 py-4">
          <LinkButton href={`/centre/students/${student.id}`} variant="ghost">
            Open {student.name}&apos;s profile
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
