import { ArrowUpFromLine, Download, GraduationCap, UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Avatar, buttonClass, Card, EmptyState, LinkButton, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { getT } from '@/lib/t';
import { batchOptions, listProgrammes } from '@/server/centre/children/batches';
import { listStudents } from '@/server/centre/children/students';

export const metadata: Metadata = { title: 'Children' };

type Search = { q?: string; batch?: string; programme?: string; status?: string; page?: string };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const params = await searchParams;
  const [data, classes, programmes] = await Promise.all([
    listStudents(ctx, { ...params, page: Number(params.page) || 1 }),
    batchOptions(ctx, { includeInactive: true }),
    listProgrammes(),
  ]);
  const filtered = Boolean(params.q || params.batch || params.programme || params.status);
  const exportQuery = new URLSearchParams(Object.entries({ q: params.q, batch: params.batch, programme: params.programme, status: params.status }).filter((e): e is [string, string] => Boolean(e[1]))).toString();

  return (
    <>
      <PageHeader
        title={t('Children')}
        description={t('Every child admitted at this centre. Open a child to see fees, attendance and family details.')}
        actions={
          <>
            {canManageCentre(ctx.session) ? (
              <LinkButton href="/centre/students/promote" variant="secondary">
                <ArrowUpFromLine size={17} /> {t('Promote a class')}
              </LinkButton>
            ) : null}
            {/* A plain link: the browser downloads the file. */}
            <a href={`/centre/students/export${exportQuery ? `?${exportQuery}` : ''}`} className={buttonClass('secondary')}>
              <Download size={17} /> {t('CSV')}
            </a>
            <LinkButton href="/centre/students/new">
              <UserPlus size={18} /> {t('Admit a child')}
            </LinkButton>
          </>
        }
      />

      <div className="mb-4 filter-bar flex flex-wrap items-center gap-2">
        <SearchInput placeholder={t('Search name, admission no. or mobile')} />
        <UrlSelect
          param="batch"
          label={t('Class')}
          options={[{ value: '', label: t('All classes') }, ...classes.map((c) => ({ value: c.id, label: `${c.name}${c.isCurrentYear ? '' : ` (${c.yearName})`}` }))]}
        />
        <UrlSelect param="programme" label={t('Programme')} options={[{ value: '', label: t('All programmes') }, ...programmes.map((p) => ({ value: p.id, label: p.name }))]} />
        <UrlSelect
          param="status"
          label={t('Status')}
          options={[
            { value: '', label: t('Active') },
            { value: 'left', label: t('Left') },
            { value: 'passed_out', label: t('Passed out') },
            { value: 'all', label: t('Everyone') },
          ]}
        />
      </div>

      <Card className="animate-fade-up overflow-hidden">
        {data.rows.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={26} />}
            title={filtered ? t('No children match') : t('No children yet')}
            text={filtered ? t('Try a different search, or clear the filters.') : t('Admit your first child to start taking attendance and raising fee bills.')}
            action={
              filtered ? undefined : (
                <LinkButton href="/centre/students/new">
                  <UserPlus size={18} /> {t('Admit a child')}
                </LinkButton>
              )
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Child')}</Th>
                  <Th>{t('Admission no.')}</Th>
                  <Th>{t('Class')}</Th>
                  <Th>{t('Guardian mobile')}</Th>
                  <Th>{t('Status')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <Link href={`/centre/students/${row.id}`} className="flex items-center gap-3">
                        <Avatar name={row.name} src={row.photo || null} size={38} />
                        <span className="font-semibold text-ink-900 hover:text-brand-700">{row.name}</span>
                      </Link>
                    </Td>
                    <Td className="tabular whitespace-nowrap">{row.admissionNo}</Td>
                    <Td>
                      {row.batchName ?? <span className="text-ink-400">{t('No class')}</span>}
                      {row.programmeName && row.batchName && !row.batchName.startsWith(row.programmeName) ? <p className="text-xs text-ink-500">{row.programmeName}</p> : null}
                    </Td>
                    <Td className="tabular whitespace-nowrap">{row.guardianPhone}</Td>
                    <Td>
                      <StatusBadge t={t} status={row.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <p className="px-4 pt-3 text-sm text-ink-500">
              {data.total === 1 ? t('{n} child', { n: data.total }) : t('{n} children', { n: data.total })}
            </p>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
            <div className="h-3" />
          </>
        )}
      </Card>
    </>
  );
}
