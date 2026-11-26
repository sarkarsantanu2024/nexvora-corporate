import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashShell } from '@/components/dash/shell';
import { uiDict } from '@/i18n/ui';
import { isHq, requireCentre } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getPlatform, requirePlan } from '@/server/platform';

export const metadata: Metadata = { title: { default: 'School', template: '%s | Mantra Kidz' }, robots: { index: false } };

export default async function CentreLayout({ children }: { children: ReactNode }) {
  const { session, centre } = await requireCentre();
  // Every school screen is part of the business software: the Platinum plan.
  await requirePlan('platinum');
  const lang = await getLang();
  const { plan } = await getPlatform();
  return (
    <DashShell
      lang={lang}
      dict={uiDict(lang)}
      area="centre"
      plan={plan}
      subtitle={centre.name.replace(/^Mantra Kidz\s+/i, '')}
      actingCentre={isHq(session.role) ? centre.name : undefined}
      user={{ name: session.name, username: session.username, role: session.role }}
    >
      {children}
    </DashShell>
  );
}
