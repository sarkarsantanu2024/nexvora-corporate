'use client';

/** Earlier published versions, each with who, when, how, and a Restore button. */
import { History, Mic, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/core';
import { ConfirmButton, useToast } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/date';
import { LANG_NAMES } from '@/lib/i18n';
import { restoreRevisionAction } from '@/server/cms/actions';
import type { RevisionRow } from '@/server/cms/service';

export function RevisionList({ revisions, empty, showSection, className }: { revisions: RevisionRow[]; empty: string; showSection?: boolean; className?: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  if (!revisions.length) {
    return (
      <p className={cn('flex items-center gap-2 text-sm text-ink-500', className)}>
        <History size={16} /> {empty}
      </p>
    );
  }
  return (
    <ul className={cn('divide-y divide-ink-100', className)}>
      {revisions.map((revision) => (
        <li key={revision.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink-900" suppressHydrationWarning>
              {showSection ? (
                <Link href={revision.lang === 'en' ? `/admin/website/${revision.section}` : `/admin/website/${revision.section}?lang=${revision.lang}`} className="hover:text-brand-700 hover:underline">
                  {revision.page ? `${t(revision.page)} › ` : ''}
                  {t(revision.label)}
                </Link>
              ) : (
                t('Before the change of {at}', { at: formatDateTime(revision.at) })
              )}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500" suppressHydrationWarning>
              {showSection ? <span suppressHydrationWarning>{formatDateTime(revision.at)}</span> : null}
              <span>{revision.by || t('Someone')}</span>
              {revision.lang !== 'en' ? <Badge tone="blue">{LANG_NAMES[revision.lang].own}</Badge> : null}
              <Badge tone={revision.via === 'voice' ? 'violet' : 'neutral'}>
                {revision.via === 'voice' ? <Mic size={12} /> : <MousePointerClick size={12} />} {revision.via === 'voice' ? t('By voice') : t('From the panel')}
              </Badge>
              {revision.summary.startsWith('Restored') ? <Badge tone="blue">{t('Restore')}</Badge> : null}
            </p>
          </div>
          <ConfirmButton
            size="sm"
            variant="secondary"
            danger={false}
            title={t('Go back to this version?')}
            text={t('"{label}" on the live site goes back to how it was before this change. What is live now is kept, so this can be undone too.', { label: revision.label })}
            confirmLabel={t('Restore')}
            onConfirm={async () => {
              const result = await restoreRevisionAction(revision.id);
              if (!result.ok) {
                toast.error(t(result.error));
                return;
              }
              toast.success(t('Restored. Visitors see the earlier version now.'));
              router.refresh();
            }}
          >
            {t('Restore')}
          </ConfirmButton>
        </li>
      ))}
    </ul>
  );
}
