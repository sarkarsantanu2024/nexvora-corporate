import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashShell } from '@/components/dash/shell';
import { BRAND } from '@/config/brand';
import { uiDict } from '@/i18n/ui';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { getPlatform } from '@/server/platform';

export const metadata: Metadata = { title: { default: 'Dashboard', template: `%s | ${BRAND.name}` }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(DASH_ROLES);
  // The language the person chose in the top bar, and its words (none for English).
  const lang = await getLang();
  const t = await getT();
  const { plan } = await getPlatform();
  return (
    <DashShell lang={lang} dict={uiDict(lang)} area="admin" plan={plan} subtitle={t('Dashboard')} user={{ name: session.name, username: session.username, role: session.role }}>
      {children}
    </DashShell>
  );
}
