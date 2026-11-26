import { Award, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, LinkButton, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { CERTIFICATE_KINDS } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';
import { getT } from '@/lib/t';
import { listCertificates } from '@/server/certificates/service';
import { requirePlan } from '@/server/platform';
import { CERTIFICATE_LABELS } from '@/server/students/constants';
import { FilterBar, query, readSearch, type Search } from '../_ui/bits';

export const metadata: Metadata = { title: 'Certificates' };

export default async function CertificatesPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const data = await listCertificates(session, params);
  const filtered = Boolean(params.q || params.kind || params.voided);

  return (
    <>
      <PageHeader
        title={t('Certificates')}
        description={t('The register of transfer, character and bonafide certificates, with their serial numbers. A wrong one is voided, never deleted.')}
        actions={
          <LinkButton href={`/admin/certificates/new${query({ kind: params.kind })}`}>
            <Plus size={18} /> {t('Issue certificate')}
          </LinkButton>
        }
      />

      <div className="no-print mb-4 flex flex-wrap gap-2">
        {[{ key: '', label: t('All') }, ...CERTIFICATE_KINDS.map((kind) => ({ key: kind as string, label: t(CERTIFICATE_LABELS[kind]), n: data.counts[kind] }))].map((item) => (
          <Link
            key={item.key || 'all'}
            href={`/admin/certificates${query({ q: params.q, voided: params.voided, kind: item.key })}`}
            scroll={false}
            className={cn(
              'rounded-xl border px-3.5 py-2 text-sm transition',
              (params.kind ?? '') === item.key ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
            )}
          >
            <span className="font-medium">{item.label}</span> {'n' in item ? <span className="tabular ml-1 font-bold">{item.n}</span> : null}
          </Link>
        ))}
      </div>

      <FilterBar>
        <SearchInput placeholder={t('Search name, admission or serial number')} />
        <UrlSelect
          param="voided"
          label={t('Void')}
          options={[
            { value: '', label: t('Issued and void') },
            { value: 'no', label: t('Issued only') },
            { value: 'yes', label: t('Void only') },
          ]}
        />
      </FilterBar>

      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Serial number')}</Th>
                  <Th>{t('Certificate')}</Th>
                  <Th>{t('Student')}</Th>
                  <Th>{t('Issued on')}</Th>
                  <Th>{t('Status')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id} className={row.voidedAt ? 'opacity-70' : ''}>
                    <Td className="tabular font-semibold">
                      <Link href={`/admin/certificates/${row.id}`} className={cn('hover:text-brand-700', row.voidedAt && 'line-through')}>
                        {row.serialNo}
                      </Link>
                    </Td>
                    <Td>{t(CERTIFICATE_LABELS[row.kind])}</Td>
                    <Td>
                      <Link href={`/admin/students/${row.studentId}`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {row.name}
                      </Link>
                      <p className="tabular text-xs text-ink-500">{row.admissionNo}</p>
                    </Td>
                    <Td className="whitespace-nowrap">{formatDate(row.issuedOn)}</Td>
                    <Td>
                      {row.voidedAt ? (
                        <span>
                          <StatusBadge status="voided" label={t('Void')} />
                          <span className="block text-xs text-ink-500">{row.voidReason}</span>
                        </span>
                      ) : (
                        <StatusBadge status="done" label={t('Issued')} />
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<Award size={26} />}
            title={filtered ? t('No certificates match') : t('No certificates issued yet')}
            text={filtered ? t('Try another kind or search.') : t('Issue a transfer, character or bonafide certificate. The details come from the student’s record and are kept as printed.')}
            action={
              filtered ? undefined : (
                <LinkButton href="/admin/certificates/new">
                  <Plus size={18} /> {t('Issue certificate')}
                </LinkButton>
              )
            }
          />
        )}
      </Card>
    </>
  );
}
