import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, CardBody, CardHeader, Detail, EmptyState, PageHeader, StatusBadge } from '@/components/ui/core';
import { BRAND } from '@/config/brand';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { STATUS_LABELS } from '@/server/enquiries/constants';
import { getEnquiry } from '@/server/enquiries/service';
import { ContactLinks } from '../../_ui/bits';
import { DeleteEnquiry, NoteForm, StatusControl } from '../enquiry-tools';

export const metadata: Metadata = { title: 'Enquiry' };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  const { id } = await params;
  const data = await getEnquiry(id);
  if (!data) notFound();
  const { row, notes } = data;

  return (
    <>
      <PageHeader
        title={row.name}
        description={t('Received {when}', { when: formatDateTime(row.createdAt) })}
        back={{ href: '/admin/enquiries', label: t('Enquiries') }}
        actions={<ContactLinks phone={row.phone} email={row.email} waText={t('Hello {name}, this is {brand}. Thank you for writing to us.', { name: row.name, brand: BRAND.name })} size="md" labels />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Card>
            <CardHeader title={row.subject || t('Message')} action={<StatusBadge status={row.status} label={t(STATUS_LABELS[row.status])} />} />
            <CardBody>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-800">{row.message}</p>
              <dl className="mt-5 grid gap-4 border-t border-ink-100 pt-5 sm:grid-cols-3">
                <Detail label={t('Mobile')}>{row.phone || t('Not given')}</Detail>
                <Detail label={t('Email')}>{row.email || t('Not given')}</Detail>
                <Detail label={t('Came from')}>
                  <span className="capitalize">{row.source}</span>
                </Detail>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Status')} description={t('New until someone has replied. Close it when nothing more is needed.')} />
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <StatusControl id={row.id} status={row.status} />
              {isAdmin(session) ? <DeleteEnquiry id={row.id} name={row.name} /> : null}
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title={t('Notes')} description={t('What was said on the call, what to do next.')} />
          <CardBody>
            <NoteForm id={row.id} />
          </CardBody>
          {notes.length ? (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {notes.map((note) => (
                <li key={note.id} className="px-5 py-3.5">
                  <p className="whitespace-pre-wrap text-[15px] text-ink-800">{note.note}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {note.createdByName || t('Someone')} · {formatDateTime(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="py-8" title={t('No notes yet')} text={t('Add a line after each call so the next person knows where things stand.')} />
          )}
        </Card>
      </div>
    </>
  );
}
