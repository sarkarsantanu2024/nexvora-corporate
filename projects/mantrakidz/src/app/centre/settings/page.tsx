import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROLE_LABELS } from '@/components/dash/nav';
import { Badge, Card, CardBody, CardHeader, Detail, Notice, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, isHq, requireCentre } from '@/lib/auth';
import { formatDate, formatDateTime } from '@/lib/date';
import { inr } from '@/lib/money';
import { listCentreLogins } from '@/server/centre/children/staff';
import { LoginActions, ProfileForm } from './settings-ui';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre');
  const { centre, session } = ctx;
  const logins = await listCentreLogins(ctx);

  return (
    <>
      <PageHeader title="Settings" description="Your centre's contact details and who can log in." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <Card className="animate-fade-up">
          <CardHeader title="Centre details" description="Shown to parents on receipts, in messages and on the website." />
          <CardBody>
            <ProfileForm
              initial={{
                phone: centre.phone,
                whatsapp: centre.whatsapp,
                email: centre.email,
                address: centre.address,
                area: centre.area,
                mapUrl: centre.mapUrl,
                photo: centre.photo,
              }}
            />
          </CardBody>
        </Card>

        <Card className="animate-fade-up self-start">
          <CardHeader title="Set by head office" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Centre code">
                <span className="tabular font-semibold">{centre.code}</span>
              </Detail>
              <Detail label="Centre name">{centre.name}</Detail>
              <Detail label="City">{[centre.city, centre.pincode].filter(Boolean).join(' ')}</Detail>
              <Detail label="Opened on">{formatDate(centre.openedOn)}</Detail>
              <Detail label="Agreement from">{formatDate(centre.agreementStart)}</Detail>
              <Detail label="Agreement until">{formatDate(centre.agreementEnd)}</Detail>
              <Detail label="Royalty" className="col-span-2">
                {centre.isCompanyOwned
                  ? 'Company-owned centre, no royalty'
                  : centre.royaltyType === 'percent'
                    ? `${centre.royaltyValue}% of each month's fee collection`
                    : `${inr(centre.royaltyValue)} every month`}
              </Detail>
            </dl>
            <Notice className="mt-4">Only head office can change these. Call or message head office if something here is wrong.</Notice>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5 animate-fade-up overflow-hidden">
        <CardHeader
          title="Logins of this centre"
          description="Staff logins are given from the Staff screen. A parent's login is on the child's page."
          className="pb-4"
        />
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Username</Th>
              <Th>Role</Th>
              <Th>Last login</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {logins.map((login) => {
              const self = login.id === session.uid;
              // A centre head cannot change another centre head's login; head office can.
              const locked = self || (login.role === 'centre_admin' && !isHq(session.role));
              return (
                <Tr key={login.id}>
                  <Td className="font-semibold text-ink-900">
                    {login.name} {self ? <Badge tone="brand">You</Badge> : null}
                  </Td>
                  <Td className="tabular">{login.username}</Td>
                  <Td>{ROLE_LABELS[login.role]}</Td>
                  <Td className="whitespace-nowrap">{login.lastLoginAt ? formatDateTime(login.lastLoginAt) : <span className="text-ink-400">Never</span>}</Td>
                  <Td>{login.active ? <Badge tone="green">On</Badge> : <Badge>Switched off</Badge>}</Td>
                  <Td>
                    {locked ? (
                      <p className="text-right text-xs text-ink-500">{self ? 'Use Change password in the top menu' : 'Managed by head office'}</p>
                    ) : (
                      <LoginActions userId={login.id} name={login.name} phone={login.phone} active={login.active} />
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
