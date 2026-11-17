import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/core';
import { rich } from '@/i18n/rich';
import { ADMIN_ONLY, requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { loadSettings } from '@/server/admin/service';
import { OrgForm } from './settings-forms';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const t = await getT();
  await requireSession(ADMIN_ONLY);
  const data = await loadSettings();

  return (
    <>
      <PageHeader title={t('Settings')} description={t('Details of the business, as they should read on letters and messages.')} />

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader title={t('Business details')} description={t("For the team's own use. What visitors see on the website is changed in Edit website.")} />
          <CardBody>
            <OrgForm initial={data.org} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('Your password')} />
          <CardBody>
            <p className="text-[15px] text-ink-700">
              {rich(t('Change it any time from {link}. A forgotten password of someone else is reset from Team and logins.'), {
                link: (
                  <Link href="/account/password" className="font-semibold text-brand-700 hover:underline">
                    {t('Change password')}
                  </Link>
                ),
              })}
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
