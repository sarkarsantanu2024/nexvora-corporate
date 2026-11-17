import { Plus, Shapes } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { listProgrammes } from '@/server/hq/admin';
import { NUM } from '../_ui/bits';

export const metadata: Metadata = { title: 'Programmes' };

/** Full class names, so Tailwind keeps them in the stylesheet. */
const SWATCH: Record<string, string> = { sun: 'bg-sun-400', coral: 'bg-coral-400', mint: 'bg-mint-400', sky: 'bg-sky-400', indigo: 'bg-brand-600' };

export default async function ProgrammesPage() {
  const t = await getT();
  await requireSession(HQ_ROLES);
  const rows = await listProgrammes();
  const add = (
    <LinkButton href="/hq/programmes/new">
      <Plus size={18} /> {t('Add programme')}
    </LinkButton>
  );

  return (
    <>
      <PageHeader title={t('Programmes')} description={t('The classes Mantra Kidz offers. This list drives the Programmes pages of the website and what the schools can admit children into.')} actions={add} />
      <Card>
        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th className="text-right">{t('Order')}</Th>
                <Th>{t('Programme')}</Th>
                <Th>{t('Age')}</Th>
                <Th>{t('Timing')}</Th>
                <Th className="text-right">{t('Seats in a class')}</Th>
                <Th className="text-right">{t('Suggested fee')}</Th>
                <Th className="text-right">{t('Children on roll')}</Th>
                <Th>{t('Status')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, children }) => (
                <Tr key={row.id}>
                  <Td className={NUM}>{row.sort}</Td>
                  <Td>
                    <Link href={`/hq/programmes/${row.id}`} className="flex items-center gap-2.5 font-semibold text-ink-900 hover:text-brand-700">
                      <span className={cn('h-3 w-3 shrink-0 rounded-full', SWATCH[row.color] ?? 'bg-ink-300')} />
                      {row.name}
                    </Link>
                    {row.tagline ? <p className="ml-[22px] text-xs text-ink-500">{row.tagline}</p> : null}
                  </Td>
                  <Td className="whitespace-nowrap">{row.ageLabel || <span className="text-ink-400">{t('Not added')}</span>}</Td>
                  <Td className="whitespace-nowrap">{row.timing || <span className="text-ink-400">{t('Not added')}</span>}</Td>
                  <Td className={NUM}>{row.seatsPerClass}</Td>
                  <Td className={NUM}>{row.suggestedMonthlyFee ? inr(row.suggestedMonthlyFee) : <span className="text-ink-400">{t('Not set')}</span>}</Td>
                  <Td className={NUM}>{children}</Td>
                  <Td>
                    <Badge tone={row.active ? 'green' : 'neutral'}>{row.active ? t('Active') : t('Inactive')}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={<Shapes size={26} />} title={t('No programmes yet')} text={t('Add Play Group, Nursery and the other classes the school offers. The website and the schools use this list.')} action={add} />
        )}
      </Card>
    </>
  );
}
