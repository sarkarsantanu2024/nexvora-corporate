'use client';

/**
 * The daily mid-day meal entry, built to take under a minute on a phone:
 * "present" comes filled in from the attendance register, one tap copies it
 * into "ate" for every class, the menu of the weekday is already there, and
 * one Save sends the whole day.
 */
import { CopyCheck, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Badge, Button, Card, CardHeader, Field, Input, Notice, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { saveMdmDayAction, saveMdmSettingsAction } from '@/server/office/actions';
import type { OfficeSettings } from '@/server/office/defaults';
import { UNIT_LABELS, UNITS, WEEKDAY_LABELS, qtyText } from '@/server/office/labels';
import type { MdmDayForm as MdmDayData } from '@/server/office/mdm';
import { useAction } from '../_ui/use-action';

const num = (value: number | null) => (value === null ? '' : String(value));

export function MdmDayForm({ data, labels }: { data: MdmDayData; labels: Record<number, string> }) {
  const t = useT();
  const [classes, setClasses] = useState(data.classes.map((row) => ({ grade: row.grade, present: num(row.present), ate: num(row.ate) })));
  const [menu, setMenu] = useState(data.menu);
  const [cooks, setCooks] = useState(num(data.cooksPresent));
  const [stock, setStock] = useState(data.stock.map((row) => ({ ...row, received: row.received ? qtyText(row.received) : '', used: row.used ? qtyText(row.used) : '' })));
  const save = useAction(saveMdmDayAction, { success: t('Mid-day meal register saved') });

  const setClass = (index: number, key: 'present' | 'ate', value: string) =>
    setClasses((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value.replace(/[^0-9]/g, '') } : row)));
  const setStockCell = (index: number, key: 'received' | 'used', value: string) =>
    setStock((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value.replace(/[^0-9.]/g, '') } : row)));
  const allAte = () => setClasses((rows) => rows.map((row) => ({ ...row, ate: row.present })));

  const totalPresent = classes.reduce((sum, row) => sum + (Number(row.present) || 0), 0);
  const totalAte = classes.reduce((sum, row) => sum + (Number(row.ate) || 0), 0);

  const submit = () =>
    save.run({
      day: data.day,
      menu,
      cooksPresent: Number(cooks || 0),
      note: data.note,
      classes: classes.map((row) => ({ grade: row.grade, present: Number(row.present || 0), ate: Number(row.ate || 0) })),
      stock: stock.map((row) => ({ item: row.item, received: Number(row.received || 0), used: Number(row.used || 0) })),
    });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader
          title={t('Classes')}
          description={data.saved ? t('Saved. Change any number and save again to correct it.') : t('Present is filled in from the attendance register where it was taken.')}
          action={
            <Button variant="secondary" size="sm" onClick={allAte}>
              <CopyCheck size={16} /> {t('All present ate')}
            </Button>
          }
        />
        <div className="px-3 pb-4 pt-3 sm:px-5">
          <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-x-2 gap-y-2 sm:grid-cols-[1fr_6rem_6rem]">
            <span />
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Present')}</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Ate')}</span>
            {classes.map((row, index) => {
              const info = data.classes[index];
              const error = save.fields[`classes.${index}.ate`];
              return (
                <div key={row.grade} className="contents">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{labels[row.grade]}</p>
                    <p className="truncate text-xs text-ink-500">
                      {info.roll !== null ? t('{n} on the roll', { n: info.roll }) : null}
                      {info.fromRegister ? (
                        <Badge tone="green" className="ml-1.5 px-1.5 py-0 text-[10px]">
                          {t('from register')}
                        </Badge>
                      ) : null}
                    </p>
                    {error ? <p className="text-xs font-medium text-accent-600">{t(error)}</p> : null}
                  </div>
                  <Input inputMode="numeric" aria-label={`${labels[row.grade]} ${t('Present')}`} value={row.present} onChange={(e) => setClass(index, 'present', e.target.value)} className="tabular text-center text-lg font-semibold" />
                  <Input
                    inputMode="numeric"
                    aria-label={`${labels[row.grade]} ${t('Ate')}`}
                    value={row.ate}
                    invalid={Boolean(error) || (row.ate !== '' && Number(row.ate) > Number(row.present || 0))}
                    onChange={(e) => setClass(index, 'ate', e.target.value)}
                    className="tabular text-center text-lg font-semibold"
                  />
                </div>
              );
            })}
            <p className="pt-1 text-sm font-bold text-ink-700">{t('Total')}</p>
            <p className="tabular pt-1 text-center text-lg font-bold text-ink-900">{totalPresent}</p>
            <p className="tabular pt-1 text-center text-lg font-bold text-brand-700">{totalAte}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="grid grid-cols-[1fr_6rem] gap-3 p-4 sm:p-5">
            <Field label={t('Menu of the day')}>
              <Input value={menu} onChange={(e) => setMenu(e.target.value)} />
            </Field>
            <Field label={t('Cooks present')} error={save.fields.cooksPresent ? t(save.fields.cooksPresent) : undefined}>
              <Input inputMode="numeric" value={cooks} onChange={(e) => setCooks(e.target.value.replace(/[^0-9]/g, ''))} className="tabular text-center" />
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title={t('Stock')} description={t('Rice and other items received and used today. Leave blank what did not move.')} />
          <div className="px-3 pb-4 pt-3 sm:px-5">
            <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-x-2 gap-y-2 sm:grid-cols-[1fr_6rem_6rem]">
              <span />
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Received')}</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Used')}</span>
              {stock.map((row, index) => (
                <div key={row.item} className="contents">
                  <p className="truncate font-semibold text-ink-900">
                    {row.item} <span className="text-xs font-normal text-ink-500">({t(UNIT_LABELS[row.unit] ?? row.unit)})</span>
                  </p>
                  <Input inputMode="decimal" aria-label={`${row.item} ${t('Received')}`} value={row.received} onChange={(e) => setStockCell(index, 'received', e.target.value)} className="tabular text-center" />
                  <Input inputMode="decimal" aria-label={`${row.item} ${t('Used')}`} value={row.used} onChange={(e) => setStockCell(index, 'used', e.target.value)} className="tabular text-center" />
                </div>
              ))}
            </div>
          </div>
        </Card>
        {save.fields._ ? <Notice tone="red">{t(save.fields._)}</Notice> : null}
        <LoadingButton size="lg" className="w-full" loading={save.busy} onClick={submit}>
          {data.saved ? t('Save changes') : t('Save the day')}
        </LoadingButton>
      </div>
    </div>
  );
}

/** The head of school's settings: the classes that get the meal, the menu of each weekday and the stock items. */
export function MdmSettingsForm({ initial, grades }: { initial: OfficeSettings; grades: { grade: number; label: string }[] }) {
  const t = useT();
  const [chosen, setChosen] = useState<number[]>(initial.mdmGrades);
  const [menu, setMenu] = useState<Record<string, string>>(initial.menu);
  const [items, setItems] = useState(initial.stockItems);
  const save = useAction(saveMdmSettingsAction, { success: t('Saved') });
  const toggle = (grade: number) => setChosen((list) => (list.includes(grade) ? list.filter((g) => g !== grade) : [...list, grade]));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title={t('Classes that get the meal')} description={t('Under PM POSHAN the mid-day meal is for classes up to 8.')} />
        <div className="flex flex-wrap gap-2 p-5">
          {grades.map((row) => (
            <button
              key={row.grade}
              type="button"
              aria-pressed={chosen.includes(row.grade)}
              onClick={() => toggle(row.grade)}
              className={cn(
                'min-h-[40px] rounded-xl border px-3.5 text-sm font-semibold transition',
                chosen.includes(row.grade) ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
              )}
            >
              {row.label}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title={t('Menu of each weekday')} description={t('Filled in on the daily entry; it can be changed there for one day.')} />
        <div className="space-y-3 p-5">
          {['1', '2', '3', '4', '5', '6'].map((key) => (
            <Field key={key} label={t(WEEKDAY_LABELS[Number(key)])}>
              <Input value={menu[key] ?? ''} onChange={(e) => setMenu((current) => ({ ...current, [key]: e.target.value }))} />
            </Field>
          ))}
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader
          title={t('Stock items')}
          description={t('What the kitchen keeps in stock and the unit it is counted in.')}
          action={
            <Button variant="secondary" size="sm" onClick={() => setItems((list) => [...list, { name: '', unit: 'kg' }])}>
              <Plus size={16} /> {t('Add item')}
            </Button>
          }
        />
        <div className="space-y-2 p-5">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                aria-label={t('Item')}
                value={item.name}
                invalid={Boolean(save.fields[`stockItems.${index}.name`])}
                onChange={(e) => setItems((list) => list.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)))}
              />
              <Select aria-label={t('Unit')} value={item.unit} className="w-28 shrink-0" onChange={(e) => setItems((list) => list.map((row, i) => (i === index ? { ...row, unit: e.target.value } : row)))}>
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {t(UNIT_LABELS[unit])}
                  </option>
                ))}
              </Select>
              <Button variant="ghost" size="sm" className="w-9 shrink-0 px-0" aria-label={t('Remove')} onClick={() => setItems((list) => list.filter((_, i) => i !== index))}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex justify-end lg:col-span-2">
        <LoadingButton loading={save.busy} onClick={() => save.run({ mdmGrades: chosen, menu, stockItems: items as { name: string; unit: (typeof UNITS)[number] }[] })}>
          {t('Save')}
        </LoadingButton>
      </div>
    </div>
  );
}
