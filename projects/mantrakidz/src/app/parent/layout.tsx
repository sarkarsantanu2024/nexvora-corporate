import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashShell } from '@/components/dash/shell';
import { requireSession } from '@/lib/auth';

export const metadata: Metadata = { title: { default: 'Parent', template: '%s | Mantra Kidz' }, robots: { index: false } };

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await requireSession(['parent']);
  return (
    <DashShell area="parent" subtitle="Parent corner" user={{ name: session.name, username: session.username, role: session.role }}>
      {children}
    </DashShell>
  );
}
