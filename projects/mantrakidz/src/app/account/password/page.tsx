import type { Metadata } from 'next';
import { Card } from '@/components/ui/core';
import { homeFor, requireSession } from '@/lib/auth';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Change password', robots: { index: false } };

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const session = await requireSession();
  const { first } = await searchParams;
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <Card className="w-full max-w-md animate-fade-up p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">{first ? 'Set your own password' : 'Change password'}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {first
            ? 'You were given a starting password. Choose one only you know before you continue.'
            : `Logged in as ${session.name} (${session.username}).`}
        </p>
        <PasswordForm home={homeFor(session.role)} first={Boolean(first)} />
      </Card>
    </div>
  );
}
