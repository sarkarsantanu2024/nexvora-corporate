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
import { centrePerformance, getCentre } from '@/server/hq/centres';
import { isAdmin, listNotes, royaltyRateLabel } from '@/server/hq/shared';
import { listCentreLogins } from '@/server/hq/users';
import { enterCentre } from '@/server/session-actions';
import { ContactLinks, NUM, readSearch, type Search } from '../../_ui/bits';
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
        back={{ href: '/hq/centres', label: 'Centres' }}
        title={centre.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="tabular font-semibold text-brand-700">{centre.code}</span>
            <StatusBadge status={centre.status} />
            <Badge tone={centre.isCompanyOwned ? 'brand' : 'neutral'}>{centre.isCompanyOwned ? 'Company-owned' : 'Franchise'}</Badge>
            {centre.isDemo ? <Badge tone="amber">Sample</Badge> : null}
            <span>{[centre.area, centre.city].filter(Boolean).join(', ')}</span>
          </span>
        }
        actions={
          <>
            <StatusActions id={centre.id} status={centre.status} />
            <form action={enterCentre.bind(null, centre.id)}>
              <button type="submit" className={buttonClass('primary', 'lg')}>
                <LogIn size={18} /> Open this centre
              </button>
            </form>
          </>
        }
      />

      <TabLinks active={tab} tabs={TABS.map((t) => ({ ...t, href: t.key === 'profile' ? base : `${base}?tab=${t.key}` }))} />

      {tab === 'profile' ? <ProfileTab centre={centre} session={session} /> : null}
      {tab === 'agreement' ? <AgreementTab centre={centre} session={session} /> : null}
      {tab === 'people' ? <PeopleTab centre={centre} session={session} /> : null}
      {tab === 'performance' ? <PerformanceTab centre={centre} /> : null}
      {tab === 'notes' ? <NotesTab centre={centre} /> : null}
    </>
  );
}

function ProfileTab({ centre, session }: { centre: Centre; session: Session }) {
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
          <CardHeader title={centre.isCompanyOwned ? 'Centre head' : 'Owner'} />
          <CardBody>
            <dl className="space-y-3">
              <Detail label="Name">{centre.ownerName}</Detail>
              <Detail label="Mobile">{centre.ownerPhone ? <span className="tabular">{centre.ownerPhone}</span> : null}</Detail>
              <Detail label="Email">{centre.ownerEmail ? <span className="break-all">{centre.ownerEmail}</span> : null}</Detail>
            </dl>
            <div className="mt-4">
              <ContactLinks phone={centre.ownerPhone} email={centre.ownerEmail} size="md" labels />
            </div>
          </CardBody>
        </Card>
        {isAdmin(session) ? (
          <Card>
            <CardHeader title="Delete this centre" description="Possible only while it has no children on its records. Otherwise close it, and its history stays." />
            <CardBody>
              <DeleteCentre id={centre.id} name={centre.name} />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function AgreementTab({ centre, session }: { centre: Centre; session: Session }) {
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
          <CardHeader title="At a glance" />
          <CardBody>
            <dl className="space-y-3">
              <Detail label="Agreement">
                {centre.agreementStart || centre.agreementEnd ? (
                  <span className={ended ? 'font-semibold text-accent-600' : undefined}>
                    {formatDate(centre.agreementStart) || 'Start not set'} to {formatDate(centre.agreementEnd) || 'end not set'}
                    {ended ? ' (ended)' : ''}
                  </span>
                ) : null}
              </Detail>
              <Detail label="Franchise fee">
                <span className="tabular">
                  {inr(centre.franchiseFee)}, {inr(centre.franchiseFeePaid)} received
                </span>
                {feeDue > 0 ? <span className="tabular ml-1 font-semibold text-accent-600">({inr(feeDue)} to come)</span> : null}
              </Detail>
              <Detail label="Royalty now">{centre.isCompanyOwned ? 'None, company-owned' : royaltyRateLabel(centre.royaltyType, centre.royaltyValue)}</Detail>
            </dl>
            {centre.isCompanyOwned ? null : (
              <Link href={`/hq/royalty/statement/${centre.id}`} className={buttonClass('secondary', 'sm', 'mt-4')}>
                Royalty statement
              </Link>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

async function PeopleTab({ centre, session }: { centre: Centre; session: Session }) {
  const logins = await listCentreLogins(centre.id);
  const admin = isAdmin(session);
  return (
    <Card>
      <CardHeader
        title="Logins of this centre"
        description="The centre head and the staff who use the centre's screens. Parent logins are under Team and logins."
        action={admin ? <NewLogin scope={{ kind: 'centre', centreId: centre.id }} /> : null}
      />
      {admin ? null : (
        <CardBody className="pb-0">
          <Notice>Only a head office admin can create logins or reset passwords.</Notice>
        </CardBody>
      )}
      <div className="mt-4">
        {logins.length ? (
          <LoginsTable rows={logins} selfId={session.uid} canManage={admin} />
        ) : (
          <EmptyState
            title="No logins yet"
            text="Create a login for the centre head, so the centre can start entering enquiries, children and fees."
            action={admin ? <NewLogin scope={{ kind: 'centre', centreId: centre.id }} label="Add the centre head" /> : undefined}
          />
        )}
      </div>
    </Card>
  );
}

async function PerformanceTab({ centre }: { centre: Centre }) {
  const data = await centrePerformance(centre.id);
  const thisMonth = data.months[data.months.length - 1];
  const admitted = data.months.reduce((sum, m) => sum + m.admissions, 0);
  const left = data.months.reduce((sum, m) => sum + m.withdrawals, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Children on roll" value={data.onRoll} hint={`${percent(data.onRoll, data.seats)}% of ${data.seats} seats`} tone="green" />
        <Stat label={`Collected, ${periodLabel(thisMonth.period)}`} value={inr(thisMonth.collected)} hint={`Spent ${inr(thisMonth.spent)}`} tone="blue" />
        <Stat label="Fee dues" value={inr(data.dues)} hint={`${data.openBills} unpaid ${data.openBills === 1 ? 'bill' : 'bills'}`} tone={data.dues > 0 ? 'red' : 'green'} />
        <Stat label="Admissions, 6 months" value={admitted} hint={`${left} left in the same time`} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Collection and expenses" description="Last 6 months" />
          <CardBody>
            <BarsChart
              data={data.months}
              series={[
                { key: 'collected', name: 'Collected' },
                { key: 'spent', name: 'Spent', color: '#ff7a59' },
              ]}
              money
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Roll strength" description="Children on roll at the end of each month, with admissions and withdrawals" />
          <CardBody>
            <BarsChart
              data={data.months}
              series={[
                { key: 'roll', name: 'On roll' },
                { key: 'admissions', name: 'Admitted', color: '#2ec4a0' },
                { key: 'withdrawals', name: 'Left', color: '#e31e24' },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Seats filled, class by class" />
        <div className="mt-4">
          {data.classes.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Class</Th>
                  <Th>Programme</Th>
                  <Th className="text-right">Children</Th>
                  <Th className="text-right">Seats</Th>
                  <Th className="w-1/3">Filled</Th>
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
            <EmptyState title="No classes yet" text="The centre sets up its classes under Classes. Seats filled shows here once it has." />
          )}
        </div>
      </Card>
    </div>
  );
}

async function NotesTab({ centre }: { centre: Centre }) {
  const notes = await listNotes('centre', centre.id);
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Head office notes" description="Visits, calls and decisions about this centre. The centre does not see these." />
      <CardBody>
        <NoteForm kind="centre" id={centre.id} placeholder="What was discussed or decided" />
        {notes.length ? (
          <ol className="mt-5 space-y-4 border-l-2 border-ink-100 pl-4">
            {notes.map((note) => (
              <li key={note.id} className="relative">
                <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                <p className="whitespace-pre-wrap text-[15px] text-ink-800">{note.note}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {note.createdByName || 'Someone'} · {formatDateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState className="py-8" title="No notes yet" text="Keep a line here after each visit or call with the owner." />
        )}
      </CardBody>
    </Card>
  );
}
