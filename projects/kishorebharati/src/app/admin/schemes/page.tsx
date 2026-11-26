import { Gift } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { sectionLabel } from '@/config/school';
import { BENEFIT_STATUSES } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { requirePlan } from '@/server/platform';
import { listBenefits } from '@/server/schemes/service';
import { BENEFIT_STATUS_LABELS, SCHEME_SUGGESTIONS } from '@/server/students/constants';
import { sectionChoices } from '@/server/students/service';
import { FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { BenefitForm, BulkBenefits, DeleteBenefit } from './scheme-tools';

export const metadata: Metadata = { title: 'Government schemes' };

export default async function SchemesPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const [data, choices] = await Promise.all([listBenefits(session, params), sectionChoices(session)]);
  const suggestions = [...new Set([...SCHEME_SUGGESTIONS, ...data.schemes])];
  const sections = choices.sections.map((s) => ({ id: s.id, label: sectionLabel(s, lang) }));
  const filtered = Boolean(params.q || params.scheme || params.status || params.section);

  return (
    <>
      <PageHeader
        title={t('Government schemes')}
        description={t('Sabooj Sathi, Taruner Swapna, scholarships and other schemes students get through the school, and where each one stands.')}
        actions={
          <>
            <BulkBenefits sections={sections} suggestions={suggestions} year={data.schoolYear} />
            <BenefitForm suggestions={suggestions} year={data.schoolYear} />
          </>
        }
      />

      {data.summary.length ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.summary.map((item) => (
            <Link
              key={item.scheme}
              href={`/admin/schemes${query({ ...params, scheme: params.scheme === item.scheme ? '' : item.scheme, page: '' })}`}
              scroll={false}
              className={cn('rounded-2xl border bg-white p-4 transition hover:border-brand-300', params.scheme === item.scheme ? 'border-brand-600 ring-1 ring-brand-600' : 'border-ink-200')}
            >
              <p className="flex items-center justify-between gap-2 font-semibold text-ink-900">
                <span className="truncate">{item.scheme}</span> <span className="tabular text-lg">{item.total}</span>
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-500">
                {BENEFIT_STATUSES.filter((s) => item.counts[s]).map((s) => (
                  <span key={s}>
                    {t(BENEFIT_STATUS_LABELS[s])} <span className="tabular font-semibold text-ink-700">{item.counts[s]}</span>
                  </span>
                ))}
              </p>
            </Link>
          ))}
        </div>
      ) : null}

      <FilterBar>
        <SearchInput placeholder={t('Search name or admission number')} />
        <UrlSelect param="year" label={t('Year')} options={data.years.map((y) => ({ value: y === data.currentYearName ? '' : y, label: y }))} />
        <UrlSelect param="scheme" label={t('Scheme')} options={[{ value: '', label: t('All schemes') }, ...data.schemes.map((s) => ({ value: s, label: s }))]} />
        <UrlSelect param="status" label={t('Status')} options={[{ value: '', label: t('Any status') }, ...BENEFIT_STATUSES.map((s) => ({ value: s, label: t(BENEFIT_STATUS_LABELS[s]) }))]} />
        <UrlSelect param="section" label={t('Section')} options={[{ value: '', label: t('All sections') }, ...sections.map((s) => ({ value: s.id, label: s.label }))]} />
      </FilterBar>

      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Student')}</Th>
                  <Th>{t('Scheme')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th>{t('Amount')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <Link href={`/admin/students/${row.studentId}`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {row.name}
                      </Link>
                      <p className="text-xs text-ink-500">
                        {[row.admissionNo, row.grade !== null ? sectionLabel({ grade: row.grade, name: row.sectionName ?? '', stream: row.stream ?? '', shift: row.shift ?? 'day' }, lang) : '', row.rollNo ? t('Roll {n}', { n: row.rollNo }) : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </Td>
                    <Td>
                      <p className="text-ink-800">{row.scheme}</p>
                      <p className="tabular text-xs text-ink-500">{row.year}</p>
                      {row.note ? <p className="text-xs text-ink-500">{row.note}</p> : null}
                    </Td>
                    <Td>
                      <StatusBadge status={row.status} label={t(BENEFIT_STATUS_LABELS[row.status])} />
                      {row.receivedOn ? <p className="mt-0.5 text-xs text-ink-500">{formatDate(row.receivedOn)}</p> : null}
                    </Td>
                    <Td className="tabular">{row.amount ? inr(row.amount) : ''}</Td>
                    <Td className="text-right">
                      <span className="inline-flex gap-1.5">
                        <BenefitForm suggestions={suggestions} year={row.year} benefit={row} />
                        <DeleteBenefit id={row.id} />
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<Gift size={26} />}
            title={filtered ? t('Nothing matches') : t('No schemes entered for {year}', { year: data.schoolYear })}
            text={filtered ? t('Try another scheme, status or class.') : t('Enter a scheme for one student, or for a whole section at once (Sabooj Sathi for Class 9, for example).')}
          />
        )}
      </Card>
    </>
  );
}
