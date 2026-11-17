'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Card, CardBody, CardHeader, Field, FormGrid, Input, Notice, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { savePaymentDetailsAction } from '@/server/centre/money/actions';
import type { PaymentDetails } from '@/server/centre/money/payment-info';

export function PaymentForm({ initial }: { initial: PaymentDetails }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<PaymentDetails>) => setForm((current) => ({ ...current, ...patch }));

  async function save() {
    setSaving(true);
    const result = await savePaymentDetailsAction(form);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast.error(t(result.error));
      return;
    }
    setErrors({});
    setForm(result.data);
    toast.success(t('Payment details saved'));
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Notice tone="blue">
        {t('Parents see these on their fees page, on the printed bill and in the WhatsApp fee reminder. A payment is never marked paid by itself: when the money arrives, record it in Take a payment with the UPI or bank reference.')}
      </Notice>

      <Card>
        <CardHeader title={t('UPI')} description={t('A parent can scan the QR, or pay to the UPI ID.')} />
        <CardBody>
          <FormGrid>
            <Field label={t('UPI ID')} error={errors.upiId && t(errors.upiId)} hint={t('Like name@bank')}>
              <Input value={form.upiId} invalid={!!errors.upiId} autoCapitalize="none" spellCheck={false} placeholder="mantrakidz@okhdfcbank" onChange={(e) => set({ upiId: e.target.value.trim() })} />
            </Field>
            <Field label={t('Payee name')} error={errors.payeeName && t(errors.payeeName)} hint={t('The name the parent sees in their UPI app')}>
              <Input value={form.payeeName} invalid={!!errors.payeeName} maxLength={80} onChange={(e) => set({ payeeName: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('QR code picture')}</p>
              <ImageField value={form.qrImage} onChange={(url) => set({ qrImage: url })} folder="payments" />
              <p className="mt-1.5 text-sm text-ink-500">
                {t('Upload the QR from your UPI app. Without a picture, parents get a "Pay by UPI app" button on their phone instead.')}
              </p>
            </div>
          </FormGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t('Bank transfer')} description={t('For parents who pay by NEFT or IMPS.')} />
        <CardBody>
          <FormGrid>
            <Field label={t('Account name')} error={errors.accountName && t(errors.accountName)}>
              <Input value={form.accountName} invalid={!!errors.accountName} maxLength={100} onChange={(e) => set({ accountName: e.target.value })} />
            </Field>
            <Field label={t('Account number')} error={errors.accountNumber && t(errors.accountNumber)}>
              <Input value={form.accountNumber} invalid={!!errors.accountNumber} inputMode="numeric" maxLength={18} onChange={(e) => set({ accountNumber: e.target.value.replace(/\s/g, '') })} />
            </Field>
            <Field label={t('IFSC')} error={errors.ifsc && t(errors.ifsc)} hint={t('11 characters, like SBIN0001234')}>
              <Input value={form.ifsc} invalid={!!errors.ifsc} maxLength={11} autoCapitalize="characters" onChange={(e) => set({ ifsc: e.target.value.toUpperCase().trim() })} />
            </Field>
            <Field label={t('Bank')} error={errors.bank && t(errors.bank)}>
              <Input value={form.bank} invalid={!!errors.bank} maxLength={80} onChange={(e) => set({ bank: e.target.value })} />
            </Field>
            <Field label={t('Branch')} error={errors.branch && t(errors.branch)}>
              <Input value={form.branch} invalid={!!errors.branch} maxLength={80} onChange={(e) => set({ branch: e.target.value })} />
            </Field>
            <Field label={t('Note to parents')} error={errors.note && t(errors.note)} hint={t('Optional')} className="sm:col-span-2">
              <Textarea value={form.note} invalid={!!errors.note} maxLength={300} placeholder={t("Write the child's name in the payment remark.")} onChange={(e) => set({ note: e.target.value })} />
            </Field>
          </FormGrid>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <LoadingButton size="lg" loading={saving} onClick={save}>
          {t('Save payment details')}
        </LoadingButton>
      </div>
    </div>
  );
}
