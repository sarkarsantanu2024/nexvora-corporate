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
  await requireSession(HQ_ROLES);
  const params = await readSearch(searchParams);
  const rows = await listCentres({ q: params.q, status: params.status, type: params.type });
  const filtered = Boolean(params.q || params.status || params.type);
  const month = periodLabel(currentPeriod());

  return (
    <>
      <PageHeader title="Centres" description="Every centre with its strength, this month's collection and what is owed." actions={<CentreCreate />} />

      {params.pick ? (
        <Notice className="mb-4">Choose a centre to work in. Press &quot;Work in this centre&quot; on its card to open its screens as head office.</Notice>
      ) : null}

      <FilterBar>
        <SearchInput placeholder="Search name, code, city or owner" />
        <UrlSelect
          param="status"
          label="Status"
          options={[{ value: '', label: 'All statuses' }, ...CENTRE_STATUSES.map((status) => ({ value: status, label: status.replace(/^\w/, (c) => c.toUpperCase()) }))]}
        />
        <UrlSelect
          param="type"
          label="Ownership"
          options={[
            { value: '', label: 'Franchise and company' },
            { value: 'franchise', label: 'Franchise' },
            { value: 'company', label: 'Company-owned' },
          ]}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 size={26} />}
            title={filtered ? 'No centres match' : 'No centres yet'}
            text={filtered ? 'Try a different search or filter.' : 'Add the first centre here, or convert a franchise lead into one.'}
            action={filtered ? <Link href="/hq/centres" className={buttonClass('secondary')}>Clear filters</Link> : <CentreCreate />}
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
                  <StatusBadge status={centre.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} className="text-ink-400" /> {[centre.area, centre.city].filter(Boolean).join(', ') || 'Address not added'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserRound size={14} className="text-ink-400" /> {centre.ownerName || 'Owner not added'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={centre.isCompanyOwned ? 'brand' : 'neutral'}>{centre.isCompanyOwned ? 'Company-owned' : 'Franchise'}</Badge>
                  {centre.isDemo ? <Badge tone="amber">Sample</Badge> : null}
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-medium text-ink-600">Children on roll</span>
                    <span className="tabular font-bold text-ink-900">
                      {centre.onRoll} <span className="font-medium text-ink-500">of {centre.seats} seats</span>
                    </span>
                  </div>
                  <Meter value={centre.onRoll} max={centre.seats || 1} tone={filled >= 85 ? 'green' : filled >= 50 ? 'brand' : 'amber'} />
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-100 pt-4">
                  <Figure label={`Collected, ${month.slice(0, 3)}`} value={inr(centre.collection)} />
                  <Figure label="Fee dues" value={inr(centre.dues)} alert={centre.dues > 0} />
                  <Figure label="Royalty due" value={centre.isCompanyOwned ? 'None' : inr(centre.royaltyDue)} alert={centre.royaltyDue > 0} />
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/hq/centres/${centre.id}`} className={buttonClass('secondary', 'sm', 'flex-1')}>
                    Details
                  </Link>
                  <form action={enterCentre.bind(null, centre.id)} className="flex-1">
                    <button type="submit" className={buttonClass('primary', 'sm', 'w-full')}>
                      <LogIn size={15} /> Work in this centre
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
