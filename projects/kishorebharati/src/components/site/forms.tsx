'use client';

/**
 * The public contact form. It posts JSON to its route under /api/public,
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
import { SCHOOL, gradeLabel } from '@/config/school';
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

/* ───────────── the school's forms ───────────── */

/** Admission enquiry: lands in Enquiries with the subject "Admission" and the class asked about. */
export function AdmissionForm({ copy, whatsapp, whatsappMessage }: { copy: FormCopy; whatsapp: string; whatsappMessage: string }) {
  const { lang, t } = useSite();
  const f = t.form;
  const form = useEnquiry('/api/public/admission', { name: '', phone: '', studentName: '', grade: '', message: '', website: '' }, (v, e) => {
    const found: Errors = {};
    need(found, v, 'name', e.yourName);
    checkPhone(found, v, e);
    need(found, v, 'grade', e.grade);
    return found;
  });
  const { errors, bind } = form;
  return (
    <Shell form={form} copy={copy} whatsapp={whatsapp} whatsappText={whatsappMessage}>
      <Field label={f.guardianName} required error={errors.name}>
        <Input {...bind('name')} autoComplete="name" maxLength={80} />
      </Field>
      <Field label={f.phone} required error={errors.phone}>
        <Input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder={f.phonePlaceholder} />
      </Field>
      <Field label={f.grade} required error={errors.grade}>
        <Select {...bind('grade')}>
          <option value="">{f.chooseGrade}</option>
          {SCHOOL.grades.map((grade) => (
            <option key={grade} value={grade}>
              {gradeLabel(grade, lang)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={f.studentName} error={errors.studentName} hint={f.optional}>
        <Input {...bind('studentName')} maxLength={80} />
      </Field>
      <Field label={f.question} error={errors.message} hint={f.optional} className={full}>
        <Textarea {...bind('message')} maxLength={1000} rows={3} />
      </Field>
    </Shell>
  );
}

/** Alumni register: lands in Enquiries with the subject "Alumni". */
export function AlumniForm({ copy, whatsapp, whatsappMessage }: { copy: FormCopy; whatsapp: string; whatsappMessage: string }) {
  const f = useSite().t.form;
  const form = useEnquiry('/api/public/alumni', { name: '', phone: '', email: '', batch: '', message: '', website: '' }, (v, e) => {
    const found: Errors = {};
    need(found, v, 'name', e.yourName);
    checkPhone(found, v, e);
    checkEmail(found, v, e);
    need(found, v, 'batch', e.batch);
    return found;
  });
  const { errors, bind } = form;
  return (
    <Shell form={form} copy={copy} whatsapp={whatsapp} whatsappText={whatsappMessage}>
      <Field label={f.yourName} required error={errors.name}>
        <Input {...bind('name')} autoComplete="name" maxLength={80} />
      </Field>
      <Field label={f.batch} required error={errors.batch}>
        <Input {...bind('batch')} inputMode="numeric" maxLength={20} placeholder={f.batchPlaceholder} />
      </Field>
      <Field label={f.phone} required error={errors.phone}>
        <Input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder={f.phonePlaceholder} />
      </Field>
      <Field label={f.email} error={errors.email} hint={f.optional}>
        <Input {...bind('email')} type="email" autoComplete="email" maxLength={120} />
      </Field>
      <Field label={f.now} error={errors.message} hint={f.optional} className={full}>
        <Textarea {...bind('message')} maxLength={1000} rows={3} />
      </Field>
    </Shell>
  );
}

/** Complaint: lands in Enquiries with the subject "Grievance". */
export function GrievanceForm({ copy }: { copy: FormCopy }) {
  const f = useSite().t.form;
  const form = useEnquiry('/api/public/grievance', { name: '', phone: '', message: '', website: '' }, (v, e) => {
    const found: Errors = {};
    need(found, v, 'name', e.yourName);
    checkPhone(found, v, e);
    need(found, v, 'message', e.complaint);
    return found;
  });
  const { errors, bind } = form;
  return (
    <Shell form={form} copy={copy} whatsapp="" whatsappText="">
      <Field label={f.yourName} required error={errors.name}>
        <Input {...bind('name')} autoComplete="name" maxLength={80} />
      </Field>
      <Field label={f.phone} required error={errors.phone}>
        <Input {...bind('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder={f.phonePlaceholder} />
      </Field>
      <Field label={f.complaint} required error={errors.message} hint={f.complaintPrivacy} className={full}>
        <Textarea {...bind('message')} maxLength={2000} rows={5} />
      </Field>
    </Shell>
  );
}
