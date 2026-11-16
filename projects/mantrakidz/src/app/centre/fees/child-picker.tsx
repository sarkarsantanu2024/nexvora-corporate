import { Search } from 'lucide-react';
import Link from 'next/link';
import { SearchInput } from '@/components/ui/client';
import { Avatar, Card, EmptyState } from '@/components/ui/core';
import { inr } from '@/lib/money';
import { findChildren } from '@/server/centre/money/bills';
import type { Ctx } from '@/server/centre/money/shared';

/** Step one of "Take a payment" and "New bill": find the child. */
export async function ChildPicker({ ctx, q, to, hint }: { ctx: Ctx; q: string; to: string; hint: string }) {
  const children = await findChildren(ctx, q);
  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <div className="border-b border-ink-100 p-4">
        <SearchInput placeholder="Child's name, admission no or mobile" className="sm:w-full" />
        <p className="mt-2 text-sm text-ink-500">{q ? `Children matching "${q}"` : hint}</p>
      </div>
      {children.length ? (
        <ul className="divide-y divide-ink-100">
          {children.map((child) => (
            <li key={child.id}>
              <Link href={`${to}?student=${child.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-50/50">
                <Avatar name={child.name} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink-900">{child.name}</span>
                  <span className="block truncate text-sm text-ink-500">
                    {child.batchName ?? 'No class'} · {child.admissionNo}
                    {child.status !== 'active' ? ' · Left' : ''}
                  </span>
                </span>
                {child.due > 0 ? (
                  <span className="tabular shrink-0 text-right text-sm font-bold text-accent-600">
                    {inr(child.due)}
                    <span className="block text-xs font-medium text-ink-500">due</span>
                  </span>
                ) : (
                  <span className="shrink-0 text-sm text-ink-400">Nothing due</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Search size={26} />} title="No child found" text="Check the spelling, or search by admission number or the parent's mobile number." />
      )}
    </Card>
  );
}
