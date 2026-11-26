import { TabLinks } from '@/components/ui/core';
import type { Session } from '@/lib/session-token';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';

export type FeesTab = 'dues' | 'bills' | 'collect' | 'run' | 'heads' | 'pay' | 'daybook';

/** The row of tabs on every Fees screen. Bill run, Fee heads and Payment details are for the head of school. */
export async function FeesTabs({ session, active }: { session: Session; active: FeesTab }) {
  const t = await getT();
  const admin = isAdmin(session);
  const tabs = [
    { key: 'dues', label: t('Dues'), href: '/admin/fees' },
    { key: 'bills', label: t('Bills'), href: '/admin/fees?tab=bills' },
    { key: 'collect', label: t('Take payment'), href: '/admin/fees/collect' },
    { key: 'daybook', label: t('Day book'), href: '/admin/fees?tab=daybook' },
    ...(admin
      ? [
          { key: 'run', label: t('Bill run'), href: '/admin/fees/run' },
          { key: 'heads', label: t('Fee heads'), href: '/admin/fees?tab=heads' },
          { key: 'pay', label: t('Payment details'), href: '/admin/fees?tab=pay' },
        ]
      : []),
  ];
  return <TabLinks tabs={tabs} active={active} />;
}
