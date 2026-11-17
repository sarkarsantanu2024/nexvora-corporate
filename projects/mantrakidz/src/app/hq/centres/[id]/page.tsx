import { LogIn } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BarsChart } from '@/components/ui/charts';
import { Badge, Card, CardBody, CardHeader, Detail, EmptyState, Meter, Notice, PageHeader, Stat, StatusBadge, TabLinks, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import type { Centre } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { HQ_ROLES, requireSession, type Session } from '@/lib/auth';
import { currentPeriod, formatDate, formatDateTime, periodLabel, todayIST } from '@/lib/date';
import { inr, percent } from '@/lib/money';
import { getT } from '@/lib/t';
import { centrePerformance, getCentre } from '@/server/hq/centres';
import { isAdmin, listNotes } from '@/server/hq/shared';
import { listCentreLogins } from '@/server/hq/users';
import { enterCentre } from '@/server/session-actions';
import { ContactLinks, NUM, readSearch, royaltyRate, type Search } from '../../_ui/bits';
import { NewLogin } from '../../_ui/login-tools';
import { LoginsTable } from '../../_ui/logins-table';
import { NoteForm } from '../../_ui/note-form';
import { AgreementForm, DeleteCentre, ProfileForm, StatusActions } from './centre-forms';

export const metadata: Metadata = { title: 'Centre' };

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'agreement', label: 'Agreement and royalty' },
  { key: 'people', label: 'People' },
  { key: 'performance', label: 'Performance' },
  { key: 'notes', label: 'Notes' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default async function CentrePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(HQ_ROLES);
  const { id } = await params;
  const search = await readSearch(searchParams);
  const centre = await getCentre(id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const tab: TabKey = TABS.some((t) => t.key === search.tab) ? (search.tab as TabKey) : 'profile';
  const base = `/hq/centres/${centre.id}`;

  return (
    <>
      <PageHeader
        back={{ href: '/hq/centres', label: t('Centres') }}
        title={centre.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="tabular font-semibold text-brand-700">{centre.code}</span>
            <StatusBadge t={t} status={centre.status} />
            <Badge tone={centre.isCompanyOwned ? 'brand' : 'neutral'}>{centre.isCompanyOwned ? t('Company-owned') : t('Franchise')}</Badge>
            {centre.isDemo ? <Badge tone="amber">{t('Sample')}</Badge> : null}
            <span>{[centre.area, centre.city].filter(Boolean).join(', ')}</span>
          </span>
        }
        actions={
          <>
            <StatusActions id={centre.id} status={centre.status} />
            <form action={enterCentre.bind(null, centre.id)}>
              <button type="submit" className={buttonClass('primary', 'lg')}>
                <LogIn size={18} /> {t('Open this centre')}
              </button>
            </form>
          </>
        }
      />

      <TabLinks active={tab} tabs={TABS.map((item) => ({ ...item, label: t(item.label), href: item.key === 'profile' ? base : `${base}?tab=${item.key}` }))} />

      {tab === 'profile' ? <ProfileTab centre={centre} session={session} /> : null}
      {tab === 'agreement' ? <AgreementTab centre={centre} session={session} /> : null}
      {tab === 'people' ? <PeopleTab centre={centre} session={session} /> : null}
      {tab === 'performance' ? <PerformanceTab centre={centre} /> : null}
      {tab === 'notes' ? <NotesTab centre={centre} /> : null}
    </>
  );
}

async function ProfileTab({ centre, session }: { centre: Centre; session: Session }) {
  const t = await getT();
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardBody>
          <ProfileForm
            id={centre.id}
            isAdmin={isAdmin(session)}
            initial={{
              name: centre.name,
              address: centre.address,
              area: centre.area,
              city: centre.city,
              state: centre.state,
              pincode: centre.pincode,
              phone: centre.phone,
              whatsapp: centre.whatsapp,
              email: centre.email,
              mapUrl: centre.mapUrl,
              photo: centre.photo,
              ownerName: centre.ownerName,
              ownerPhone: centre.ownerPhone,
              ownerEmail: centre.ownerEmail,
              openedOn: centre.openedOn,
              showOnWebsite: centre.showOnWebsite,
              isCompanyOwned: centre.isCompanyOwned,
              notes: centre.notes,
            }}
          />
        </CardBody>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader title={centre.isCompanyOwned ? t('Centre head') : t('Owner')} />
          <CardBody>
            <dl className="space-y-3">
              <Detail empty={t('Not added')} label={t('Name')}>{centre.ownerName}</Detail>
              <Detail empty={t('Not added')} label={t('Mobile')}>{centre.ownerPhone ? <span className="tabular">{centre.ownerPhone}</span> : null}</Detail>
              <Detail empty={t('Not added')} label={t('Email')}>{centre.ownerEmail ? <span className="break-all">{centre.ownerEmail}</span> : null}</Detail>
            </dl>
            <div className="mt-4">
              <ContactLinks phone={centre.ownerPhone} email={centre.ownerEmail} size="md" labels />
            </div>
          </CardBody>
        </Card>
        {isAdmin(session) ? (
          <Card>
            <CardHeader title={t('Delete this centre')} description={t('Possible only while it has no children on its records. Otherwise close it, and its history stays.')} />
            <CardBody>
              <DeleteCentre id={centre.id} name={centre.name} />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

async function AgreementTab({ centre, session }: { centre: Centre; session: Session }) {
  const t = await getT();
  const today = todayIST();
  const feeDue = Math.max(0, centre.franchiseFee - centre.franchiseFeePaid);
  const ended = Boolean(centre.agreementEnd && centre.agreementEnd < today);
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardBody>
          <AgreementForm
            id={centre.id}
            isAdmin={isAdmin(session)}
            isCompanyOwned={centre.isCompanyOwned}
            effectiveFrom={periodLabel(currentPeriod())}
            initial={{
              agreementStart: centre.agreementStart,
              agreementEnd: centre.agreementEnd,
              franchiseFee: String(centre.franchiseFee),
              franchiseFeePaid: String(centre.franchiseFeePaid),
              royaltyType: centre.royaltyType,
              royaltyValue: String(centre.royaltyValue),
            }}
          />
        </CardBody>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader title={t('At a glance')} />
          <CardBody>
            <dl className="space-y-3">
              <Detail empty={t('Not added')} label={t('Agreement')}>
                {centre.agreementStart || centre.agreementEnd ? (
                  <span className={ended ? 'font-semibold text-accent-600' : undefined}>
                    {t('{from} to {to}', { from: formatDate(centre.agreementStart) || t('Start not set'), to: formatDate(centre.agreementEnd) || t('end not set') })}
                    {ended ? ` ${t('(ended)')}` : ''}
                  </span>
                ) : null}
              </Detail>
              <Detail empty={t('Not added')} label={t('Franchise fee')}>
                <span className="tabular">
                  {t('{franchiseFee}, {franchiseFeePaid} received', { franchiseFee: inr(centre.franchiseFee), franchiseFeePaid: inr(centre.franchiseFeePaid) })}
                </span>
                {feeDue > 0 ? <span className="tabular ml-1 font-semibold text-accent-600">{t('({feeDue} to come)', { feeDue: inr(feeDue) })}</span> : null}
              </Detail>
              <Detail empty={t('Not added')} label={t('Royalty now')}>{centre.isCompanyOwned ? t('None, company-owned') : royaltyRate(t, centre.royaltyType, centre.royaltyValue)}</Detail>
            </dl>
            {centre.isCompanyOwned ? null : (
              <Link href={`/hq/royalty/statement/${centre.id}`} className={buttonClass('secondary', 'sm', 'mt-4')}>
                {t('Royalty statement')}
              </Link>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

async function PeopleTab({ centre, session }: { centre: Centre; session: Session }) {
  const t = await getT();
  const logins = await listCentreLogins(centre.id);
  const admin = isAdmin(session);
  return (
    <Card>
      <CardHeader
        title={t('Logins of this centre')}
        description={t("The centre head and the staff who use the centre's screens. Parent logins are under Team and logins.")}
        action={admin ? <NewLogin scope={{ kind: 'centre', centreId: centre.id }} /> : null}
      />
      {admin ? null : (
        <CardBody className="pb-0">
          <Notice>{t('Only a head office admin can create logins or reset passwords.')}</Notice>
        </CardBody>
      )}
      <div className="mt-4">
        {logins.length ? (
          <LoginsTable rows={logins} selfId={session.uid} canManage={admin} />
        ) : (
          <EmptyState
            title={t('No logins yet')}
            text={t('Create a login for the centre head, so the centre can start entering enquiries, children and fees.')}
            action={admin ? <NewLogin scope={{ kind: 'centre', centreId: centre.id }} label={t('Add the centre head')} /> : undefined}
          />
        )}
      </div>
    </Card>
  );
}

async function PerformanceTab({ centre }: { centre: Centre }) {
  const t = await getT();
  const data = await centrePerformance(centre.id);
  const thisMonth = data.months[data.months.length - 1];
  const admitted = data.months.reduce((sum, m) => sum + m.admissions, 0);
  const left = data.months.reduce((sum, m) => sum + m.withdrawals, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label={t('Children on roll')} value={data.onRoll} hint={t('{onRoll}% of {seats} seats', { onRoll: percent(data.onRoll, data.seats), seats: data.seats })} tone="green" />
        <Stat label={t('Collected, {period}', { period: periodLabel(thisMonth.period) })} value={inr(thisMonth.collected)} hint={t('Spent {spent}', { spent: inr(thisMonth.spent) })} tone="blue" />
        <Stat label={t('Fee dues')} value={inr(data.dues)} hint={data.openBills === 1 ? t('{n} unpaid bill', { n: data.openBills }) : t('{n} unpaid bills', { n: data.openBills })} tone={data.dues > 0 ? 'red' : 'green'} />
        <Stat label={t('Admissions, 6 months')} value={admitted} hint={t('{left} left in the same time', { left })} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('Collection and expenses')} description={t('Last 6 months')} />
          <CardBody>
            <BarsChart
              data={data.months}
              series={[
                { key: 'collected', name: t('Collected') },
                { key: 'spent', name: t('Spent'), color: '#ff7a59' },
              ]}
              money
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('Roll strength')} description={t('Children on roll at the end of each month, with admissions and withdrawals')} />
          <CardBody>
            <BarsChart
              data={data.months}
              series={[
                { key: 'roll', name: t('On roll') },
                { key: 'admissions', name: t('Admitted'), color: '#2ec4a0' },
                { key: 'withdrawals', name: t('Left'), color: '#e31e24' },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={t('Seats filled, class by class')} />
        <div className="mt-4">
          {data.classes.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>{t('Class')}</Th>
                  <Th>{t('Programme')}</Th>
                  <Th className="text-right">{t('Children')}</Th>
                  <Th className="text-right">{t('Seats')}</Th>
                  <Th className="w-1/3">{t('Filled')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.classes.map((row) => {
                  const pct = percent(row.filled, row.capacity);
                  return (
                    <Tr key={row.id}>
                      <Td className="font-semibold text-ink-900">{row.name}</Td>
                      <Td>{row.programme}</Td>
                      <Td className={NUM}>{row.filled}</Td>
                      <Td className={NUM}>{row.capacity}</Td>
                      <Td>
                        <span className="flex items-center gap-3">
                          <Meter value={row.filled} max={row.capacity || 1} tone={pct >= 85 ? 'green' : pct >= 50 ? 'brand' : 'amber'} />
                          <span className="tabular w-10 shrink-0 text-right text-sm font-semibold text-ink-700">{pct}%</span>
                        </span>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <EmptyState title={t('No classes yet')} text={t('The centre sets up its classes under Classes. Seats filled shows here once it has.')} />
          )}
        </div>
      </Card>
    </div>
  );
}

async function NotesTab({ centre }: { centre: Centre }) {
  const t = await getT();
  const notes = await listNotes('centre', centre.id);
  return (
    <Card className="max-w-3xl">
      <CardHeader title={t('Head office notes')} description={t('Visits, calls and decisions about this centre. The centre does not see these.')} />
      <CardBody>
        <NoteForm kind="centre" id={centre.id} placeholder={t('What was discussed or decided')} />
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
          <EmptyState className="py-8" title={t('No notes yet')} text={t('Keep a line here after each visit or call with the owner.')} />
        )}
      </CardBody>
    </Card>
  );
}
