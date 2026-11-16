import { ArrowUpFromLine, Download, GraduationCap, UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Avatar, buttonClass, Card, EmptyState, LinkButton, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { batchOptions, listProgrammes } from '@/server/centre/children/batches';
import { listStudents } from '@/server/centre/children/students';

export const metadata: Metadata = { title: 'Children' };

type Search = { q?: string; batch?: string; programme?: string; status?: string; page?: string };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Search> }) {
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
        title="Children"
        description="Every child admitted at this centre. Open a child to see fees, attendance and family details."
        actions={
          <>
            {canManageCentre(ctx.session) ? (
              <LinkButton href="/centre/students/promote" variant="secondary">
                <ArrowUpFromLine size={17} /> Promote a class
              </LinkButton>
            ) : null}
            {/* A plain link: the browser downloads the file. */}
            <a href={`/centre/students/export${exportQuery ? `?${exportQuery}` : ''}`} className={buttonClass('secondary')}>
              <Download size={17} /> CSV
            </a>
            <LinkButton href="/centre/students/new">
              <UserPlus size={18} /> Admit a child
            </LinkButton>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search name, admission no. or mobile" />
        <UrlSelect
          param="batch"
          label="Class"
          options={[{ value: '', label: 'All classes' }, ...classes.map((c) => ({ value: c.id, label: `${c.name}${c.isCurrentYear ? '' : ` (${c.yearName})`}` }))]}
        />
        <UrlSelect param="programme" label="Programme" options={[{ value: '', label: 'All programmes' }, ...programmes.map((p) => ({ value: p.id, label: p.name }))]} />
        <UrlSelect
          param="status"
          label="Status"
          options={[
            { value: '', label: 'Active' },
            { value: 'left', label: 'Left' },
            { value: 'passed_out', label: 'Passed out' },
            { value: 'all', label: 'Everyone' },
          ]}
        />
      </div>

      <Card className="animate-fade-up overflow-hidden">
        {data.rows.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={26} />}
            title={filtered ? 'No children match' : 'No children yet'}
            text={filtered ? 'Try a different search, or clear the filters.' : 'Admit your first child to start taking attendance and raising fee bills.'}
            action={
              filtered ? undefined : (
                <LinkButton href="/centre/students/new">
                  <UserPlus size={18} /> Admit a child
                </LinkButton>
              )
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Child</Th>
                  <Th>Admission no.</Th>
                  <Th>Class</Th>
                  <Th>Guardian mobile</Th>
                  <Th>Status</Th>
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
                      {row.batchName ?? <span className="text-ink-400">No class</span>}
                      {row.programmeName && row.batchName && !row.batchName.startsWith(row.programmeName) ? <p className="text-xs text-ink-500">{row.programmeName}</p> : null}
                    </Td>
                    <Td className="tabular whitespace-nowrap">{row.guardianPhone}</Td>
                    <Td>
                      <StatusBadge status={row.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <p className="px-4 pt-3 text-sm text-ink-500">
              {data.total} {data.total === 1 ? 'child' : 'children'}
            </p>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
            <div className="h-3" />
          </>
        )}
      </Card>
    </>
  );
}
