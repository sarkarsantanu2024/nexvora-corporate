'use client';

/** The Settings card's form: how a new admission number is written. */
import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Field, Input } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { saveStudentSettingsAction } from '@/server/students/actions';
import { formatAdmissionNo } from '@/server/students/constants';
import { useAction } from '../_ui/use-action';

export function AdmissionFormatForm({ initial, year }: { initial: string; year: string }) {
  const t = useT();
  const [format, setFormat] = useState(initial);
  const save = useAction(saveStudentSettingsAction, { success: t('Saved') });
  return (
    <div className="space-y-3">
      <Field
        label={t('Admission number format')}
        error={save.fields.admissionFormat && t(save.fields.admissionFormat)}
        hint={t('{n} is the running number, {year} the school year. Next one looks like {example}.', { n: '{n}', year: '{year}', example: formatAdmissionNo(format, 215, year) })}
      >
        <Input value={format} onChange={(e) => setFormat(e.target.value)} className="max-w-xs" />
      </Field>
      <div className="flex justify-end">
        <LoadingButton loading={save.busy} onClick={() => save.run({ admissionFormat: format })}>
          {t('Save')}
        </LoadingButton>
      </div>
    </div>
  );
}
