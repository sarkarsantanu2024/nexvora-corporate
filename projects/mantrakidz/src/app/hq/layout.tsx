import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashShell } from '@/components/dash/shell';
import { HQ_ROLES, requireSession } from '@/lib/auth';

export const metadata: Metadata = { title: { default: 'Head office', template: '%s | Mantra Kidz HQ' }, robots: { index: false } };

export default async function HqLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(HQ_ROLES);
  return (
    <DashShell area="hq" subtitle="Head office" user={{ name: session.name, username: session.username, role: session.role }}>
      {children}
    </DashShell>
  );
}
