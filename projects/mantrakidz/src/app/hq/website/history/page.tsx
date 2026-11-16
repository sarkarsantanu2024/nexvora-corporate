import type { Metadata } from 'next';
import { RevisionList } from '@/components/cms/revision-list';
import { Card, LinkButton, PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { listRevisions } from '@/server/cms/service';

export const metadata: Metadata = { title: 'Change history' };

const PAGE = 25;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireSession(HQ_ROLES);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  // One extra row tells whether there is a next page.
  const rows = await listRevisions({ limit: PAGE + 1, offset: (page - 1) * PAGE });
  return (
    <>
      <PageHeader
        title="Change history"
        description="Each time something is published, the version it replaced is kept here. Restore one to put it back on the live site."
        back={{ href: '/hq/website', label: 'Edit website' }}
      />
      <Card className="px-5 py-2">
        <RevisionList revisions={rows.slice(0, PAGE)} showSection empty="Nothing has been published from the panel yet. When it is, the earlier versions appear here." className="py-3" />
      </Card>
      {page > 1 || rows.length > PAGE ? (
        <div className="mt-4 flex justify-between">
          {page > 1 ? (
            <LinkButton variant="secondary" href={`/hq/website/history?page=${page - 1}`}>
              Newer
            </LinkButton>
          ) : (
            <span />
          )}
          {rows.length > PAGE ? (
            <LinkButton variant="secondary" href={`/hq/website/history?page=${page + 1}`}>
              Older
            </LinkButton>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
