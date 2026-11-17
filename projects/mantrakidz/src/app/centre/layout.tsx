import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashShell } from '@/components/dash/shell';
import { uiDict } from '@/i18n/ui';
import { isHq, requireCentre } from '@/lib/auth';
import { getLang } from '@/lib/lang';

export const metadata: Metadata = { title: { default: 'Centre', template: '%s | Mantra Kidz' }, robots: { index: false } };

export default async function CentreLayout({ children }: { children: ReactNode }) {
  const { session, centre } = await requireCentre();
  const lang = await getLang();
  return (
    <DashShell
      lang={lang}
      dict={uiDict(lang)}
      area="centre"
      subtitle={centre.name.replace(/^Mantra Kidz\s+/i, '')}
      actingCentre={isHq(session.role) ? centre.name : undefined}
      user={{ name: session.name, username: session.username, role: session.role }}
    >
      {children}
    </DashShell>
  );
}
