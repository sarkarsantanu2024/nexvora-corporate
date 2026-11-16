'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Card, CardBody, CardHeader, Field, FormGrid, Input, Notice, Textarea } from '@/components/ui/core';
import { savePaymentDetailsAction } from '@/server/centre/money/actions';
import type { PaymentDetails } from '@/server/centre/money/payment-info';

export function PaymentForm({ initial }: { initial: PaymentDetails }) {
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
      toast.error(result.error);
      return;
    }
    setErrors({});
    setForm(result.data);
    toast.success('Payment details saved');
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Notice tone="blue">
        Parents see these on their fees page, on the printed bill and in the WhatsApp fee reminder. A payment is never marked paid by itself: when the money
        arrives, record it in Take a payment with the UPI or bank reference.
      </Notice>

      <Card>
        <CardHeader title="UPI" description="A parent can scan the QR, or pay to the UPI ID." />
        <CardBody>
          <FormGrid>
            <Field label="UPI ID" error={errors.upiId} hint="Like name@bank">
              <Input value={form.upiId} invalid={!!errors.upiId} autoCapitalize="none" spellCheck={false} placeholder="mantrakidz@okhdfcbank" onChange={(e) => set({ upiId: e.target.value.trim() })} />
            </Field>
            <Field label="Payee name" error={errors.payeeName} hint="The name the parent sees in their UPI app">
              <Input value={form.payeeName} invalid={!!errors.payeeName} maxLength={80} onChange={(e) => set({ payeeName: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-sm font-semibold text-ink-700">QR code picture</p>
              <ImageField value={form.qrImage} onChange={(url) => set({ qrImage: url })} folder="payments" />
              <p className="mt-1.5 text-sm text-ink-500">
                Upload the QR from your UPI app. Without a picture, parents get a &quot;Pay by UPI app&quot; button on their phone instead.
              </p>
            </div>
          </FormGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Bank transfer" description="For parents who pay by NEFT or IMPS." />
        <CardBody>
          <FormGrid>
            <Field label="Account name" error={errors.accountName}>
              <Input value={form.accountName} invalid={!!errors.accountName} maxLength={100} onChange={(e) => set({ accountName: e.target.value })} />
            </Field>
            <Field label="Account number" error={errors.accountNumber}>
              <Input value={form.accountNumber} invalid={!!errors.accountNumber} inputMode="numeric" maxLength={18} onChange={(e) => set({ accountNumber: e.target.value.replace(/\s/g, '') })} />
            </Field>
            <Field label="IFSC" error={errors.ifsc} hint="11 characters, like SBIN0001234">
              <Input value={form.ifsc} invalid={!!errors.ifsc} maxLength={11} autoCapitalize="characters" onChange={(e) => set({ ifsc: e.target.value.toUpperCase().trim() })} />
            </Field>
            <Field label="Bank" error={errors.bank}>
              <Input value={form.bank} invalid={!!errors.bank} maxLength={80} onChange={(e) => set({ bank: e.target.value })} />
            </Field>
            <Field label="Branch" error={errors.branch}>
              <Input value={form.branch} invalid={!!errors.branch} maxLength={80} onChange={(e) => set({ branch: e.target.value })} />
            </Field>
            <Field label="Note to parents" error={errors.note} hint="Optional" className="sm:col-span-2">
              <Textarea value={form.note} invalid={!!errors.note} maxLength={300} placeholder="Write the child's name in the payment remark." onChange={(e) => set({ note: e.target.value })} />
            </Field>
          </FormGrid>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <LoadingButton size="lg" loading={saving} onClick={save}>
          Save payment details
        </LoadingButton>
      </div>
    </div>
  );
}
