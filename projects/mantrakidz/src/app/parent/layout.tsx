import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashShell } from '@/components/dash/shell';
import { uiDict } from '@/i18n/ui';
import { requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';

export const metadata: Metadata = { title: { default: 'Parent', template: '%s | Mantra Kidz' }, robots: { index: false } };

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(['parent']);
  const lang = await getLang();
  const t = await getT();
  return (
    <DashShell
      lang={lang}
      dict={uiDict(lang)}
      area="parent"
      subtitle={t('Parent corner')}
      user={{ name: session.name, username: session.username, role: session.role }}>
      {children}
    </DashShell>
  );
}
