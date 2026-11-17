'use client';

import { Pencil, Plus, Tags } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Drawer, LoadingButton, useToast } from '@/components/ui/client';
import { Badge, Button, Card, EmptyState, Field, Input, Notice, Select, Table, Td, Th, Tr } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { FeeKind } from '@/db/schema';
import { inr } from '@/lib/money';
import { saveFeeHeadAction } from '@/server/centre/money/actions';
import { FEE_KIND_LABELS } from '@/server/centre/money/labels';

type Head = { id: string; name: string; kind: FeeKind; programmeId: string | null; programmeName: string | null; amount: number; active: boolean };
type Form = { id: string; name: string; kind: FeeKind; programmeId: string; amount: string; active: boolean };

const blank: Form = { id: '', name: '', kind: 'monthly', programmeId: '', amount: '', active: true };

export function FeeHeads({ heads, programmes }: { heads: Head[]; programmes: { id: string; name: string }[] }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const open = (next: Form) => {
    setErrors({});
    setForm(next);
  };

  async function save() {
    if (!form) return;
    setSaving(true);
    const result = await saveFeeHeadAction({
      id: form.id,
      name: form.name,
      kind: form.kind,
      programmeId: form.kind === 'monthly' ? form.programmeId : '',
      amount: Number(form.amount || 0),
      active: form.active,
    });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast.error(t(result.error));
      return;
    }
    toast.success(form.id ? t('Fee head changed') : t('Fee head added'));
    setForm(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-500">
          {t("What this centre charges. The monthly run uses the monthly fee of a child's programme, unless the child has their own fee.")}
        </p>
        <Button onClick={() => open(blank)}>
          <Plus size={18} /> {t('Add fee head')}
        </Button>
      </div>

      <Card className="overflow-hidden">
        {heads.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Charged')}</Th>
                <Th>{t('Programme')}</Th>
                <Th className="text-right">{t('Amount')}</Th>
                <Th>{t('Status')}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {heads.map((head) => (
                <Tr key={head.id} className={head.active ? '' : 'text-ink-400'}>
                  <Td className="font-semibold">{head.name}</Td>
                  <Td>{t(FEE_KIND_LABELS[head.kind])}</Td>
                  <Td>{head.programmeName ?? t('All')}</Td>
                  <Td className="tabular text-right font-semibold">{inr(head.amount)}</Td>
                  <Td>{head.active ? <Badge tone="green">{t('In use')}</Badge> : <Badge>{t('Switched off')}</Badge>}</Td>
                  <Td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => open({ id: head.id, name: head.name, kind: head.kind, programmeId: head.programmeId ?? '', amount: String(head.amount), active: head.active })}
                    >
                      <Pencil size={15} /> {t('Change')}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<Tags size={26} />}
            title={t('No fee heads yet')}
            text={t('Add the monthly tuition fee for each programme, the admission fee and the yearly kit charge. Bills are made from these.')}
            action={<Button onClick={() => open(blank)}>{t('Add fee head')}</Button>}
          />
        )}
      </Card>

      <Drawer
        open={form !== null}
        onClose={() => !saving && setForm(null)}
        title={form?.id ? t('Change fee head') : t('Add fee head')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={saving} onClick={save}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        {form ? (
          <div className="space-y-4">
            <Field label={t('Name')} required error={errors.name && t(errors.name)}>
              <Input value={form.name} invalid={!!errors.name} placeholder={t('Tuition fee, Nursery')} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('Charged')} required>
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as FeeKind })}>
                {(Object.keys(FEE_KIND_LABELS) as FeeKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {t(FEE_KIND_LABELS[kind])}
                  </option>
                ))}
              </Select>
            </Field>
            {form.kind === 'monthly' ? (
              <Field label={t('Programme')} required error={errors.programmeId && t(errors.programmeId)} hint={t('The monthly run bills each child the fee of their programme.')}>
                <Select value={form.programmeId} invalid={!!errors.programmeId} onChange={(e) => setForm({ ...form, programmeId: e.target.value })}>
                  <option value="">{t('Choose a programme')}</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label={t('Amount in rupees')} required error={errors.amount && t(errors.amount)}>
              <Input type="number" inputMode="numeric" min={0} value={form.amount} invalid={!!errors.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <label className="flex items-center gap-3 text-[15px] font-medium text-ink-800">
              <input type="checkbox" className="h-5 w-5 rounded accent-brand-700" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              {t('In use')}
            </label>
            {form.id ? <Notice tone="blue">{t('A new amount applies to bills raised from now on. Bills already raised stay as they are.')}</Notice> : null}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
