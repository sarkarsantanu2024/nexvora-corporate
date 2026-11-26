'use client';

import { Pencil, Plus, Tags } from 'lucide-react';
import { useState } from 'react';
import { Drawer, LoadingButton } from '@/components/ui/client';
import { Badge, Button, Card, EmptyState, Field, FormGrid, Input, Notice, Select, Table, Td, Th, Tr } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { SCHOOL, gradeLabel } from '@/config/school';
import type { FeeHead, FeeKind } from '@/db/schema';
import { inr } from '@/lib/money';
import { saveFeeHeadAction } from '@/server/money/actions';
import { FEE_KIND_LABELS } from '@/server/money/labels';
import { useAction } from '../_ui/use-action';

type Form = { id: string; name: string; kind: FeeKind; fromGrade: string; toGrade: string; amount: string; active: boolean };

const first = String(SCHOOL.grades[0]);
const last = String(SCHOOL.grades[SCHOOL.grades.length - 1]);
const blank: Form = { id: '', name: '', kind: 'annual', fromGrade: first, toGrade: last, amount: '', active: true };

export function FeeHeads({ heads }: { heads: FeeHead[] }) {
  const t = useT();
  const lang = useUiLang();
  const [form, setForm] = useState<Form | null>(null);
  const save = useAction(saveFeeHeadAction, { success: form?.id ? t('Fee head changed') : t('Fee head added'), onDone: () => setForm(null) });
  const grade = (g: number) => gradeLabel(g, lang === 'bn' ? 'bn' : 'en');
  const range = (from: number, to: number) => (from === to ? grade(from) : t('{from} to {to}', { from: grade(from), to: grade(to) }));
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-500">
          {t('What the school charges, and for which classes. Enter the amounts the government has set; bills are made only from these.')}
        </p>
        <Button onClick={() => setForm(blank)}>
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
                <Th>{t('Classes')}</Th>
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
                  <Td>{range(head.fromGrade, head.toGrade)}</Td>
                  <Td className="tabular text-right font-semibold">{inr(head.amount)}</Td>
                  <Td>{head.active ? <Badge tone="green">{t('In use')}</Badge> : <Badge>{t('Switched off')}</Badge>}</Td>
                  <Td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setForm({ id: head.id, name: head.name, kind: head.kind, fromGrade: String(head.fromGrade), toGrade: String(head.toGrade), amount: String(head.amount), active: head.active })}
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
            text={t('Add what the school charges, as set by the government: the session charge for each class, the Class 11 admission fee and so on. Bills are made from these.')}
            action={<Button onClick={() => setForm(blank)}>{t('Add fee head')}</Button>}
          />
        )}
      </Card>

      <Drawer
        open={form !== null}
        onClose={() => !save.busy && setForm(null)}
        title={form?.id ? t('Change fee head') : t('Add fee head')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={save.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton
              loading={save.busy}
              onClick={() =>
                form &&
                save.run({ id: form.id, name: form.name, kind: form.kind, fromGrade: Number(form.fromGrade), toGrade: Number(form.toGrade), amount: Number(form.amount || 0), active: form.active })
              }
            >
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        {form ? (
          <div className="space-y-4">
            <Field label={t('Name')} required error={err('name')}>
              <Input value={form.name} invalid={!!save.fields.name} placeholder={t('Session charge')} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('Charged')} required hint={t('Once a year and one time go on the yearly bill; every month on the monthly bill.')}>
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as FeeKind })}>
                {(Object.keys(FEE_KIND_LABELS) as FeeKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {t(FEE_KIND_LABELS[kind])}
                  </option>
                ))}
              </Select>
            </Field>
            <FormGrid>
              <Field label={t('From class')} required error={err('fromGrade')}>
                <Select value={form.fromGrade} onChange={(e) => setForm({ ...form, fromGrade: e.target.value })}>
                  {SCHOOL.grades.map((g) => (
                    <option key={g} value={g}>
                      {grade(g)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('To class')} required>
                <Select value={form.toGrade} onChange={(e) => setForm({ ...form, toGrade: e.target.value })}>
                  {SCHOOL.grades.map((g) => (
                    <option key={g} value={g}>
                      {grade(g)}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormGrid>
            <Field label={t('Amount in rupees')} required error={err('amount')}>
              <Input type="number" inputMode="numeric" min={0} value={form.amount} invalid={!!save.fields.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
