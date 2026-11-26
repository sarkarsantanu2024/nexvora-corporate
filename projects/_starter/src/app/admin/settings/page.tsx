import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, CardBody, CardHeader, PageHeader } from '@/components/ui/core';
import { rich } from '@/i18n/rich';
import { ADMIN_ONLY, requireSession } from '@/lib/auth';
import { formatDateTime } from '@/lib/date';
import { PLAN_LABELS, PLATFORM_CONTACT, planAllows } from '@/lib/plans';
import { getT } from '@/lib/t';
import { loadSettings } from '@/server/admin/service';
import { getSetting } from '@/server/admin/shared';
import { getPlatform } from '@/server/platform';
import { loadReminderSettings } from '@/server/reminders/service';
import { OrgForm, ReminderForm } from './settings-forms';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const t = await getT();
  await requireSession(ADMIN_ONLY);
  const [data, platform, reminders, jobs] = await Promise.all([loadSettings(), getPlatform(), loadReminderSettings(), getSetting('jobs')]);

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

        {planAllows(platform.plan, 'panel') ? (
          <Card id="reminders">
            <CardHeader title={t('Reminders')} description={t('Which WhatsApp reminders are made each day, and what they say. They wait on the Reminders screen until someone sends them.')} />
            <CardBody>
              <ReminderForm initial={reminders} />
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader title={t('Your plan')} />
          <CardBody className="space-y-2 text-[15px] text-ink-700">
            <p className="flex flex-wrap items-center gap-2">
              <Badge tone="violet">{t(PLAN_LABELS[platform.plan])}</Badge>
              {t('To change the plan, contact {name}.', { name: PLATFORM_CONTACT.name })}
            </p>
            <p className="text-sm text-ink-500">
              {jobs.lastRunAt
                ? t('The daily check last ran on {date}.', { date: formatDateTime(jobs.lastRunAt) })
                : t('The daily check has not run yet. It runs by itself once the website is live.')}
            </p>
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
