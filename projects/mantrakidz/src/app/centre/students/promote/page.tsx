import { Shapes } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { batchOptions } from '@/server/centre/children/batches';
import { batchChildren } from '@/server/centre/children/students';
import { PromoteForm } from './promote-form';

export const metadata: Metadata = { title: 'Promote a class' };

/** Year-end: move the children of one class up to the next, or mark the leavers as passed out. */
export default async function PromotePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre/students');
  const { from } = await searchParams;
  const classes = await batchOptions(ctx);
  const withChildren = classes.filter((c) => c.filled > 0);
  const source = withChildren.find((c) => c.id === from);
  const children = source ? await batchChildren(ctx, source.id) : [];

  return (
    <>
      <PageHeader
        back={{ href: '/centre/students', label: 'Children' }}
        title="Promote a class"
        description="At the end of the year, move a class up to its next class. Tick who moves; anyone not ticked stays where they are."
      />
      {withChildren.length === 0 ? (
        <Card>
          <EmptyState icon={<Shapes size={26} />} title="No class has children yet" text="Once children are admitted into classes, you can move them up from here." />
        </Card>
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          <Card className="p-5">
            <p className="mb-1.5 text-sm font-semibold text-ink-700">Class to promote</p>
            <UrlSelect
              param="from"
              label="Class to promote"
              className="w-full sm:w-auto"
              options={[
                { value: '', label: 'Choose a class' },
                ...withChildren.map((c) => ({ value: c.id, label: `${c.name}, ${c.yearName} (${c.filled} ${c.filled === 1 ? 'child' : 'children'})` })),
              ]}
            />
          </Card>
          {source ? (
            <PromoteForm
              key={source.id}
              from={{ id: source.id, name: source.name, yearName: source.yearName }}
              students={children}
              targets={classes.filter((c) => c.id !== source.id)}
              today={todayIST()}
            />
          ) : null}
          <p className="text-sm text-ink-500">
            Next year&apos;s class not in the list? Add it first under{' '}
            <Link href="/centre/batches" className="font-semibold text-brand-700 underline">
              Classes
            </Link>
            , choosing the new academic year.
          </p>
        </div>
      )}
    </>
  );
}
