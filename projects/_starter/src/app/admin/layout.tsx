import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashShell } from '@/components/dash/shell';
import { BRAND } from '@/config/brand';
import { uiDict } from '@/i18n/ui';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';

export const metadata: Metadata = { title: { default: 'Dashboard', template: `%s | ${BRAND.name}` }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(TEAM_ROLES);
  // The language the person chose in the top bar, and its words (none for English).
  const lang = await getLang();
  const t = await getT();
  return (
    <DashShell lang={lang} dict={uiDict(lang)} area="admin" subtitle={t('Dashboard')} user={{ name: session.name, username: session.username, role: session.role }}>
      {children}
    </DashShell>
  );
}
