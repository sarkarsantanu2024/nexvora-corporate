'use client';

import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Field, FormGrid, Input } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { saveLibraryRulesAction } from '@/server/library/actions';
import { useAction } from '../_ui/use-action';

type Rules = { loanDays: number; finePerDay: number; maxBooks: number; accessionPrefix: string };

/** The library rules, on the Settings screen. */
export function LibraryRulesForm({ initial }: { initial: Rules }) {
  const t = useT();
  const [form, setForm] = useState({ loanDays: String(initial.loanDays), finePerDay: String(initial.finePerDay), maxBooks: String(initial.maxBooks), accessionPrefix: initial.accessionPrefix });
  const save = useAction(saveLibraryRulesAction, { success: t('Library rules saved') });
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  return (
    <div className="space-y-4">
      <FormGrid>
        <Field label={t('Days a book may be kept')} error={err('loanDays')}>
          <Input type="number" inputMode="numeric" min={1} value={form.loanDays} onChange={(e) => setForm({ ...form, loanDays: e.target.value })} />
        </Field>
        <Field label={t('Fine for each late day, in rupees')} error={err('finePerDay')}>
          <Input type="number" inputMode="numeric" min={0} value={form.finePerDay} onChange={(e) => setForm({ ...form, finePerDay: e.target.value })} />
        </Field>
        <Field label={t('Books a student may hold at a time')} error={err('maxBooks')}>
          <Input type="number" inputMode="numeric" min={1} value={form.maxBooks} onChange={(e) => setForm({ ...form, maxBooks: e.target.value })} />
        </Field>
        <Field label={t('Accession number prefix')} error={err('accessionPrefix')} hint={t('KB gives KB-00001')}>
          <Input value={form.accessionPrefix} maxLength={10} onChange={(e) => setForm({ ...form, accessionPrefix: e.target.value })} />
        </Field>
      </FormGrid>
      <div className="flex justify-end">
        <LoadingButton
          loading={save.busy}
          onClick={() => save.run({ loanDays: Number(form.loanDays), finePerDay: Number(form.finePerDay), maxBooks: Number(form.maxBooks), accessionPrefix: form.accessionPrefix })}
        >
          {t('Save')}
        </LoadingButton>
      </div>
    </div>
  );
}
