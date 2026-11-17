import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardBody, CardHeader, Detail, EmptyState, Notice, PageHeader, StatusBadge } from '@/components/ui/core';
import { ApiError } from '@/lib/api';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { STAGE_LABELS, sourceLabel } from '@/server/hq/constants';
import { getLead, hqPeople } from '@/server/hq/leads';
import { isAdmin, listNotes } from '@/server/hq/shared';
import { ContactLinks } from '../../_ui/bits';
import { NoteForm } from '../../_ui/note-form';
import { LeadForm } from '../lead-form';
import { ConvertLead, DeleteLead, LeadProgress } from './lead-tools';

export const metadata: Metadata = { title: 'Franchise lead' };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(HQ_ROLES);
  const { id } = await params;
  const found = await getLead(id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const { lead, centreName } = found;
  const [people, notes] = await Promise.all([hqPeople(), listNotes('franchise_lead', lead.id)]);
  const converted = lead.stage === 'onboarded';
  const greeting = `Hello ${lead.name}, this is ${session.name} from Mantra Kidz head office. Thank you for your interest in opening a Mantra Kidz centre.`;

  return (
    <>
      <PageHeader
        back={{ href: '/hq/leads', label: t('Franchise leads') }}
        title={lead.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={lead.stage} label={t(STAGE_LABELS[lead.stage])} />
            <span>
              {t('{place} · received {date}', { place: [lead.city, lead.state].filter(Boolean).join(', ') || t('City not given'), date: formatDateTime(lead.createdAt) })}
            </span>
          </span>
        }
        actions={
          <>
            <ContactLinks phone={lead.phone} email={lead.email} waText={greeting} size="md" labels />
            {!converted && lead.stage !== 'lost' ? <ConvertLead id={lead.id} ownerName={lead.name} city={lead.city} state={lead.state} canCreateLogin={isAdmin(session)} /> : null}
          </>
        }
      />

      {converted && centreName && lead.convertedCentreId ? (
        <Notice tone="green" className="mb-5">
          {t('This lead became a centre:')}{' '}
          <Link href={`/hq/centres/${lead.convertedCentreId}`} className="font-bold underline">
            {centreName}
          </Link>
        </Notice>
      ) : converted ? (
        <Notice className="mb-5">{t('This lead became a centre, and that centre has since been deleted.')}</Notice>
      ) : null}
      {lead.stage === 'lost' && lead.lostReason ? (
        <Notice tone="amber" className="mb-5">
          {t('Lost: {lostReason}', { lostReason: lead.lostReason })}
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Card>
            <CardHeader title={t('Progress')} />
            <CardBody>
              <LeadProgress id={lead.id} stage={lead.stage} nextFollowUp={lead.nextFollowUp} assignedTo={lead.assignedTo} people={people} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Notes')} description={t('Every call and meeting, newest first')} />
            <CardBody>
              <NoteForm kind="lead" id={lead.id} placeholder={t('What was said on the call, what happens next')} />
              {notes.length ? (
                <ol className="mt-5 space-y-4 border-l-2 border-ink-100 pl-4">
                  {notes.map((note) => (
                    <li key={note.id} className="relative">
                      <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                      <p className="whitespace-pre-wrap text-[15px] text-ink-800">{note.note}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {note.createdByName || t('Someone')} · {formatDateTime(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState className="py-8" title={t('No notes yet')} text={t('Write a line after each call, so anyone picking this lead up knows where it stands.')} />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              title={t('Details')}
              action={
                <LeadForm
                  people={people}
                  lead={{
                    id: lead.id,
                    name: lead.name,
                    phone: lead.phone,
                    email: lead.email,
                    city: lead.city,
                    state: lead.state,
                    occupation: lead.occupation,
                    investmentRange: lead.investmentRange,
                    hasSpace: lead.hasSpace,
                    spaceSqft: lead.spaceSqft,
                    message: lead.message,
                    source: lead.source,
                    assignedTo: lead.assignedTo,
                    nextFollowUp: lead.nextFollowUp,
                  }}
                />
              }
            />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Detail empty={t('Not added')} label={t('Mobile')}>
                  <span className="tabular">{lead.phone}</span>
                </Detail>
                <Detail empty={t('Not added')} label={t('Email')}>{lead.email ? <span className="break-all">{lead.email}</span> : null}</Detail>
                <Detail empty={t('Not added')} label={t('City')}>{lead.city}</Detail>
                <Detail empty={t('Not added')} label={t('State')}>{lead.state}</Detail>
                <Detail empty={t('Not added')} label={t('Occupation')}>{lead.occupation}</Detail>
                <Detail empty={t('Not added')} label={t('Investment range')}>{lead.investmentRange}</Detail>
                <Detail empty={t('Not added')} label={t('Has a space')}>{lead.hasSpace === null ? t('Not known') : lead.hasSpace ? (lead.spaceSqft ? t('Yes, {n} sq ft', { n: lead.spaceSqft.toLocaleString('en-IN') }) : t('Yes')) : t('No')}</Detail>
                <Detail empty={t('Not added')} label={t('Source')}>{t(sourceLabel(lead.source))}</Detail>
                <Detail empty={t('Not added')} label={t('What they said')} className="col-span-2">
                  {lead.message ? <span className="whitespace-pre-wrap">{lead.message}</span> : null}
                </Detail>
              </dl>
            </CardBody>
          </Card>
          {isAdmin(session) && !lead.convertedCentreId ? (
            <div className="no-print flex justify-end">
              <DeleteLead id={lead.id} name={lead.name} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
