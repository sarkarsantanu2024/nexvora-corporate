'use client';

/** Choosing the student, then the details that differ by certificate. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StudentPicker } from '@/components/school/student-picker';
import { LoadingButton } from '@/components/ui/client';
import { Card, CardBody, Field, FormGrid, Input, Notice, Select, Textarea } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { gradeLabel } from '@/config/school';
import { CERTIFICATE_KINDS, type CertificateKind } from '@/db/schema';
import { cn } from '@/lib/cn';
import { issueCertificateAction } from '@/server/certificates/actions';
import { CERTIFICATE_LABELS, CONDUCT_OPTIONS } from '@/server/students/constants';
import { useAction } from '../../_ui/use-action';

function KindChoice({ kind, onChange }: { kind: CertificateKind; onChange: (kind: CertificateKind) => void }) {
  const t = useT();
  return (
    <div role="group" aria-label={t('Certificate')} className="flex flex-wrap gap-2">
      {CERTIFICATE_KINDS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === kind}
          onClick={() => onChange(option)}
          className={cn(
            'min-h-[40px] rounded-xl border px-4 text-sm font-semibold transition',
            option === kind ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
          )}
        >
          {t(CERTIFICATE_LABELS[option])}
        </button>
      ))}
    </div>
  );
}

export function PickStudent({ kind: initial }: { kind: CertificateKind }) {
  const router = useRouter();
  const [kind, setKind] = useState(initial);
  return (
    <div className="space-y-4">
      <KindChoice kind={kind} onChange={setKind} />
      <StudentPicker autoFocus onPick={(student) => router.push(`/admin/certificates/new?kind=${kind}&student=${student.id}`)} />
    </div>
  );
}

export function IssueForm({
  studentId,
  initialKind,
  today,
  onRoll,
  dues,
  latestGrade,
}: {
  studentId: string;
  initialKind: CertificateKind;
  today: string;
  onRoll: boolean;
  dues: number;
  latestGrade: number | null;
}) {
  const t = useT();
  const lang = useUiLang();
  const router = useRouter();
  const [kind, setKind] = useState(initialKind);
  const [values, setValues] = useState({
    issuedOn: today,
    leftOn: today,
    reason: '',
    promoted: 'na' as 'yes' | 'no' | 'na',
    promotedTo: latestGrade !== null ? gradeLabel(latestGrade + 1, 'en') : '',
    duesCleared: dues === 0,
    conduct: 'Good',
    purpose: '',
    remarks: '',
  });
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));
  const save = useAction(issueCertificateAction, { success: t('Certificate issued'), onDone: (data) => router.push(`/admin/certificates/${data.id}`) });
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);

  return (
    <Card>
      <CardBody className="space-y-5">
        <KindChoice kind={kind} onChange={setKind} />
        {kind === 'bonafide' && !onRoll ? <Notice tone="amber">{t('A bonafide certificate is only for a student on roll')}</Notice> : null}
        {kind === 'tc' && onRoll ? <Notice tone="blue">{t('Issuing a transfer certificate marks the student as left on the date of leaving.')}</Notice> : null}
        <FormGrid>
          <Field label={t('Issued on')} required error={err('issuedOn')}>
            <Input type="date" value={values.issuedOn} onChange={(e) => set('issuedOn', e.target.value)} />
          </Field>
          {kind === 'tc' ? (
            <>
              <Field label={t('Date of leaving')} required error={err('leftOn')}>
                <Input type="date" value={values.leftOn} onChange={(e) => set('leftOn', e.target.value)} />
              </Field>
              <Field label={t('Reason for leaving')} required error={err('reason')}>
                <Input value={values.reason} onChange={(e) => set('reason', e.target.value)} placeholder={t("Guardian's request")} />
              </Field>
              <Field label={t('Promoted to a higher class?')} error={err('promoted')}>
                <Select value={values.promoted} onChange={(e) => set('promoted', e.target.value as 'yes' | 'no' | 'na')}>
                  <option value="na">{t('Not applicable (year not over)')}</option>
                  <option value="yes">{t('Yes')}</option>
                  <option value="no">{t('No')}</option>
                </Select>
              </Field>
              {values.promoted === 'yes' ? (
                <Field label={t('Promoted to')} error={err('promotedTo')} hint={latestGrade !== null ? gradeLabel(latestGrade + 1, lang) : undefined}>
                  <Input value={values.promotedTo} onChange={(e) => set('promotedTo', e.target.value)} />
                </Field>
              ) : null}
            </>
          ) : null}
          {kind !== 'bonafide' ? (
            <Field label={t('Conduct')} required error={err('conduct')}>
              <Input value={values.conduct} onChange={(e) => set('conduct', e.target.value)} list="conduct-options" />
              <datalist id="conduct-options">
                {CONDUCT_OPTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          ) : (
            <Field label={t('Needed for')} error={err('purpose')} hint={t('Bank account, scholarship, Aadhaar')}>
              <Input value={values.purpose} onChange={(e) => set('purpose', e.target.value)} />
            </Field>
          )}
        </FormGrid>
        {kind === 'tc' ? (
          <label className="flex items-center gap-3 text-[15px] text-ink-800">
            <input type="checkbox" checked={values.duesCleared} onChange={(e) => set('duesCleared', e.target.checked)} className="h-4 w-4 accent-brand-700" />
            {t('All dues to the school are cleared')}
          </label>
        ) : null}
        <Field label={t('Remarks')} error={err('remarks')}>
          <Textarea rows={2} value={values.remarks} onChange={(e) => set('remarks', e.target.value)} maxLength={300} />
        </Field>
        <div className="flex justify-end">
          <LoadingButton loading={save.busy} disabled={kind === 'bonafide' && !onRoll} onClick={() => save.run({ kind, studentId, ...values })}>
            {t('Issue and print')}
          </LoadingButton>
        </div>
      </CardBody>
    </Card>
  );
}
