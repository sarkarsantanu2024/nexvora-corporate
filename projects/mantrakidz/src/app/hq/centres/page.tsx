import { Building2, LogIn, MapPin, UserRound } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchInput, UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, Meter, Notice, PageHeader, StatusBadge, buttonClass } from '@/components/ui/core';
import { CENTRE_STATUSES } from '@/db/schema';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { currentPeriod, periodLabel } from '@/lib/date';
import { inr, percent } from '@/lib/money';
import { getT } from '@/lib/t';
import { listCentres } from '@/server/hq/centres';
import { enterCentre } from '@/server/session-actions';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { CentreCreate } from './centre-create';

export const metadata: Metadata = { title: 'Centres' };

function Figure({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd className={cn('tabular mt-0.5 text-[15px] font-bold', alert ? 'text-accent-600' : 'text-ink-900')}>{value}</dd>
    </div>
  );
}

export default async function CentresPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  await requireSession(HQ_ROLES);
  const params = await readSearch(searchParams);
  const rows = await listCentres({ q: params.q, status: params.status, type: params.type });
  const filtered = Boolean(params.q || params.status || params.type);
  const month = periodLabel(currentPeriod());

  return (
    <>
      <PageHeader title={t('Centres')} description={t("Every centre with its strength, this month's collection and what is owed.")} actions={<CentreCreate />} />

      {params.pick ? (
        <Notice className="mb-4">{t('Choose a centre to work in. Press "Work in this centre" on its card to open its screens as head office.')}</Notice>
      ) : null}

      <FilterBar>
        <SearchInput placeholder={t('Search name, code, city or owner')} />
        <UrlSelect
          param="status"
          label={t('Status')}
          options={[{ value: '', label: t('All statuses') }, ...CENTRE_STATUSES.map((status) => ({ value: status, label: status.replace(/^\w/, (c) => c.toUpperCase()) }))]}
        />
        <UrlSelect
          param="type"
          label={t('Ownership')}
          options={[
            { value: '', label: t('Franchise and company') },
            { value: 'franchise', label: t('Franchise') },
            { value: 'company', label: t('Company-owned') },
          ]}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 size={26} />}
            title={filtered ? t('No centres match') : t('No centres yet')}
            text={filtered ? t('Try a different search or filter.') : t('Add the first centre here, or convert a franchise lead into one.')}
            action={filtered ? <Link href="/hq/centres" className={buttonClass('secondary')}>{t('Clear filters')}</Link> : <CentreCreate />}
          />
        </Card>
      ) : (
        <div className="grid animate-fade-up gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map((centre) => {
            const filled = percent(centre.onRoll, centre.seats);
            return (
              <Card key={centre.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="tabular text-xs font-bold text-brand-600">{centre.code}</p>
                    <Link href={`/hq/centres/${centre.id}`} className="block font-display text-lg font-bold leading-snug text-ink-900 hover:text-brand-700">
                      {centre.name}
                    </Link>
                  </div>
                  <StatusBadge t={t} status={centre.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} className="text-ink-400" /> {[centre.area, centre.city].filter(Boolean).join(', ') || t('Address not added')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserRound size={14} className="text-ink-400" /> {centre.ownerName || t('Owner not added')}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={centre.isCompanyOwned ? 'brand' : 'neutral'}>{centre.isCompanyOwned ? t('Company-owned') : t('Franchise')}</Badge>
                  {centre.isDemo ? <Badge tone="amber">{t('Sample')}</Badge> : null}
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-medium text-ink-600">{t('Children on roll')}</span>
                    <span className="tabular font-bold text-ink-900">
                      {centre.onRoll} <span className="font-medium text-ink-500">{t('of {seats} seats', { seats: centre.seats })}</span>
                    </span>
                  </div>
                  <Meter value={centre.onRoll} max={centre.seats || 1} tone={filled >= 85 ? 'green' : filled >= 50 ? 'brand' : 'amber'} />
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-100 pt-4">
                  <Figure label={t('Collected, {month}', { month: month.slice(0, 3) })} value={inr(centre.collection)} />
                  <Figure label={t('Fee dues')} value={inr(centre.dues)} alert={centre.dues > 0} />
                  <Figure label={t('Royalty due')} value={centre.isCompanyOwned ? t('None') : inr(centre.royaltyDue)} alert={centre.royaltyDue > 0} />
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/hq/centres/${centre.id}`} className={buttonClass('secondary', 'sm', 'flex-1')}>
                    {t('Details')}
                  </Link>
                  <form action={enterCentre.bind(null, centre.id)} className="flex-1">
                    <button type="submit" className={buttonClass('primary', 'sm', 'w-full')}>
                      <LogIn size={15} /> {t('Work in this centre')}
                    </button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
