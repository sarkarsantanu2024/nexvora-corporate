'use client';

import { useState } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { LoadingButton } from '@/components/ui/client';
import { Card, CardBody, CardHeader, Field, FormGrid, Input, Notice, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { savePaymentDetailsAction } from '@/server/money/actions';
import type { PaymentDetails } from '@/server/money/labels';
import { useAction } from '../_ui/use-action';

/** How parents pay the school: UPI, QR picture and bank account. Head of school only. */
export function PaymentForm({ initial }: { initial: PaymentDetails }) {
  const t = useT();
  const [form, setForm] = useState(initial);
  const save = useAction(savePaymentDetailsAction, { success: t('Payment details saved'), onDone: (saved) => setForm(saved) });
  const set = (patch: Partial<PaymentDetails>) => setForm((current) => ({ ...current, ...patch }));
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);

  return (
    <div className="max-w-3xl space-y-5">
      <Notice tone="blue">
        {t('Parents see these on the bill and at the end of the WhatsApp fee reminder. Nothing is marked paid by itself: when the money reaches the school, record it in Take payment with the UPI or bank reference.')}
      </Notice>

      <Card>
        <CardHeader title={t('UPI')} description={t('A parent can scan the QR, or pay to the UPI ID.')} />
        <CardBody>
          <FormGrid>
            <Field label={t('UPI ID')} error={err('upiId')} hint={t('Like name@bank')}>
              <Input value={form.upiId} invalid={!!save.fields.upiId} autoCapitalize="none" spellCheck={false} onChange={(e) => set({ upiId: e.target.value.trim() })} />
            </Field>
            <Field label={t('Payee name')} error={err('payeeName')} hint={t('The name the parent sees in their UPI app')}>
              <Input value={form.payeeName} invalid={!!save.fields.payeeName} maxLength={80} onChange={(e) => set({ payeeName: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('QR code picture')}</p>
              <ImageField value={form.qrImage} onChange={(url) => set({ qrImage: url })} folder="payments" />
              <p className="mt-1.5 text-sm text-ink-500">{t('Upload the QR from the school UPI app. Without a picture, parents get a "Pay by UPI app" button on their phone instead.')}</p>
            </div>
          </FormGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t('Bank transfer')} description={t('For parents who pay by NEFT or IMPS.')} />
        <CardBody>
          <FormGrid>
            <Field label={t('Account name')} error={err('accountName')}>
              <Input value={form.accountName} invalid={!!save.fields.accountName} maxLength={100} onChange={(e) => set({ accountName: e.target.value })} />
            </Field>
            <Field label={t('Account number')} error={err('accountNumber')}>
              <Input value={form.accountNumber} invalid={!!save.fields.accountNumber} inputMode="numeric" maxLength={18} onChange={(e) => set({ accountNumber: e.target.value.replace(/\s/g, '') })} />
            </Field>
            <Field label={t('IFSC')} error={err('ifsc')} hint={t('11 characters, like SBIN0001234')}>
              <Input value={form.ifsc} invalid={!!save.fields.ifsc} maxLength={11} autoCapitalize="characters" onChange={(e) => set({ ifsc: e.target.value.toUpperCase().trim() })} />
            </Field>
            <Field label={t('Bank')} error={err('bank')}>
              <Input value={form.bank} invalid={!!save.fields.bank} maxLength={80} onChange={(e) => set({ bank: e.target.value })} />
            </Field>
            <Field label={t('Branch')} error={err('branch')}>
              <Input value={form.branch} invalid={!!save.fields.branch} maxLength={80} onChange={(e) => set({ branch: e.target.value })} />
            </Field>
            <Field label={t('Note to parents')} error={err('note')} hint={t('Optional')} className="sm:col-span-2">
              <Textarea value={form.note} invalid={!!save.fields.note} maxLength={300} placeholder={t("Write the student's name and class in the payment remark.")} onChange={(e) => set({ note: e.target.value })} />
            </Field>
          </FormGrid>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <LoadingButton size="lg" loading={save.busy} onClick={() => save.run(form)}>
          {t('Save payment details')}
        </LoadingButton>
      </div>
    </div>
  );
}
