'use client';

import { Building2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Notice, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { FranchiseStage } from '@/db/schema';
import { convertLeadAction, deleteLeadAction, updateLeadAction } from '@/server/hq/actions';
import { STAGE_LABELS } from '@/server/hq/constants';
import { useAction, useForm } from '../../_ui/use-action';

// Taken from the labels rather than the schema file, which would pull the database library into the browser.
const FRANCHISE_STAGES = Object.keys(STAGE_LABELS) as FranchiseStage[];

/** Stage, follow-up date and owner: the three things changed on almost every call. */
export function LeadProgress({
  id,
  stage,
  nextFollowUp,
  assignedTo,
  people,
}: {
  id: string;
  stage: FranchiseStage;
  nextFollowUp: string | null;
  assignedTo: string | null;
  people: { id: string; name: string }[];
}) {
  const t = useT();
  const [lostOpen, setLostOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [followUp, setFollowUp] = useState(nextFollowUp ?? '');
  const update = useAction(updateLeadAction, { success: t('Saved') });
  const lose = useAction(updateLeadAction, { success: t('Marked as lost'), onDone: () => setLostOpen(false) });
  const closed = stage === 'onboarded';

  return (
    <>
      <FormGrid className="sm:grid-cols-3">
        <Field label={t('Stage')} hint={closed ? t('This lead is now a school') : undefined}>
          <Select
            value={stage}
            disabled={closed || update.busy}
            onChange={(e) => {
              const next = e.target.value as FranchiseStage;
              if (next === 'lost') setLostOpen(true);
              else void update.run(id, { stage: next });
            }}
          >
            {FRANCHISE_STAGES.filter((s) => s !== 'onboarded' || closed).map((s) => (
              <option key={s} value={s}>
                {t(STAGE_LABELS[s])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('Next follow-up')}>
          <Input
            type="date"
            value={followUp}
            disabled={closed || update.busy}
            onChange={(e) => {
              setFollowUp(e.target.value);
              void update.run(id, { nextFollowUp: e.target.value || null });
            }}
          />
        </Field>
        <Field label={t('Assigned to')}>
          <Select value={assignedTo ?? ''} disabled={update.busy} onChange={(e) => void update.run(id, { assignedTo: e.target.value || null })}>
            <option value="">{t('Nobody yet')}</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Select>
        </Field>
      </FormGrid>

      <Modal
        open={lostOpen}
        onClose={() => !lose.busy && setLostOpen(false)}
        title={t('Mark this lead as lost')}
        description={t('The reason is kept on the lead, so the same ground is not covered twice.')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLostOpen(false)} disabled={lose.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton variant="accent" loading={lose.busy} onClick={() => lose.run(id, { stage: 'lost', lostReason: reason })}>
              {t('Mark as lost')}
            </LoadingButton>
          </>
        }
      >
        <Field label={t('Why was it lost')} required error={lose.fields.lostReason && t(lose.fields.lostReason)}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('For example: could not arrange a suitable space')} invalid={Boolean(lose.fields.lostReason)} autoFocus />
        </Field>
      </Modal>
    </>
  );
}

type ConvertValues = {
  centreName: string;
  area: string;
  city: string;
  state: string;
  royaltyType: 'percent' | 'fixed';
  royaltyValue: string;
  franchiseFee: string;
  withLogin: boolean;
  username: string;
  password: string;
  mustChange: boolean;
};

/** Turns the lead into a centre in onboarding, with the owner's login if wanted. */
export function ConvertLead({ id, ownerName, city, state, canCreateLogin }: { id: string; ownerName: string; city: string; state: string; canCreateLogin: boolean }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { values, set } = useForm<ConvertValues>({
    centreName: city ? `Mantra Kidz ${city.split(',')[0].trim()}` : 'Mantra Kidz ',
    area: '',
    city,
    state,
    royaltyType: 'percent',
    royaltyValue: '',
    franchiseFee: '',
    withLogin: canCreateLogin,
    username: '',
    password: '',
    mustChange: true,
  });
  const convert = useAction(convertLeadAction, {
    onDone: ({ centre, login }) => {
      toast.success(login ? t('{code} created with login {username}', { code: centre.code, username: login.username }) : t('{code} created', { code: centre.code }));
      router.push(`/hq/centres/${centre.id}`);
    },
  });
  const errors = convert.fields;

  const submit = () =>
    convert.run(id, {
      centreName: values.centreName,
      area: values.area,
      city: values.city,
      state: values.state,
      royaltyType: values.royaltyType,
      royaltyValue: Number(values.royaltyValue) || 0,
      franchiseFee: Number(values.franchiseFee) || 0,
      login: values.withLogin ? { username: values.username, password: values.password, mustChange: values.mustChange } : null,
    });

  return (
    <>
      <Button variant="success" onClick={() => setOpen(true)}>
        <Building2 size={18} /> {t('Convert to school')}
      </Button>
      <Modal
        open={open}
        onClose={() => !convert.busy && setOpen(false)}
        size="lg"
        title={t('Convert to school')}
        description={t('{ownerName} becomes the owner. The school starts in onboarding; activate it when it is ready to open.', { ownerName })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={convert.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={convert.busy} onClick={submit}>
              {t('Create the school')}
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label={t('School name')} required className="sm:col-span-2" error={errors.centreName && t(errors.centreName)}>
            <Input value={values.centreName} onChange={(e) => set('centreName', e.target.value)} invalid={Boolean(errors.centreName)} />
          </Field>
          <Field label={t('Area')}>
            <Input value={values.area} onChange={(e) => set('area', e.target.value)} />
          </Field>
          <Field label={t('City')}>
            <Input value={values.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label={t('Royalty')}>
            <Select value={values.royaltyType} onChange={(e) => set('royaltyType', e.target.value as ConvertValues['royaltyType'])}>
              <option value="percent">{t('Percent of fee collection')}</option>
              <option value="fixed">{t('Fixed amount a month')}</option>
            </Select>
          </Field>
          <Field label={values.royaltyType === 'percent' ? t('Percent') : t('Rupees a month')} error={errors.royaltyValue && t(errors.royaltyValue)}>
            <Input type="number" min={0} value={values.royaltyValue} onChange={(e) => set('royaltyValue', e.target.value)} invalid={Boolean(errors.royaltyValue)} />
          </Field>
          <Field label={t('Franchise fee, rupees')} hint={t('Can be filled in later on the school')} error={errors.franchiseFee && t(errors.franchiseFee)}>
            <Input type="number" min={0} value={values.franchiseFee} onChange={(e) => set('franchiseFee', e.target.value)} />
          </Field>
        </FormGrid>

        {canCreateLogin ? (
          <div className="mt-5 rounded-2xl border border-ink-200 p-4">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
              <input type="checkbox" checked={values.withLogin} onChange={(e) => set('withLogin', e.target.checked)} className="h-4 w-4 accent-brand-700" />
              {t("Create the owner's login now")}
            </label>
            {values.withLogin ? (
              <FormGrid className="mt-4">
                <Field label={t('Username')} required error={t(errors['login.username'] ?? errors.username ?? '')}>
                  <Input value={values.username} onChange={(e) => set('username', e.target.value)} autoCapitalize="none" invalid={Boolean(errors['login.username'] ?? errors.username)} />
                </Field>
                <Field label={t('Starting password')} required hint={t('Shown only now. Pass it to the owner.')} error={t(errors['login.password'] ?? errors.password ?? '')}>
                  <Input value={values.password} onChange={(e) => set('password', e.target.value)} autoComplete="off" invalid={Boolean(errors['login.password'] ?? errors.password)} />
                </Field>
                <label className="flex items-center gap-2.5 text-sm text-ink-700 sm:col-span-2">
                  <input type="checkbox" checked={values.mustChange} onChange={(e) => set('mustChange', e.target.checked)} className="h-4 w-4 accent-brand-700" />
                  {t('Ask for a new password at the first login')}
                </label>
              </FormGrid>
            ) : null}
          </div>
        ) : (
          <Notice className="mt-5">{t("A head office admin can create the owner's login from the school's People tab.")}</Notice>
        )}
      </Modal>
    </>
  );
}

export function DeleteLead({ id, name }: { id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const remove = useAction(deleteLeadAction, { success: t('Lead deleted'), onDone: () => router.push('/hq/leads') });
  return (
    <ConfirmButton title={t('Delete {name}?', { name })} text={t('The lead and its notes are removed for good.')} confirmLabel={t('Delete lead')} onConfirm={async () => void (await remove.run(id))}>
      <Trash2 size={16} /> {t('Delete')}
    </ConfirmButton>
  );
}
