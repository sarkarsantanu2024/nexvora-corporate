import { GraduationCap, MessageCircle, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonClass, Card, CardBody, CardHeader, Detail, LinkButton, Notice, PageHeader, StatusBadge } from '@/components/ui/core';
import { ApiError } from '@/lib/api';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { ageLabel, formatDate, formatDateTime, todayIST } from '@/lib/date';
import { rich } from '@/i18n/rich';
import { getT } from '@/lib/t';
import { telLink, waLink } from '@/lib/wa';
import { listProgrammes } from '@/server/centre/children/batches';
import { sourceLabel, STAGE_LABELS } from '@/server/centre/children/constants';
import { getEnquiry } from '@/server/centre/children/enquiries';
import { EnquiryFormButton } from '../enquiry-form';
import { NotesTimeline } from '../notes';
import { StageControl } from './stage-control';

export const metadata: Metadata = { title: 'Enquiry' };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const { id } = await params;
  const [data, programmes] = await Promise.all([
    getEnquiry(ctx, id).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }),
    listProgrammes(),
  ]);
  const { enquiry, child, notes } = data;
  const admitted = enquiry.stage === 'admitted';
  const whatsapp = waLink(enquiry.phone, `Hello ${enquiry.parentName}, this is ${ctx.centre.name}. Thank you for your enquiry about admission for ${enquiry.childName}.`);

  return (
    <>
      <PageHeader
        back={{ href: '/centre/enquiries', label: t('Admission enquiries') }}
        title={enquiry.childName}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={enquiry.stage} label={t(STAGE_LABELS[enquiry.stage])} />
            {t('Asked on {date}, {source}', { date: formatDateTime(enquiry.createdAt), source: t(sourceLabel(enquiry.source)).toLowerCase() })}
          </span>
        }
        actions={
          <>
            <a href={telLink(enquiry.phone)} className={buttonClass('secondary')}>
              <Phone size={17} /> {t('Call')}
            </a>
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
                <MessageCircle size={17} /> {t('WhatsApp')}
              </a>
            ) : null}
            {!admitted ? (
              <LinkButton href={`/centre/students/new?enquiry=${enquiry.id}`}>
                <GraduationCap size={18} /> {t('Admit this child')}
              </LinkButton>
            ) : null}
          </>
        }
      />

      {admitted && child ? (
        <Notice tone="green" className="mb-5">
          {rich(t('Admitted as {child}, admission number {number}.'), {
            child: (
              <Link href={`/centre/students/${child.id}`} className="font-bold underline">
                {child.name}
              </Link>
            ),
            number: child.admissionNo,
          })}
        </Notice>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="space-y-5">
          <Card className="animate-fade-up">
            <CardHeader
              title={t('Details')}
              action={
                <EnquiryFormButton
                  programmes={programmes}
                  today={todayIST()}
                  edit={{
                    id: enquiry.id,
                    values: {
                      childName: enquiry.childName,
                      dob: enquiry.dob ?? '',
                      programmeId: enquiry.programmeId ?? '',
                      parentName: enquiry.parentName,
                      phone: enquiry.phone,
                      email: enquiry.email,
                      area: enquiry.area,
                      message: enquiry.message,
                      source: enquiry.source,
                      nextFollowUp: enquiry.nextFollowUp ?? '',
                    },
                  }}
                />
              }
            />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail empty={t('Not added')} label={t('Child')}>{enquiry.childName}</Detail>
                <Detail empty={t('Not added')} label={t('Date of birth')}>{enquiry.dob ? `${formatDate(enquiry.dob)} (${ageLabel(enquiry.dob)})` : ''}</Detail>
                <Detail empty={t('Not added')} label={t('Programme')}>{data.programmeName}</Detail>
                <Detail empty={t('Not added')} label={t('Parent')}>{enquiry.parentName}</Detail>
                <Detail empty={t('Not added')} label={t('Mobile')}>
                  <span className="tabular">{enquiry.phone}</span>
                </Detail>
                <Detail empty={t('Not added')} label={t('Email')}>{enquiry.email}</Detail>
                <Detail empty={t('Not added')} label={t('Area')}>{enquiry.area}</Detail>
                <Detail empty={t('Not added')} label={t('Visit date')}>{formatDate(enquiry.visitOn)}</Detail>
                {enquiry.stage === 'lost' ? (
                  <Detail empty={t('Not added')} label={t('Why it was lost')} className="sm:col-span-2">
                    {enquiry.lostReason}
                  </Detail>
                ) : null}
                <Detail empty={t('Not added')} label={t('What they asked')} className="sm:col-span-2">
                  {enquiry.message ? <span className="whitespace-pre-line">{enquiry.message}</span> : ''}
                </Detail>
              </dl>
            </CardBody>
          </Card>

          {!admitted ? (
            <Card className="animate-fade-up">
              <CardHeader title={t('Stage and follow-up')} description={t('Move the enquiry along as you speak to the parent.')} />
              <CardBody>
                <StageControl
                  key={`${enquiry.stage}-${enquiry.nextFollowUp}-${enquiry.visitOn}`}
                  id={enquiry.id}
                  stage={enquiry.stage}
                  visitOn={enquiry.visitOn ?? ''}
                  lostReason={enquiry.lostReason}
                  nextFollowUp={enquiry.nextFollowUp ?? ''}
                  canDelete={canManageCentre(ctx.session)}
                />
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card className="animate-fade-up self-start">
          <CardHeader title={t('Notes')} description={t('What was said on each call or visit.')} />
          <CardBody>
            <NotesTimeline kind="enquiry" id={enquiry.id} notes={notes} placeholder={t('Spoke to the mother, will visit on Saturday')} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
