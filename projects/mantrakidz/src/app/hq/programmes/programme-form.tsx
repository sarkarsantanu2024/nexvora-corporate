'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { ConfirmButton, LoadingButton } from '@/components/ui/client';
import { Button, Card, CardBody, CardHeader, Field, FormGrid, Input, LinkButton, Notice, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { deleteProgrammeAction, saveProgrammeAction } from '@/server/hq/actions';
import { PROGRAMME_COLOURS } from '@/server/hq/constants';
import { Toggle } from '../_ui/toggle';
import { useAction, useForm } from '../_ui/use-action';

/** The wording of a programme in one extra language. Empty means the website shows the English. */
export type WordsValues = { name: string; ageLabel: string; tagline: string; description: string; highlights: string[]; timing: string };
export const EMPTY_WORDS: WordsValues = { name: '', ageLabel: '', tagline: '', description: '', highlights: [], timing: '' };

export type ProgrammeValues = {
  name: string;
  slug: string;
  ageLabel: string;
  ageFromMonths: string;
  ageToMonths: string;
  tagline: string;
  description: string;
  highlights: string[];
  image: string;
  color: (typeof PROGRAMME_COLOURS)[number];
  seatsPerClass: string;
  timing: string;
  suggestedMonthlyFee: string;
  sort: string;
  active: boolean;
  i18n: { bn: WordsValues; hi: WordsValues };
};

type Lang = 'en' | 'bn' | 'hi';
const LANGS: { key: Lang; label: string; name: string }[] = [
  { key: 'en', label: 'English', name: 'English' },
  { key: 'bn', label: 'বাংলা', name: 'Bengali' },
  { key: 'hi', label: 'हिन्दी', name: 'Hindi' },
];

/** The script's own font and a taller line, so matras and conjuncts are not clipped inside the box. */
const SCRIPT_STYLE: Record<'bn' | 'hi', CSSProperties> = {
  bn: { fontFamily: 'var(--font-body-bn), var(--font-body-latin)', lineHeight: 1.7 },
  hi: { fontFamily: 'var(--font-body-hi), var(--font-body-latin)', lineHeight: 1.7 },
};

/** Full class names, so Tailwind keeps them in the stylesheet. */
const SWATCH: Record<ProgrammeValues['color'], string> = {
  sun: 'bg-sun-400',
  coral: 'bg-coral-400',
  mint: 'bg-mint-400',
  sky: 'bg-sky-400',
  indigo: 'bg-brand-600',
};

/** One translated field with the English beside it for reference. */
function Pair({ label, english, error, children }: { label: string; english: string; error?: string; children: ReactNode }) {
  const t = useT();
  return (
    <div className="grid gap-2 border-b border-ink-100 pb-4 last:border-0 last:pb-0 sm:grid-cols-2 sm:gap-4">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-ink-700">{label}</p>
        <p className="whitespace-pre-wrap rounded-xl bg-ink-50 px-3.5 py-2.5 text-[15px] text-ink-600">{english || <span className="text-ink-400">{t('Nothing in English yet')}</span>}</p>
      </div>
      <Field label={t('Translation')} error={error && t(error)}>
        {children}
      </Field>
    </div>
  );
}

export function ProgrammeForm({ id, initial, canDelete }: { id: string | null; initial: ProgrammeValues; canDelete: boolean }) {
  const t = useT();
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const { values, set } = useForm<ProgrammeValues>(initial);
  const save = useAction(saveProgrammeAction, { success: id ? t('Programme saved') : t('Programme added'), onDone: () => router.push('/hq/programmes') });
  const remove = useAction(deleteProgrammeAction, { success: t('Programme deleted'), onDone: () => router.push('/hq/programmes') });
  const errors = save.fields;

  const setHighlight = (index: number, text: string) => set('highlights', values.highlights.map((item, i) => (i === index ? text : item)));
  const moveHighlight = (index: number, by: number) => {
    const next = [...values.highlights];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    set('highlights', next);
  };

  const setWord = <K extends keyof WordsValues>(which: 'bn' | 'hi', key: K, value: WordsValues[K]) =>
    set('i18n', { ...values.i18n, [which]: { ...values.i18n[which], [key]: value } });
  const filled = (which: 'bn' | 'hi') => {
    const w = values.i18n[which];
    return Boolean(w.name || w.ageLabel || w.tagline || w.description || w.timing || w.highlights.some(Boolean));
  };
  // A field error from another language's tab would otherwise go unseen.
  const errorLangs = LANGS.filter((l) => l.key !== 'en' && Object.keys(errors).some((key) => key.startsWith(`i18n.${l.key}.`)));

  const submit = () =>
    save.run(id, {
      ...values,
      ageFromMonths: Number(values.ageFromMonths) || 0,
      ageToMonths: Number(values.ageToMonths) || 0,
      seatsPerClass: Number(values.seatsPerClass) || 0,
      suggestedMonthlyFee: Number(values.suggestedMonthlyFee) || 0,
      sort: Number(values.sort) || 0,
      // Translated points beyond the English ones belong to points that were removed.
      i18n: {
        bn: { ...values.i18n.bn, highlights: values.i18n.bn.highlights.slice(0, values.highlights.length) },
        hi: { ...values.i18n.hi, highlights: values.i18n.hi.highlights.slice(0, values.highlights.length) },
      },
    });

  const translation = (which: 'bn' | 'hi') => {
    const words = values.i18n[which];
    const style = SCRIPT_STYLE[which];
    const err = (key: string) => errors[`i18n.${which}.${key}`];
    const language = t(LANGS.find((l) => l.key === which)?.name ?? '');
    return (
      <Card>
        <CardHeader title={t('{language} wording', { language })} description={t('Shown when a visitor reads the website in {language}. Anything left empty shows the English text.', { language })} />
        <CardBody className="space-y-4">
          <Pair label={t('Name')} english={values.name} error={err('name')}>
            <Input lang={which} style={style} value={words.name} onChange={(e) => setWord(which, 'name', e.target.value)} maxLength={60} invalid={Boolean(err('name'))} />
          </Pair>
          <Pair label={t('Age, as shown')} english={values.ageLabel} error={err('ageLabel')}>
            <Input lang={which} style={style} value={words.ageLabel} onChange={(e) => setWord(which, 'ageLabel', e.target.value)} maxLength={60} invalid={Boolean(err('ageLabel'))} />
          </Pair>
          <Pair label={t('Tagline')} english={values.tagline} error={err('tagline')}>
            <Input lang={which} style={style} value={words.tagline} onChange={(e) => setWord(which, 'tagline', e.target.value)} maxLength={120} invalid={Boolean(err('tagline'))} />
          </Pair>
          <Pair label={t('Description')} english={values.description} error={err('description')}>
            <Textarea lang={which} style={style} rows={6} value={words.description} onChange={(e) => setWord(which, 'description', e.target.value)} maxLength={2000} invalid={Boolean(err('description'))} />
          </Pair>
          <Pair label={t('Timing')} english={values.timing} error={err('timing')}>
            <Input lang={which} style={style} value={words.timing} onChange={(e) => setWord(which, 'timing', e.target.value)} maxLength={80} invalid={Boolean(err('timing'))} />
          </Pair>
          {values.highlights.length ? (
            <div>
              <p className="mb-1 text-sm font-semibold text-ink-700">{t('Highlights')}</p>
              <p className="mb-3 text-sm text-ink-500">{t('Translate every point, or leave them all empty to show the English points.')}</p>
              <ul className="space-y-2">
                {values.highlights.map((english, index) => (
                  <li key={index} className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                    <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-[15px] text-ink-600">{english || <span className="text-ink-400">{t('Empty point')}</span>}</p>
                    <Input
                      lang={which}
                      style={style}
                      aria-label={t('{language} for point {n}', { language, n: index + 1 })}
                      maxLength={160}
                      value={words.highlights[index] ?? ''}
                      onChange={(e) => {
                        const next = values.highlights.map((_, i) => words.highlights[i] ?? '');
                        next[index] = e.target.value;
                        setWord(which, 'highlights', next);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-ink-500">{t('Add the highlights in English first; they can then be translated here.')}</p>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1" role="tablist" aria-label={t('Language')}>
          {LANGS.map((l) => (
            <button
              key={l.key}
              type="button"
              role="tab"
              aria-selected={lang === l.key}
              lang={l.key}
              onClick={() => setLang(l.key)}
              style={l.key === 'en' ? undefined : SCRIPT_STYLE[l.key]}
              className={cn('inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold', lang === l.key ? 'bg-brand-700 text-white' : 'text-ink-600 hover:bg-ink-50')}
            >
              {l.label}
              {l.key !== 'en' && filled(l.key) ? <span className={cn('h-1.5 w-1.5 rounded-full', lang === l.key ? 'bg-white' : 'bg-mint-500')} title={t('Has a translation')} /> : null}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-500">{t('The website is in three languages. English is the main text; Bengali and Hindi are optional.')}</p>
      </div>
      {errorLangs.length && !errorLangs.some((l) => l.key === lang) ? (
        <Notice tone="red" className="mb-4">
          {t('Something needs correcting in the {languages} wording.', { languages: errorLangs.map((l) => t(l.name)).join(` ${t('and')} `) })}
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {lang !== 'en' ? (
            translation(lang)
          ) : (
            <>
              <Card>
                <CardHeader title={t('What parents see')} description={t('Shown on the Programmes pages of the website.')} />
                <CardBody>
                  <FormGrid>
                    <Field label={t('Name')} required error={errors.name && t(errors.name)}>
                      <Input value={values.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
                    </Field>
                    <Field label={t('Web address name')} hint={t('Small letters and dashes. Used in the link of the programme page.')} error={errors.slug && t(errors.slug)}>
                      <Input value={values.slug} onChange={(e) => set('slug', e.target.value)} placeholder={t('Made from the name if left empty')} autoCapitalize="none" invalid={Boolean(errors.slug)} />
                    </Field>
                    <Field label={t('Age, as shown')} hint={t('For example: 2.5 to 3.5 years')} error={errors.ageLabel && t(errors.ageLabel)}>
                      <Input value={values.ageLabel} onChange={(e) => set('ageLabel', e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('From, months')} error={errors.ageFromMonths && t(errors.ageFromMonths)}>
                        <Input type="number" min={0} value={values.ageFromMonths} onChange={(e) => set('ageFromMonths', e.target.value)} invalid={Boolean(errors.ageFromMonths)} />
                      </Field>
                      <Field label={t('To, months')} error={errors.ageToMonths && t(errors.ageToMonths)}>
                        <Input type="number" min={0} value={values.ageToMonths} onChange={(e) => set('ageToMonths', e.target.value)} invalid={Boolean(errors.ageToMonths)} />
                      </Field>
                    </div>
                    <Field label={t('Tagline')} className="sm:col-span-2" error={errors.tagline && t(errors.tagline)}>
                      <Input value={values.tagline} onChange={(e) => set('tagline', e.target.value)} />
                    </Field>
                    <Field label={t('Description')} className="sm:col-span-2" error={errors.description && t(errors.description)}>
                      <Textarea rows={5} value={values.description} onChange={(e) => set('description', e.target.value)} />
                    </Field>
                  </FormGrid>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title={t('Highlights')}
                  description={t('Short points about what children do in this programme.')}
                  action={
                    <Button variant="secondary" size="sm" disabled={values.highlights.length >= 12} onClick={() => set('highlights', [...values.highlights, ''])}>
                      <Plus size={15} /> {t('Add a point')}
                    </Button>
                  }
                />
                <CardBody>
                  {values.highlights.length ? (
                    <ul className="space-y-2">
                      {values.highlights.map((item, index) => (
                        <li key={index} className="flex items-center gap-1.5">
                          <Input value={item} onChange={(e) => setHighlight(index, e.target.value)} aria-label={t('Point {n}', { n: index + 1 })} />
                          <Button variant="ghost" size="sm" className="w-9 px-0" aria-label={t('Move up')} disabled={index === 0} onClick={() => moveHighlight(index, -1)}>
                            <ArrowUp size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="w-9 px-0" aria-label={t('Move down')} disabled={index === values.highlights.length - 1} onClick={() => moveHighlight(index, 1)}>
                            <ArrowDown size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="w-9 px-0 text-accent-600" aria-label={t('Remove')} onClick={() => set('highlights', values.highlights.filter((_, i) => i !== index))}>
                            <Trash2 size={16} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-500">{t('No points yet. Add three or four short ones.')}</p>
                  )}
                  {values.highlights.length && (filled('bn') || filled('hi')) ? (
                    <p className="mt-3 text-sm text-ink-500">{t('After adding, removing or moving a point, check the Bengali and Hindi points: they are matched to these by position.')}</p>
                  ) : null}
                </CardBody>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('Look')} />
            <CardBody className="space-y-4">
              <Field label={t('Photo')}>
                <ImageField value={values.image} onChange={(url) => set('image', url)} folder="programmes" shape="wide" />
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Colour')}</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('Colour')}>
                  {PROGRAMME_COLOURS.map((colour) => (
                    <button
                      key={colour}
                      type="button"
                      role="radio"
                      aria-checked={values.color === colour}
                      onClick={() => set('color', colour)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition',
                        values.color === colour ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-700 hover:border-ink-300',
                      )}
                    >
                      <span className={cn('h-4 w-4 rounded-full', SWATCH[colour])} /> {t(colour)}
                    </button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('For the schools')} description={t('Defaults a school starts from when it sets up classes and fees.')} />
            <CardBody>
              <div className="space-y-4">
                <Field label={t('Seats in a class')} error={errors.seatsPerClass && t(errors.seatsPerClass)}>
                  <Input type="number" min={1} value={values.seatsPerClass} onChange={(e) => set('seatsPerClass', e.target.value)} invalid={Boolean(errors.seatsPerClass)} />
                </Field>
                <Field label={t('Timing')} hint={t('For example: 9:00 am to 11:30 am')} error={errors.timing && t(errors.timing)}>
                  <Input value={values.timing} onChange={(e) => set('timing', e.target.value)} />
                </Field>
                <Field label={t('Suggested monthly fee, rupees')} hint={t('Each school sets its own fee; this is only a guide')} error={errors.suggestedMonthlyFee && t(errors.suggestedMonthlyFee)}>
                  <Input type="number" min={0} value={values.suggestedMonthlyFee} onChange={(e) => set('suggestedMonthlyFee', e.target.value)} invalid={Boolean(errors.suggestedMonthlyFee)} />
                </Field>
                <Field label={t('Order in lists')} hint={t('Smaller numbers come first')} error={errors.sort && t(errors.sort)}>
                  <Input type="number" min={0} value={values.sort} onChange={(e) => set('sort', e.target.value)} />
                </Field>
                <Toggle checked={values.active} onChange={(next) => set('active', next)} label={t('Active')} hint={t('An inactive programme is hidden from the website and from new admissions. Children already in it are not affected.')} />
              </div>
            </CardBody>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {id && canDelete ? (
              <ConfirmButton
                size="sm"
                title={t('Delete {name}?', { name: initial.name })}
                text={t('A programme that children, classes, fees or enquiries use cannot be deleted. Make it inactive instead.')}
                confirmLabel={t('Delete programme')}
                onConfirm={async () => void (await remove.run(id))}
              >
                <Trash2 size={15} /> {t('Delete')}
              </ConfirmButton>
            ) : (
              <span />
            )}
            <span className="flex gap-2">
              <LinkButton href="/hq/programmes" variant="secondary">
                {t('Cancel')}
              </LinkButton>
              <LoadingButton loading={save.busy} onClick={submit}>
                {id ? t('Save programme') : t('Add programme')}
              </LoadingButton>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
