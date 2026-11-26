'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { saveExpenseCategoriesAction, saveFeeSettingsAction } from '@/server/money/actions';
import { useAction } from '../_ui/use-action';

/** Fee rules on the Settings screen: days from a bill to its due date, and the receipt's foot line. */
export function FeeSettingsForm({ initial }: { initial: { dueDays: number; receiptFooter: string } }) {
  const t = useT();
  const [dueDays, setDueDays] = useState(String(initial.dueDays));
  const [footer, setFooter] = useState(initial.receiptFooter);
  const save = useAction(saveFeeSettingsAction, { success: t('Fee settings saved') });
  return (
    <div className="space-y-4">
      <FormGrid>
        <Field label={t('Days to pay a new bill')} hint={t('The due date a new bill gets; it can be changed on each bill run.')} error={save.fields.dueDays ? t(save.fields.dueDays) : undefined}>
          <Input type="number" inputMode="numeric" min={0} value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
        </Field>
        <Field label={t('Line at the foot of every receipt')} hint={t('Optional')}>
          <Input value={footer} maxLength={200} onChange={(e) => setFooter(e.target.value)} />
        </Field>
      </FormGrid>
      <div className="flex justify-end">
        <LoadingButton loading={save.busy} onClick={() => save.run({ dueDays: Number(dueDays), receiptFooter: footer })}>
          {t('Save')}
        </LoadingButton>
      </div>
    </div>
  );
}

/** The expense categories the office picks from. */
export function ExpenseCategoriesForm({ initial }: { initial: string[] }) {
  const t = useT();
  const [list, setList] = useState(initial);
  const [next, setNext] = useState('');
  const save = useAction(saveExpenseCategoriesAction, { success: t('Expense categories saved'), onDone: (data) => setList(data.categories) });
  const add = () => {
    const name = next.trim();
    if (name && !list.some((c) => c.toLowerCase() === name.toLowerCase())) setList([...list, name]);
    setNext('');
  };
  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-2">
        {list.map((name) => (
          <li key={name} className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white py-1 pl-3 pr-1 text-sm font-medium text-ink-800">
            {t(name)}
            <button type="button" aria-label={t('Remove {name}', { name })} onClick={() => setList(list.filter((c) => c !== name))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-ink-100">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Input
          value={next}
          maxLength={60}
          placeholder={t('New category')}
          className="min-w-0 flex-1"
          onChange={(e) => setNext(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="secondary" onClick={add} disabled={!next.trim()}>
          <Plus size={16} /> {t('Add')}
        </Button>
      </div>
      <p className="text-sm text-ink-500">{t('Taking a category off the list does not change the expenses already written under it.')}</p>
      <div className="flex justify-end">
        <LoadingButton loading={save.busy} disabled={!list.length} onClick={() => save.run(list)}>
          {t('Save')}
        </LoadingButton>
      </div>
    </div>
  );
}
