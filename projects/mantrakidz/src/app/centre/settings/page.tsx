import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ROLE_LABELS } from '@/components/dash/nav';
import { Badge, Card, CardBody, CardHeader, Detail, Notice, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, isHq, requireCentre } from '@/lib/auth';
import { formatDate, formatDateTime } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { listCentreLogins } from '@/server/centre/children/staff';
import { LoginActions, ProfileForm } from './settings-ui';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const t = await getT();
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre');
  const { centre, session } = ctx;
  const logins = await listCentreLogins(ctx);

  return (
    <>
      <PageHeader title={t('Settings')} description={t("Your centre's contact details and who can log in.")} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <Card className="animate-fade-up">
          <CardHeader title={t('Centre details')} description={t('Shown to parents on receipts, in messages and on the website.')} />
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
          <CardHeader title={t('Set by head office')} />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <Detail empty={t('Not added')} label={t('Centre code')}>
                <span className="tabular font-semibold">{centre.code}</span>
              </Detail>
              <Detail empty={t('Not added')} label={t('Centre name')}>{centre.name}</Detail>
              <Detail empty={t('Not added')} label={t('City')}>{[centre.city, centre.pincode].filter(Boolean).join(' ')}</Detail>
              <Detail empty={t('Not added')} label={t('Opened on')}>{formatDate(centre.openedOn)}</Detail>
              <Detail empty={t('Not added')} label={t('Agreement from')}>{formatDate(centre.agreementStart)}</Detail>
              <Detail empty={t('Not added')} label={t('Agreement until')}>{formatDate(centre.agreementEnd)}</Detail>
              <Detail empty={t('Not added')} label={t('Royalty')} className="col-span-2">
                {centre.isCompanyOwned
                  ? t('Company-owned centre, no royalty')
                  : centre.royaltyType === 'percent'
                    ? t("{royaltyValue}% of each month's fee collection", { royaltyValue: centre.royaltyValue })
                    : t('{royaltyValue} every month', { royaltyValue: inr(centre.royaltyValue) })}
              </Detail>
            </dl>
            <Notice className="mt-4">{t('Only head office can change these. Call or message head office if something here is wrong.')}</Notice>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5 animate-fade-up overflow-hidden">
        <CardHeader
          title={t('Logins of this centre')}
          description={t("Staff logins are given from the Staff screen. A parent's login is on the child's page.")}
          className="pb-4"
        />
        <Table>
          <thead>
            <tr>
              <Th>{t('Name')}</Th>
              <Th>{t('Username')}</Th>
              <Th>{t('Role')}</Th>
              <Th>{t('Last login')}</Th>
              <Th>{t('Status')}</Th>
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
                    {login.name} {self ? <Badge tone="brand">{t('You')}</Badge> : null}
                  </Td>
                  <Td className="tabular">{login.username}</Td>
                  <Td>{t(ROLE_LABELS[login.role])}</Td>
                  <Td className="whitespace-nowrap">{login.lastLoginAt ? formatDateTime(login.lastLoginAt) : <span className="text-ink-400">{t('Never')}</span>}</Td>
                  <Td>{login.active ? <Badge tone="green">{t('On')}</Badge> : <Badge>{t('Switched off')}</Badge>}</Td>
                  <Td>
                    {locked ? (
                      <p className="text-right text-xs text-ink-500">{self ? t('Use Change password in the top menu') : t('Managed by head office')}</p>
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
