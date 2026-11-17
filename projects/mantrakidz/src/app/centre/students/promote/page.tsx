import { Shapes } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { rich } from '@/i18n/rich';
import { getT } from '@/lib/t';
import { batchOptions } from '@/server/centre/children/batches';
import { batchChildren } from '@/server/centre/children/students';
import { PromoteForm } from './promote-form';

export const metadata: Metadata = { title: 'Promote a class' };

/** Year-end: move the children of one class up to the next, or mark the leavers as passed out. */
export default async function PromotePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const t = await getT();
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
        back={{ href: '/centre/students', label: t('Children') }}
        title={t('Promote a class')}
        description={t('At the end of the year, move a class up to its next class. Tick who moves; anyone not ticked stays where they are.')}
      />
      {withChildren.length === 0 ? (
        <Card>
          <EmptyState icon={<Shapes size={26} />} title={t('No class has children yet')} text={t('Once children are admitted into classes, you can move them up from here.')} />
        </Card>
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          <Card className="p-5">
            <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Class to promote')}</p>
            <UrlSelect
              param="from"
              label={t('Class to promote')}
              className="w-full sm:w-auto"
              options={[
                { value: '', label: t('Choose a class') },
                ...withChildren.map((c) => ({ value: c.id, label: `${c.name}, ${c.yearName} (${c.filled === 1 ? t('{n} child', { n: c.filled }) : t('{n} children', { n: c.filled })})` })),
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
            {rich(t("Next year's class not in the list? Add it first under {link}, choosing the new academic year."), {
              link: (
                <Link href="/centre/batches" className="font-semibold text-brand-700 underline">
                  {t('Classes')}
                </Link>
              ),
            })}
          </p>
        </div>
      )}
    </>
  );
}
