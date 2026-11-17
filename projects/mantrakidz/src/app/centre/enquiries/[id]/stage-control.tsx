'use client';

/** Move an enquiry to another stage, set the next follow-up, or delete it. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, useToast } from '@/components/ui/client';
import { Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { EnquiryStage } from '@/db/schema';
import { deleteEnquiryAction, setEnquiryFollowUpAction, setEnquiryStageAction } from '@/server/centre/children/actions';
import { STAGE_LABELS } from '@/server/centre/children/constants';

// "Admitted" is not offered: it is set by admitting the child, which also adds the child to the records.
const CHOICES: EnquiryStage[] = ['new', 'contacted', 'visit_scheduled', 'visited', 'lost'];

export function StageControl({
  id,
  stage,
  visitOn,
  lostReason,
  nextFollowUp,
  canDelete,
}: {
  id: string;
  stage: EnquiryStage;
  visitOn: string;
  lostReason: string;
  nextFollowUp: string;
  canDelete: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [next, setNext] = useState<EnquiryStage>(stage);
  const [visit, setVisit] = useState(visitOn);
  const [reason, setReason] = useState(lostReason);
  const [followUp, setFollowUp] = useState(nextFollowUp);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const changed = next !== stage || (next === 'visit_scheduled' && visit !== visitOn) || (next === 'lost' && reason !== lostReason) || followUp !== nextFollowUp;

  async function save() {
    setSaving(true);
    setErrors({});
    // Only the follow-up date changed: no need to touch the stage or add a timeline line.
    const result =
      next === stage && (next !== 'visit_scheduled' || visit === visitOn) && (next !== 'lost' || reason === lostReason)
        ? await setEnquiryFollowUpAction(id, followUp)
        : await setEnquiryStageAction(id, { stage: next, visitOn: visit, lostReason: reason, nextFollowUp: followUp });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      return toast.error(t(result.error));
    }
    toast.success(t('Saved'));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <FormGrid>
        <Field label={t('Stage')}>
          <Select value={next} onChange={(event) => setNext(event.target.value as EnquiryStage)}>
            {CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {t(STAGE_LABELS[choice])}
              </option>
            ))}
          </Select>
        </Field>
        {next === 'visit_scheduled' ? (
          <Field label={t('Visit date')} required error={errors.visitOn && t(errors.visitOn)}>
            <Input type="date" value={visit} invalid={Boolean(errors.visitOn)} onChange={(event) => setVisit(event.target.value)} />
          </Field>
        ) : null}
        {next !== 'lost' ? (
          <Field label={t('Next follow-up')} hint={t('The day to call them again.')}>
            <Input type="date" value={followUp} onChange={(event) => setFollowUp(event.target.value)} />
          </Field>
        ) : null}
      </FormGrid>
      {next === 'lost' ? (
        <Field label={t('Why was it lost')} required error={errors.lostReason && t(errors.lostReason)}>
          <Textarea value={reason} invalid={Boolean(errors.lostReason)} onChange={(event) => setReason(event.target.value)} placeholder={t('Chose another school, fee too high, moved away')} maxLength={300} />
        </Field>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {canDelete ? (
          <ConfirmButton
            size="sm"
            title={t('Delete this enquiry?')}
            text={t('The enquiry and its notes are removed for good. If the parent only said no, mark it as lost instead.')}
            confirmLabel={t('Delete enquiry')}
            onConfirm={async () => {
              const result = await deleteEnquiryAction(id);
              if (!result.ok) return toast.error(t(result.error));
              toast.success(t('Enquiry deleted'));
              router.push('/centre/enquiries');
            }}
          >
            {t('Delete')}
          </ConfirmButton>
        ) : (
          <span />
        )}
        <LoadingButton loading={saving} disabled={!changed} onClick={save}>
          {t('Save')}
        </LoadingButton>
      </div>
    </div>
  );
}
