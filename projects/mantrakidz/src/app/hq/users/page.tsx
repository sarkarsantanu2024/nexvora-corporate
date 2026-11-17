import type { Metadata } from 'next';
import { SearchInput } from '@/components/ui/client';
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { listLogins } from '@/server/hq/users';
import { readSearch, type Search } from '../_ui/bits';
import { NewLogin } from '../_ui/login-tools';
import { LoginsTable } from '../_ui/logins-table';

export const metadata: Metadata = { title: 'Team and logins' };

export default async function UsersPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(['hq_admin']);
  const params = await readSearch(searchParams);
  const data = await listLogins(session, params.pq);
  const searching = Boolean(params.pq);

  return (
    <>
      <PageHeader
        title={t('Team and logins')}
        description={t('Everyone who can log in. Passwords are never shown here; set a new starting password when someone forgets theirs.')}
        actions={<NewLogin scope={{ kind: 'hq' }} label={t('Add head office login')} />}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader title={t('Head office')} description={t('Admins can do everything. Staff cannot manage logins, settings, the activity log or royalty payments.')} className="pb-4" />
          <LoginsTable rows={data.hq} selfId={session.uid} />
        </Card>

        <Card>
          <CardHeader title={t('Centres')} description={t("Centre heads and centre staff. Add a centre's logins from the People tab of the centre.")} className="pb-4" />
          {data.centre.length ? (
            <LoginsTable rows={data.centre} selfId={session.uid} showCentre />
          ) : (
            <EmptyState title={t('No centre logins yet')} text={t('Open a centre and add its centre head under People.')} />
          )}
        </Card>

        <Card>
          {/* Collapsed until asked for: there can be hundreds of parents, and they are rarely the reason for coming here. */}
          <details open={searching} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-5">
              <span>
                <span className="block text-base font-bold text-ink-900">{t('Parents')}</span>
                <span className="mt-0.5 block text-sm text-ink-500">
                  {data.parentTotal === 1 ? t('{n} parent login. Centres create these when they admit a child.', { n: data.parentTotal }) : t('{n} parent logins. Centres create these when they admit a child.', { n: data.parentTotal })}
                </span>
              </span>
              <span className="text-sm font-semibold text-brand-700 group-open:hidden">{t('Show')}</span>
              <span className="hidden text-sm font-semibold text-brand-700 group-open:inline">{t('Hide')}</span>
            </summary>
            <CardBody className="pt-0">
              <SearchInput param="pq" placeholder={t('Search name, username or mobile')} />
            </CardBody>
            {data.parents.length ? (
              <>
                <LoginsTable rows={data.parents} selfId={session.uid} showCentre />
                {data.parents.length >= data.parentLimit ? <p className="px-5 py-3 text-sm text-ink-500">{t('Showing the first {parentLimit}. Search to find a particular parent.', { parentLimit: data.parentLimit })}</p> : null}
              </>
            ) : (
              <EmptyState className="py-8" title={searching ? t('No parent matches') : t('No parent logins yet')} text={searching ? t('Try the mobile number.') : t('They appear here once centres create them.')} />
            )}
          </details>
        </Card>
      </div>
    </>
  );
}
