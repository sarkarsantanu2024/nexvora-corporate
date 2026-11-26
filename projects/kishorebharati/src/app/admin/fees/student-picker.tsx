import { Search } from 'lucide-react';
import Link from 'next/link';
import { SearchInput, UrlSelect } from '@/components/ui/client';
import { Avatar, Card, EmptyState } from '@/components/ui/core';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import type { Session } from '@/lib/session-token';
import { getT } from '@/lib/t';
import { findStudents, listSections } from '@/server/money/bills';
import { classOf } from './shared';

/**
 * Step one of "Take payment" and "New bill": find the student by name,
 * admission number or mobile, or pick the class and type the roll number.
 */
export async function StudentPicker({ session, q, section, to, hint }: { session: Session; q: string; section: string; to: string; hint: string }) {
  const t = await getT();
  const lang = await getLang();
  const [rows, sections] = await Promise.all([findStudents(session, { q, section }), listSections()]);
  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <div className="space-y-2 border-b border-ink-100 p-4">
        <div className="flex flex-wrap gap-2">
          <SearchInput placeholder={section ? t('Roll number or name') : t('Name, admission no or mobile')} className="min-w-0 flex-1 sm:w-auto" />
          {/* Kept in view on a phone too: here the class is part of the search, not a filter. */}
          <UrlSelect
            param="section"
            label={t('Class')}
            className="max-sm:!block max-sm:w-full"
            options={[{ value: '', label: t('Any class') }, ...sections.map((row) => ({ value: row.id, label: classOf({ grade: row.grade, sectionName: row.name, stream: row.stream, shift: row.shift }, lang) }))]}
          />
        </div>
        <p className="text-sm text-ink-500">{q || section ? t('Students found: {n}', { n: rows.length }) : hint}</p>
      </div>
      {rows.length ? (
        <ul className="divide-y divide-ink-100">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`${to}?student=${row.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-50/50">
                <Avatar name={row.name} src={row.photo} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink-900">{row.name}</span>
                  <span className="block truncate text-sm text-ink-500">
                    {[classOf(row, lang), row.rollNo ? t('Roll {n}', { n: row.rollNo }) : '', row.admissionNo].filter(Boolean).join(' · ')}
                    {row.status !== 'active' ? ` · ${t('Not on roll')}` : ''}
                  </span>
                </span>
                {row.due > 0 ? (
                  <span className="tabular shrink-0 text-right text-sm font-bold text-accent-600">
                    {inr(row.due)}
                    <span className="block text-xs font-medium text-ink-500">{t('due')}</span>
                  </span>
                ) : (
                  <span className="shrink-0 text-sm text-ink-400">{t('Nothing due')}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Search size={26} />} title={t('No student found')} text={t('Check the spelling, or search by admission number or mobile number. With a class picked, type the roll number.')} />
      )}
    </Card>
  );
}
