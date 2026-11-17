import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashShell } from '@/components/dash/shell';
import { uiDict } from '@/i18n/ui';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';

export const metadata: Metadata = { title: { default: 'Head office', template: '%s | Mantra Kidz HQ' }, robots: { index: false } };

export default async function HqLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(HQ_ROLES);
  const lang = await getLang();
  const t = await getT();
  return (
    <DashShell
      lang={lang}
      dict={uiDict(lang)}
      area="hq"
      subtitle={t('Head office')}
      user={{ name: session.name, username: session.username, role: session.role }}>
      {children}
    </DashShell>
  );
}
