/** The "what to do next" cards of an overview (rules in src/server/suggestions.ts). Server-safe. */
import { AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Card, CardHeader } from '../ui/core';

export type SuggestionItem = { id: string; tone: 'warn' | 'tip'; title: string; text: string; href: string; action: string };

export function SuggestionList({ items, title, className }: { items: SuggestionItem[]; title: string; className?: string }) {
  if (!items.length) return null;
  return (
    <Card className={cn('animate-fade-up', className)}>
      <CardHeader title={title} />
      <ul className="mt-3 grid gap-3 px-5 pb-5 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                'group flex h-full gap-3 rounded-xl border p-4 transition hover:shadow-sm',
                item.tone === 'warn' ? 'border-sun-200 bg-sun-50/60 hover:border-sun-300' : 'border-ink-200 bg-white hover:border-brand-300',
              )}
            >
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', item.tone === 'warn' ? 'bg-sun-100 text-sun-700' : 'bg-brand-50 text-brand-700')}>
                {item.tone === 'warn' ? <AlertTriangle size={17} /> : <Lightbulb size={17} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink-900">{item.title}</span>
                <span className="mt-0.5 block text-sm text-ink-600">{item.text}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  {item.action} <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
