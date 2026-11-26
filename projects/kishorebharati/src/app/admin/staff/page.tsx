import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Avatar, Badge, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { requirePlan } from '@/server/platform';
import { listStaff } from '@/server/staff/service';
import { STAFF_KIND_LABELS } from '@/server/students/constants';
import { ContactLinks, FilterBar, readSearch, type Search } from '../_ui/bits';
import { StaffActive, StaffForm, StaffLogin, TrashStaff } from './staff-tools';

export const metadata: Metadata = { title: 'Teachers and staff' };

export default async function StaffPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const data = await listStaff(session, params);
  const admin = isAdmin(session);
  const filtered = Boolean(params.q || params.kind || params.status);

  return (
    <>
      <PageHeader
        title={t('Teachers and staff')}
        description={t('The staff list, also shown on the website’s teachers page. Only the head of school gives logins.')}
        actions={<StaffForm />}
      />
      <FilterBar>
        <SearchInput placeholder={t('Search name, subject or mobile')} />
        <UrlSelect
          param="kind"
          label={t('Kind')}
          options={[{ value: '', label: t('Everyone') }, { value: 'teaching', label: t(STAFF_KIND_LABELS.teaching) }, { value: 'non_teaching', label: t(STAFF_KIND_LABELS.non_teaching) }]}
        />
        <UrlSelect
          param="status"
          label={t('Status')}
          options={[
            { value: '', label: t('Working here') },
            { value: 'left', label: t('Left') },
            { value: 'all', label: t('Everyone') },
          ]}
        />
      </FilterBar>

      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Name')}</Th>
                  <Th>{t('Designation')}</Th>
                  <Th>{t('Login')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id} className={row.active ? '' : 'opacity-60'}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={row.name} src={row.photo} size={36} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900">{lang === 'bn' && row.nameBn ? row.nameBn : row.name}</p>
                          <p className="text-xs text-ink-500">{[lang === 'bn' ? (row.nameBn ? row.name : '') : row.nameBn, row.phone].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-ink-800">{row.designation || t(STAFF_KIND_LABELS[row.kind])}</p>
                      {row.subjects ? <p className="text-xs text-ink-500">{row.subjects}</p> : null}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!row.active ? <Badge tone="neutral">{t('Left')}</Badge> : null}
                        {row.showOnWebsite && row.active ? <Badge tone="blue">{t('On the website')}</Badge> : null}
                      </div>
                    </Td>
                    <Td>
                      {row.login ? (
                        <span className="text-sm">
                          <span className="tabular font-semibold text-ink-800">{row.login.username}</span>
                          {!row.login.active ? <Badge tone="neutral" className="ml-1">{t('Switched off')}</Badge> : null}
                        </span>
                      ) : (
                        <span className="text-sm text-ink-400">{t('No login')}</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <span className="inline-flex flex-wrap justify-end gap-1.5">
                        <ContactLinks phone={row.phone} email={row.email} />
                        {admin && row.active ? <StaffLogin id={row.id} name={row.name} kind={row.kind} username={row.login?.username ?? ''} /> : null}
                        <StaffForm staff={row} />
                        <StaffActive id={row.id} name={row.name} active={row.active} />
                        {admin ? <TrashStaff id={row.id} name={row.name} /> : null}
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
            icon={<Users size={26} />}
            title={filtered ? t('No one matches') : t('No staff yet')}
            text={filtered ? t('Try another search or filter.') : t('Add the teachers and the office, library and support staff.')}
            action={filtered ? undefined : <StaffForm />}
          />
        )}
      </Card>
    </>
  );
}
