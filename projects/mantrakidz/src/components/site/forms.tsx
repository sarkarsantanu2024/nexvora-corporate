'use client';

/**
 * The three public forms. Each posts JSON to its route under /api/public,
 * shows the server's field errors under the fields, and swaps itself for a
 * thank-you card (animated tick, WhatsApp button) once the row is saved.
 * Labels and messages come from the dictionary of the visitor's language,
 * and the language is sent with the form so the server answers in it too.
 */
import { Loader2, RotateCcw, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/core';
import { cn } from '@/lib/cn';
import { waLink } from '@/lib/wa';
import { fill, type Dict } from './i18n';
import { useSite } from './i18n/client';
import { WhatsAppIcon } from './icons';
import { ctaClass } from './ui';

type Errors = Record<string, string>;
type Values = Record<string, string>;
type Rule = (values: Values, e: Dict['errors']) => Errors;

const MOBILE = /^(\+?91|0)?[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The same checks the server makes, run first in the browser so the answer is instant. */
const need = (errors: Errors, values: Values, name: string, message: string) => {
  if (!values[name]?.trim()) errors[name] = message;
};
const checkPhone = (errors: Errors, values: Values, e: Dict['errors']) => {
  const digits = (values.phone ?? '').replace(/[\s\-()]/g, '');
  if (!digits) errors.phone = e.phoneRequired;
  else if (!MOBILE.test(digits)) errors.phone = e.phone;
};
const checkEmail = (errors: Errors, values: Values, e: Dict['errors']) => {
  if (values.email?.trim() && !EMAIL.test(values.email.trim())) errors.email = e.email;
};

function useEnquiry(endpoint: string, initial: Values, rule: Rule) {
  const { lang, t } = useSite();
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [problem, setProblem] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _gone, ...rest }) => rest);
  };

  /** Props for a text input, select or textarea bound to one value. */
  const bind = (name: string) => ({
    name,
    value: values[name] ?? '',
    invalid: Boolean(errors[name]),
    'aria-invalid': errors[name] ? (true as const) : undefined,
    onChange: (e: { target: { value: string } }) => set(name, e.target.value),
  });

  const focusFirstError = (found: Errors) => {
    const first = Object.keys(found)[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const found = rule(values, t.errors);
    setErrors(found);
    setProblem('');
    if (Object.keys(found).length) {
      focusFirstError(found);
      return;
    }
    setSending(true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...values, lang }) });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; fields?: Errors } | null;
      if (res.ok && body?.ok) {
        setDone(true);
      } else {
        const fields = body?.fields ?? {};
        setErrors(fields);
        setProblem(Object.keys(fields).length ? '' : (body?.error ?? t.errors.generic));
        focusFirstError(fields);
      }
    } catch {
      setProblem(t.errors.network);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setValues(initial);
    setErrors({});
    setProblem('');
    setDone(false);
  };

  return { values, errors, problem, sending, done, set, bind, submit, reset, formRef };
}

/* ───────────── shared pieces ───────────── */

/** Hidden from people, tempting to bots. Whatever fills it in is not a person. */
function Honeypot({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        {label}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

function Tick() {
  const reduce = useReducedMotion();
  const draw = (delay: number) => ({
    initial: reduce ? false : { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 0.5, delay, ease: 'easeOut' as const },
  });
  return (
    <motion.div
      aria-hidden
      className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-mint-100"
      initial={reduce ? false : { scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
    >
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <motion.circle cx="32" cy="32" r="27" stroke="#17a685" strokeWidth="5" {...draw(0.1)} />
        <motion.path d="m20 33 8.5 8.5L45 24" stroke="#0c6b56" strokeWidth="6" {...draw(0.45)} />
      </svg>
    </motion.div>
  );
}

type FormCopy = { buttonLabel: string; successHeading: string; successText: string };

function Shell({
  form,
  copy,
  whatsapp,
  whatsappText,
  children,
}: {
  form: ReturnType<typeof useEnquiry>;
  copy: FormCopy;
  whatsapp: string;
  whatsappText: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const { t } = useSite();
  const wa = waLink(whatsapp, whatsappText);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {form.done ? (
        <motion.div
          key="done"
          role="status"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="py-6 text-center sm:py-10"
        >
          <Tick />
          <h3 className="mt-6 text-balance font-display text-2xl font-extrabold text-brand-950 sm:text-3xl">{copy.successHeading}</h3>
          <p className="mx-auto mt-3 max-w-md text-pretty text-lg leading-relaxed text-ink-600">{copy.successText}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={ctaClass('whatsapp', 'md', 'w-full sm:w-auto')}>
                <WhatsAppIcon size={20} />
                {t.form.continueWhatsapp}
              </a>
            ) : null}
            <button type="button" onClick={form.reset} className={ctaClass('ghost', 'md', 'w-full sm:w-auto')}>
              <RotateCcw aria-hidden size={17} strokeWidth={2.4} />
              {t.form.another}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          ref={form.formRef}
          onSubmit={form.submit}
          noValidate
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <Honeypot value={form.values.website ?? ''} onChange={(v) => form.set('website', v)} label={t.form.honeypot} />
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
          {form.problem ? (
            <p role="alert" className="mt-4 rounded-2xl bg-accent-50 px-4 py-3 font-semibold text-accent-700">
              {form.problem}
            </p>
          ) : null}
          <button type="submit" disabled={form.sending} aria-busy={form.sending} className={ctaClass('red', 'lg', 'mt-6 w-full sm:w-auto')}>
            {form.sending ? <Loader2 aria-hidden size={20} className="animate-spin" /> : <Send aria-hidden size={18} strokeWidth={2.4} />}
            <span>{form.sending ? t.form.sending : copy.buttonLabel}</span>
          </button>
          <p className="mt-3 text-sm text-ink-500">{t.form.privacy}</p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

const full = 'sm:col-span-2';

/* ───────────── admission enquiry ───────────── */

export function AdmissionForm({
  programmes,
  centres,
  defaultProgrammeId = '',
  defaultCentreId = '',
  copy,
  whatsapp,
  today,
}: {
  programmes: { id: string; name: string; ageLabel: string }[];
  centres: { id: string; name: string }[];
  defaultProgrammeId?: string;
  defaultCentreId?: string;
  copy: FormCopy;
  whatsapp: string;
  /** Today's date in India, so a future date of birth cannot be picked. */
  today: string;
}) {
  const f = useSite().t.form;
  const form = useEnquiry(
    '/api/public/admission-enquiry',
    {
      childName: '',
      dob: '',
      programmeId: defaultProgrammeId,
      // With a single centre there is nothing to choose: the enquiry goes to it.
      centreId: defaultCentreId || (centres.length === 1 ? centres[0].id : ''),
      parentName: '',
      phone: '',
      email: '',
      area: '',
      message: '',
      website: '',
    },
    (v, e) => {
      const found: Errors = {};
      need(found, v, 'childName', e.childName);
      if (v.dob && v.dob > today) found.dob = e.dobFuture;
      need(found, v, 'parentName', e.yourName);
      checkPhone(found, v, e);
      checkEmail(found, v, e);
      return found;
    },
  );
  const { errors, bind } = form;
  const child = form.values.childName.trim();

  return (
    <Shell form={form} copy={copy} whatsapp={whatsapp} whatsappText={child ? fill(f.waAdmissionSentFor, { child }) : f.waAdmissionSent}>
      <Field label={f.childName} required error={errors.childName}>
        <Input {...bind('childName')} autoComplete="off" maxLength={80} />
      </Field>
      <Field label={f.dob} error={errors.dob} hint={f.dobHint}>
        <Input {...bind('dob')} type="date" max={today} />
      </Field>
      {/* With one centre there is no centre to pick, so the class box takes the whole row. */}
      <Field label={f.programme} error={errors.programmeId} className={centres.length > 1 ? undefined : full}>
        <Select {...bind('programmeId')}>
          <option value="">{f.notSure}</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.ageLabel ? ` (${p.ageLabel})` : ''}
            </option>
          ))}
        </Select>
      </Field>
      {centres.length > 1 ? (
        <Field label={f.centre} error={errors.centreId}>
          <Select {...bind('centreId')}>
            <option value="">{f.anyCentre}</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label={f.yourName} required error={errors.parentName}>
        <Input {...bind('parentName')} autoComplete="name" maxLength={80} />
      </Field>
      <Field label={f.phone} required error={errors.phone}>
        <Input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder={f.phonePlaceholder} />
      </Field>
      <Field label={f.email} error={errors.email} hint={f.optional}>
        <Input {...bind('email')} type="email" autoComplete="email" maxLength={120} />
      </Field>
      <Field label={f.area} error={errors.area} hint={f.optional}>
        <Input {...bind('area')} autoComplete="address-level3" maxLength={80} placeholder={f.areaPlaceholder} />
      </Field>
      <Field label={f.ask} error={errors.message} className={full}>
        <Textarea {...bind('message')} maxLength={1000} />
      </Field>
    </Shell>
  );
}

/* ───────────── franchise enquiry ───────────── */

export function FranchiseForm({
  ranges,
  copy,
  whatsapp,
  whatsappMessage,
}: {
  /** The English wording, which is what gets stored; the visitor sees it in their language. */
  ranges: readonly string[];
  copy: FormCopy;
  whatsapp: string;
  whatsappMessage: string;
}) {
  const f = useSite().t.form;
  const form = useEnquiry(
    '/api/public/franchise-enquiry',
    { name: '', phone: '', email: '', city: '', state: 'West Bengal', occupation: '', investmentRange: '', hasSpace: '', spaceSqft: '', message: '', website: '' },
    (v, e) => {
      const found: Errors = {};
      need(found, v, 'name', e.yourName);
      checkPhone(found, v, e);
      checkEmail(found, v, e);
      need(found, v, 'city', e.city);
      if (v.hasSpace === 'yes' && v.spaceSqft && !/^\d{1,7}$/.test(v.spaceSqft.trim())) found.spaceSqft = e.sqft;
      return found;
    },
  );
  const { errors, bind, values } = form;
  const rangeWords = f.ranges as Record<string, string>;

  return (
    <Shell form={form} copy={copy} whatsapp={whatsapp} whatsappText={whatsappMessage}>
      <Field label={f.yourName} required error={errors.name}>
        <Input {...bind('name')} autoComplete="name" maxLength={80} />
      </Field>
      <Field label={f.phone} required error={errors.phone}>
        <Input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder={f.phonePlaceholder} />
      </Field>
      <Field label={f.email} error={errors.email} hint={f.optional}>
        <Input {...bind('email')} type="email" autoComplete="email" maxLength={120} />
      </Field>
      <Field label={f.occupation} error={errors.occupation} hint={f.optional}>
        <Input {...bind('occupation')} autoComplete="organization-title" maxLength={120} placeholder={f.occupationPlaceholder} />
      </Field>
      <Field label={f.city} required error={errors.city}>
        <Input {...bind('city')} autoComplete="address-level2" maxLength={80} />
      </Field>
      <Field label={f.state} error={errors.state}>
        <Input {...bind('state')} autoComplete="address-level1" maxLength={80} />
      </Field>
      <Field label={f.invest} error={errors.investmentRange} hint={f.investHint}>
        <Select {...bind('investmentRange')}>
          <option value="">{f.chooseOne}</option>
          {ranges.map((range) => (
            <option key={range} value={range}>
              {rangeWords[range] ?? range}
            </option>
          ))}
        </Select>
      </Field>
      <fieldset>
        <legend className="mb-1.5 block text-sm font-semibold text-ink-700">{f.hasSpace}</legend>
        <div className="flex gap-2">
          {[
            { value: 'yes', label: f.yes },
            { value: 'no', label: f.notYet },
          ].map((option) => {
            const checked = values.hasSpace === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  'flex min-h-[46px] flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 text-[15px] font-semibold transition focus-within:ring-4 focus-within:ring-brand-100',
                  checked ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                )}
              >
                <input type="radio" name="hasSpace" value={option.value} checked={checked} onChange={() => form.set('hasSpace', option.value)} className="sr-only" />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <AnimatePresence initial={false}>
        {values.hasSpace === 'yes' ? (
          <motion.div
            key="sqft"
            className={full}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Field label={f.sqft} error={errors.spaceSqft} hint={f.sqftHint}>
              <Input {...bind('spaceSqft')} inputMode="numeric" maxLength={7} className="sm:max-w-[calc(50%-0.625rem)]" />
            </Field>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <Field label={f.tell} error={errors.message} className={full}>
        <Textarea {...bind('message')} maxLength={1000} />
      </Field>
    </Shell>
  );
}

/* ───────────── contact ───────────── */

export function ContactForm({ copy, whatsapp, whatsappMessage }: { copy: FormCopy; whatsapp: string; whatsappMessage: string }) {
  const f = useSite().t.form;
  const form = useEnquiry('/api/public/contact', { name: '', phone: '', email: '', subject: '', message: '', website: '' }, (v, e) => {
    const found: Errors = {};
    need(found, v, 'name', e.yourName);
    checkPhone(found, v, e);
    checkEmail(found, v, e);
    need(found, v, 'message', e.message);
    return found;
  });
  const { errors, bind } = form;

  return (
    <Shell form={form} copy={copy} whatsapp={whatsapp} whatsappText={whatsappMessage}>
      <Field label={f.yourName} required error={errors.name}>
        <Input {...bind('name')} autoComplete="name" maxLength={80} />
      </Field>
      <Field label={f.phone} required error={errors.phone}>
        <Input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder={f.phonePlaceholder} />
      </Field>
      <Field label={f.email} error={errors.email} hint={f.optional}>
        <Input {...bind('email')} type="email" autoComplete="email" maxLength={120} />
      </Field>
      <Field label={f.subject} error={errors.subject} hint={f.optional}>
        <Input {...bind('subject')} maxLength={120} placeholder={f.subjectPlaceholder} />
      </Field>
      <Field label={f.message} required error={errors.message} className={full}>
        <Textarea {...bind('message')} maxLength={2000} rows={4} />
      </Field>
    </Shell>
  );
}
