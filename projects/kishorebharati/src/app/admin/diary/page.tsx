import { NotebookPen, Paperclip } from 'lucide-react';
import type { Metadata } from 'next';
import { Pagination, UrlDate, UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { sectionLabel } from '@/config/school';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { diaryChoices, listDiary } from '@/server/diary/service';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { DeleteDiary, DiaryForm, type DiaryChoice } from './diary-tools';

export const metadata: Metadata = { title: 'Class diary' };

export default async function DiaryPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const params = await readSearch(searchParams);
  const today = todayIST();
  const [data, choiceRows] = await Promise.all([listDiary(session, { section: params.section, from: params.from, to: params.to, page: params.page }), diaryChoices(session)]);
  const office = isOffice(session);
  const label = new Map(data.sections.map((row) => [row.id, sectionLabel(row, lang)]));
  const choices: DiaryChoice[] = choiceRows.map((choice) => ({
    sectionId: choice.section.id,
    label: sectionLabel(choice.section, lang),
    general: choice.general,
    subjects: choice.subjects.map((row) => ({ id: row.id, label: (lang === 'bn' && row.nameBn) || row.name })),
  }));
  const filtered = Boolean(params.section || params.from || params.to);

  return (
    <>
      <PageHeader
        title={t('Class diary')}
        description={office ? t('Homework and classwork posted for each class. Parents see it in their corner.') : t('Post homework and classwork for your classes. Parents see it in their corner.')}
        actions={choices.length ? <DiaryForm choices={choices} today={today} /> : undefined}
      />
      <FilterBar>
        <UrlSelect param="section" label={t('Class')} options={[{ value: '', label: office ? t('All classes') : t('All my classes') }, ...data.sections.map((row) => ({ value: row.id, label: label.get(row.id) ?? '' }))]} />
        <UrlDate param="from" label={t('From')} max={today} />
        <UrlDate param="to" label={t('To')} max={today} />
      </FilterBar>
      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Given on')}</Th>
                  <Th>{t('Class')}</Th>
                  <Th>{t('Work')}</Th>
                  <Th>{t('To be done by')}</Th>
                  <Th>{t('Posted by')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const mine = office || row.createdBy === session.uid;
                  return (
                    <Tr key={row.id}>
                      <Td className="whitespace-nowrap">{formatDate(row.givenOn)}</Td>
                      <Td className="whitespace-nowrap">
                        <span className="font-semibold text-ink-900">{label.get(row.sectionId)}</span>
                        <span className="block text-xs text-ink-500">{row.subjectId ? (lang === 'bn' && row.subjectBn) || row.subject : t('General note')}</span>
                      </Td>
                      <Td className="min-w-[240px] max-w-lg">
                        <p className="font-medium text-ink-900">{row.title}</p>
                        {row.details ? <p className="line-clamp-3 whitespace-pre-line text-sm text-ink-600">{row.details}</p> : null}
                        {row.attachment ? (
                          <a href={row.attachment} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                            <Paperclip size={14} /> {t('Photo')}
                          </a>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap">{row.dueOn ? <Badge tone={row.dueOn < today ? 'neutral' : 'amber'}>{formatDate(row.dueOn)}</Badge> : <span className="text-ink-400">–</span>}</Td>
                      <Td className="whitespace-nowrap text-sm">{row.teacher || row.createdByName || ''}</Td>
                      <Td className="text-right">
                        {mine ? (
                          <span className="inline-flex gap-1.5">
                            <DiaryForm
                              choices={choices}
                              today={today}
                              entry={{ id: row.id, sectionId: row.sectionId, subjectId: row.subjectId ?? '', givenOn: row.givenOn, dueOn: row.dueOn ?? '', title: row.title, details: row.details, attachment: row.attachment }}
                            />
                            <DeleteDiary id={row.id} title={row.title} />
                          </span>
                        ) : null}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<NotebookPen size={26} />}
            title={filtered ? t('Nothing in the diary for this choice') : t('The class diary is empty')}
            text={filtered ? t('Try another class or dates.') : t('Post the day’s homework here. The class and its parents see it the same day.')}
            action={!filtered && choices.length ? <DiaryForm choices={choices} today={today} /> : undefined}
          />
        )}
      </Card>
    </>
  );
}
