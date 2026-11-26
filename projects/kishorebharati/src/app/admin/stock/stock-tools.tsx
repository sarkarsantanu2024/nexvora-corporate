'use client';

import { ArrowLeftRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { ASSET_CONDITIONS, ASSET_MOVEMENT_KINDS, ASSET_SOURCES, type Asset, type AssetCondition, type AssetMovementKind, type AssetSource } from '@/db/schema';
import { todayIST } from '@/lib/date';
import { addMovementAction, createAssetAction, deleteAssetAction, updateAssetAction } from '@/server/office/actions';
import { ASSET_CONDITION_LABELS, ASSET_SOURCE_LABELS, MOVEMENT_LABELS, UNIT_LABELS, UNITS } from '@/server/office/labels';
import { useAction, useForm } from '../_ui/use-action';

type Unit = (typeof UNITS)[number];

/** Add a line to the register, or (with `asset`) change its details. */
export function AssetFormButton({ categories, asset }: { categories: string[]; asset?: Asset }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const start = () => ({
    name: asset?.name ?? '',
    category: asset?.category ?? categories[0] ?? '',
    quantity: '',
    unit: (asset?.unit ?? 'pcs') as Unit,
    location: asset?.location ?? '',
    condition: (asset?.condition ?? 'good') as AssetCondition,
    purchasedOn: asset?.purchasedOn ?? '',
    source: (asset?.source ?? 'school_fund') as AssetSource,
    value: asset ? String(asset.value) : '',
    note: asset?.note ?? '',
  });
  const form = useForm(start());
  const done = () => setOpen(false);
  const create = useAction(createAssetAction, { success: t('Added to the stock register'), onDone: (data) => router.push(`/admin/stock/${data.id}`) });
  const update = useAction(updateAssetAction, { success: t('Saved'), onDone: done });
  const busy = create.busy || update.busy;
  const fields = asset ? update.fields : create.fields;
  const err = (key: string) => (fields[key] ? t(fields[key]) : undefined);
  const v = form.values;
  const listId = asset ? `categories-${asset.id}` : 'categories-new';

  const save = () => {
    const details = { ...v, value: Number(v.value || 0) };
    if (asset) {
      const { quantity: _q, ...rest } = details;
      void update.run(asset.id, rest);
    } else void create.run({ ...details, quantity: Number(v.quantity || 0) });
  };

  return (
    <>
      <Button
        variant={asset ? 'secondary' : 'primary'}
        onClick={() => {
          form.reset(start());
          setOpen(true);
        }}
      >
        {asset ? <Pencil size={16} /> : <Plus size={18} />} {asset ? t('Edit') : t('Add item')}
      </Button>
      <Drawer
        open={open}
        onClose={done}
        title={asset ? t('Edit item') : t('Add item')}
        footer={
          <>
            <Button variant="secondary" onClick={done}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={busy} onClick={save}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Item')} required error={err('name')}>
            <Input value={v.name} placeholder={t('Bench, microscope, desktop computer')} onChange={(e) => form.set('name', e.target.value)} />
          </Field>
          <Field label={t('Category')} required error={err('category')}>
            <Input list={listId} value={v.category} onChange={(e) => form.set('category', e.target.value)} />
            <datalist id={listId}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <FormGrid>
            {asset ? null : (
              <Field label={t('Quantity')} required error={err('quantity')}>
                <Input inputMode="numeric" value={v.quantity} onChange={(e) => form.set('quantity', e.target.value.replace(/[^0-9]/g, ''))} />
              </Field>
            )}
            <Field label={t('Unit')}>
              <Select value={v.unit} onChange={(e) => form.set('unit', e.target.value as Unit)}>
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {t(UNIT_LABELS[unit])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Room')}>
              <Input value={v.location} placeholder={t('Room 4, laboratory, store')} onChange={(e) => form.set('location', e.target.value)} />
            </Field>
            <Field label={t('Condition')}>
              <Select value={v.condition} onChange={(e) => form.set('condition', e.target.value as AssetCondition)}>
                {ASSET_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {t(ASSET_CONDITION_LABELS[c])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Bought on')} error={err('purchasedOn')}>
              <Input type="date" value={v.purchasedOn} onChange={(e) => form.set('purchasedOn', e.target.value)} />
            </Field>
            <Field label={t('Source')}>
              <Select value={v.source} onChange={(e) => form.set('source', e.target.value as AssetSource)}>
                {ASSET_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {t(ASSET_SOURCE_LABELS[s])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Value (₹)')} hint={t('For the whole line')} error={err('value')}>
              <Input inputMode="numeric" value={v.value} onChange={(e) => form.set('value', e.target.value.replace(/[^0-9]/g, ''))} />
            </Field>
          </FormGrid>
          <Field label={t('Note')}>
            <Textarea value={v.note} onChange={(e) => form.set('note', e.target.value)} />
          </Field>
        </div>
      </Drawer>
    </>
  );
}

const PARTY_LABEL: Record<AssetMovementKind, string> = {
  received: 'Received from',
  issued: 'Issued to',
  returned: 'Returned by',
  damaged: 'How it happened',
  written_off: 'Order or reason',
};

export function MovementButton({ asset }: { asset: Asset }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const blank = () => ({ day: todayIST(), kind: 'received' as AssetMovementKind, quantity: '', party: '', note: '' });
  const form = useForm(blank());
  const save = useAction(addMovementAction, { success: t('Saved'), onDone: () => setOpen(false) });
  const v = form.values;
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  return (
    <>
      <Button
        onClick={() => {
          form.reset(blank());
          setOpen(true);
        }}
      >
        <ArrowLeftRight size={16} /> {t('Write a movement')}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('Write a movement')}
        description={asset.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run(asset.id, { ...v, quantity: Number(v.quantity || 0) })}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <div role="group" aria-label={t('What happened')} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ASSET_MOVEMENT_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={v.kind === kind}
                onClick={() => form.set('kind', kind)}
                className={
                  v.kind === kind
                    ? 'min-h-[42px] rounded-xl border border-brand-700 bg-brand-700 px-3 text-sm font-semibold text-white'
                    : 'min-h-[42px] rounded-xl border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-700 hover:border-ink-300'
                }
              >
                {t(MOVEMENT_LABELS[kind])}
              </button>
            ))}
          </div>
          <FormGrid>
            <Field label={t('Quantity')} required error={err('quantity')} hint={t('{n} in stock, {d} damaged', { n: asset.quantity, d: asset.damaged })}>
              <Input inputMode="numeric" value={v.quantity} onChange={(e) => form.set('quantity', e.target.value.replace(/[^0-9]/g, ''))} />
            </Field>
            <Field label={t('Date')} error={err('day')}>
              <Input type="date" value={v.day} max={todayIST()} onChange={(e) => form.set('day', e.target.value)} />
            </Field>
          </FormGrid>
          <Field label={t(PARTY_LABEL[v.kind])}>
            <Input value={v.party} onChange={(e) => form.set('party', e.target.value)} />
          </Field>
          <Field label={t('Note')}>
            <Input value={v.note} onChange={(e) => form.set('note', e.target.value)} />
          </Field>
        </div>
      </Drawer>
    </>
  );
}

export function DeleteAsset({ id, name }: { id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const remove = useAction(deleteAssetAction, { success: t('Removed'), onDone: () => router.push('/admin/stock') });
  return (
    <ConfirmButton
      title={t('Remove {name} from the register?', { name })}
      text={t('Only for a line written by mistake. Its movements go too. Things that are lost or broken are written off instead.')}
      confirmLabel={t('Remove')}
      onConfirm={async () => void (await remove.run(id))}
    >
      <Trash2 size={16} /> {t('Remove')}
    </ConfirmButton>
  );
}
