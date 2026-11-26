/** The Students card on the Settings screen. Loads its own data so the Settings page only places it. */
import { Card, CardBody, CardHeader } from '@/components/ui/core';
import { getT } from '@/lib/t';
import { getSetting } from '@/server/admin/shared';
import { currentYear } from '@/server/school/access';
import { AdmissionFormatForm } from './admission-format-form';

export async function AdmissionSettingsCard() {
  const t = await getT();
  const [settings, year] = await Promise.all([getSetting('students'), currentYear().catch(() => null)]);
  return (
    <Card id="students">
      <CardHeader title={t('Admission numbers')} description={t('A new student gets the next number in this format, unless the office types one.')} />
      <CardBody>
        <AdmissionFormatForm initial={settings.admissionFormat} year={year?.name ?? String(new Date().getFullYear())} />
      </CardBody>
    </Card>
  );
}
