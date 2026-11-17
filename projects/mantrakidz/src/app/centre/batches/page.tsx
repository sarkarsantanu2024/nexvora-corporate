import { Clock, Shapes, UserRound } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UrlSelect } from '@/components/ui/client';
import { Avatar, Badge, Card, EmptyState, Meter, PageHeader } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { rich } from '@/i18n/rich';
import { getT } from '@/lib/t';
import { listBatches, listProgrammes, NEXT_YEAR, yearChoices } from '@/server/centre/children/batches';
import { teacherOptions } from '@/server/centre/children/staff';
import { BatchCardActions, BatchFormButton } from './batch-form';

export const metadata: Metadata = { title: 'Classes' };

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const { year } = await searchParams;
  const manager = canManageCentre(ctx.session);
  const [data, years, programmes, teachers] = await Promise.all([listBatches(ctx, { yearId: year }), yearChoices(), listProgrammes(), teacherOptions(ctx)]);
  const options = { programmes, years: years.choices, teachers };
  const existingYears = years.choices.filter((y) => y.id !== NEXT_YEAR);
  const addButton = manager ? <BatchFormButton options={options} defaultYearId={data.yearId || years.currentId} /> : null;
  const seats = data.batches.filter((b) => b.active).reduce((sum, b) => sum + b.capacity, 0);
  const filled = data.batches.filter((b) => b.active).reduce((sum, b) => sum + b.filled, 0);

  return (
    <>
      <PageHeader
        title={t('Classes')}
        description={data.batches.length ? t('{filled} of {seats} seats filled across {n} open classes.', { filled, seats, n: data.batches.filter((b) => b.active).length }) : t('The class sections of this centre, with their teacher and seats.')}
        actions={
          <>
            {existingYears.length > 1 ? (
              <UrlSelect
                param="year"
                label={t('Academic year')}
                options={existingYears.map((y) => ({ value: y.isCurrent ? '' : y.id, label: y.isCurrent ? t('{name} (this year)', { name: y.name }) : y.name }))}
              />
            ) : null}
            {addButton}
          </>
        }
      />

      {data.batches.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Shapes size={26} />}
            title={t('No classes for this year yet')}
            text={manager ? t('Add a class for each programme you run, such as Nursery A. Children are then admitted into a class.') : t('The centre head adds the classes. Once added, they show here with their children.')}
            action={addButton ?? undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.batches.map((batch) => {
            const full = batch.filled >= batch.capacity;
            return (
              <Card key={batch.id} className={cn('flex animate-fade-up flex-col p-5', !batch.active && 'opacity-70')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge tone="brand">{batch.programmeName}</Badge>
                    <h2 className="mt-1.5 font-display text-xl font-bold leading-tight text-ink-900">{batch.name}</h2>
                  </div>
                  {!batch.active ? <Badge>{t('Closed')}</Badge> : full ? <Badge tone="amber">{t('Full')}</Badge> : null}
                </div>
                <dl className="mt-3 space-y-1.5 text-sm text-ink-600">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="shrink-0 text-ink-400" />
                    <dt className="sr-only">{t('Timing')}</dt>
                    <dd>{batch.timing || t('Timing not set')}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserRound size={15} className="shrink-0 text-ink-400" />
                    <dt className="sr-only">{t('Teacher')}</dt>
                    <dd>{batch.teacherName ?? t('No teacher assigned')}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-ink-800">
                      {rich(t('{filled} of {capacity} seats filled'), { filled: <span className="tabular">{batch.filled}</span>, capacity: <span className="tabular">{batch.capacity}</span> })}
                    </span>
                    <span className="tabular text-ink-500">{t('{n} left', { n: Math.max(0, batch.capacity - batch.filled) })}</span>
                  </div>
                  <Meter value={batch.filled} max={batch.capacity} tone={full ? 'amber' : 'brand'} />
                </div>

                {batch.children.length ? (
                  <details className="group mt-4 border-t border-ink-100 pt-3" open={data.batches.length <= 2}>
                    <summary className="cursor-pointer list-none text-sm font-semibold text-brand-700 hover:underline">
                      <span className="group-open:hidden">{t('Show the children')}</span>
                      <span className="hidden group-open:inline">{t('Hide the children')}</span>
                    </summary>
                    <ul className="mt-2 space-y-0.5">
                      {batch.children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/centre/students/${child.id}`} className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink-800 hover:bg-brand-50">
                            <Avatar name={child.name} src={child.photo || null} size={26} />
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <p className="mt-4 border-t border-ink-100 pt-3 text-sm text-ink-500">{t('No children in this class yet.')}</p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
                  {batch.active ? (
                    <Link href={`/centre/attendance?batch=${batch.id}`} className="mr-auto text-sm font-semibold text-brand-700 hover:underline">
                      {t('Take attendance')}
                    </Link>
                  ) : (
                    <span className="mr-auto" />
                  )}
                  {manager ? (
                    <>
                      <BatchFormButton
                        options={options}
                        defaultYearId={data.yearId}
                        edit={{
                          id: batch.id,
                          hasChildren: batch.records > 0,
                          values: {
                            programmeId: batch.programmeId,
                            academicYearId: batch.academicYearId,
                            name: batch.name,
                            capacity: String(batch.capacity),
                            timing: batch.timing,
                            teacherId: batch.teacherId ?? '',
                          },
                        }}
                      />
                      <BatchCardActions id={batch.id} name={batch.name} active={batch.active} hasChildren={batch.records > 0} />
                    </>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
