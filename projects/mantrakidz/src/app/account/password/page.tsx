import type { Metadata } from 'next';
import { Card } from '@/components/ui/core';
import { UiLangProvider } from '@/components/ui/lang';
import { uiDict } from '@/i18n/ui';
import { homeFor, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Change password', robots: { index: false } };

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession();
  const { first } = await searchParams;
  return (
    <div className="app-ui grid min-h-dvh place-items-center px-4 py-10">
      <Card className="w-full max-w-md animate-fade-up p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">{first ? t('Set your own password') : t('Change password')}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {first
            ? t('You were given a starting password. Choose one only you know before you continue.')
            : t('Logged in as {name} ({username}).', { name: session.name, username: session.username })}
        </p>
        {/* The form is a client component outside the dashboard frame, so it gets its words here. */}
        <UiLangProvider lang={lang} dict={uiDict(lang)}>
          <PasswordForm home={homeFor(session.role)} first={Boolean(first)} />
        </UiLangProvider>
      </Card>
    </div>
  );
}
