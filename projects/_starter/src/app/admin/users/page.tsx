import type { Metadata } from 'next';
import { Card, CardHeader, PageHeader } from '@/components/ui/core';
import { ADMIN_ONLY, requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { listLogins } from '@/server/admin/users';
import { NewLogin } from '../_ui/login-tools';
import { LoginsTable } from '../_ui/logins-table';

export const metadata: Metadata = { title: 'Team and logins' };

export default async function UsersPage() {
  const t = await getT();
  const session = await requireSession(ADMIN_ONLY);
  const rows = await listLogins(session);

  return (
    <>
      <PageHeader
        title={t('Team and logins')}
        description={t('Everyone who can log in. Passwords are never shown here; set a new starting password when someone forgets theirs.')}
        actions={<NewLogin />}
      />

      <Card>
        <CardHeader title={t('Team')} description={t('Admins can do everything. Staff cannot manage logins, settings or the activity log.')} className="pb-4" />
        <LoginsTable rows={rows} selfId={session.uid} />
      </Card>
    </>
  );
}
