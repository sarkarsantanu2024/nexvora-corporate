import { Badge, Table, Td, Th, Tr } from '@/components/ui/core';
import { ROLE_LABELS } from '@/components/dash/nav';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import type { LoginRow } from '@/server/hq/users';
import { LoginActions } from './login-tools';

/** One table of logins, used for the head office team, centre logins and parents. */
export async function LoginsTable({ rows, selfId, showCentre, canManage = true }: { rows: LoginRow[]; selfId: string; showCentre?: boolean; canManage?: boolean }) {
  const t = await getT();
  const now = Date.now();
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Username')}</Th>
          <Th>{t('Role')}</Th>
          {showCentre ? <Th>{t('Centre')}</Th> : null}
          <Th>{t('Last login')}</Th>
          <Th>{t('Status')}</Th>
          {canManage ? <Th /> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((user) => {
          const locked = Boolean(user.lockedUntil && user.lockedUntil.getTime() > now);
          return (
            <Tr key={user.id}>
              <Td>
                <span className="font-semibold text-ink-900">{user.name}</span>
                {user.id === selfId ? <span className="ml-1.5 text-xs text-ink-500">{t('(you)')}</span> : null}
                {user.phone ? <p className="tabular text-xs text-ink-500">{user.phone}</p> : null}
              </Td>
              <Td className="tabular">{user.username}</Td>
              <Td className="whitespace-nowrap">{t(ROLE_LABELS[user.role])}</Td>
              {showCentre ? <Td>{user.centreName ?? <span className="text-ink-400">{t('None')}</span>}</Td> : null}
              <Td className="whitespace-nowrap">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : <span className="text-ink-400">{t('Never')}</span>}</Td>
              <Td>
                <span className="flex flex-wrap gap-1">
                  <Badge tone={user.active ? 'green' : 'neutral'}>{user.active ? t('Active') : t('Inactive')}</Badge>
                  {locked ? <Badge tone="red">{t('Locked')}</Badge> : null}
                  {user.mustChangePassword ? <Badge tone="amber">{t('Must change password')}</Badge> : null}
                </span>
              </Td>
              {canManage ? (
                <Td className="text-right">
                  <LoginActions id={user.id} username={user.username} active={user.active} locked={locked} isSelf={user.id === selfId} />
                </Td>
              ) : null}
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
