'use client';

/**
 * Interactive building blocks: dialogs, toasts, confirm, URL-bound filters.
 * Everything here is keyboard friendly and closes on Escape.
 */
import { Check, ChevronLeft, ChevronRight, Loader2, Printer, Search, TriangleAlert, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { Button, buttonClass } from './core';

/* ───────────── Modal and Drawer ───────────── */

function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
}

function Portal({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? createPortal(children, document.body) : null;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useOverlay(open, onClose);
  if (!open) return null;
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 animate-fade-in bg-ink-900/45 backdrop-blur-[2px]" onClick={onClose} />
        <div className={cn('relative flex max-h-[92dvh] w-full animate-scale-in flex-col rounded-t-3xl bg-white shadow-lift sm:rounded-3xl', width)}>
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
              {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
              <X size={20} />
            </button>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-5 py-4">{footer}</div> : null}
        </div>
      </div>
    </Portal>
  );
}

/** A panel that slides in from the right: for a form beside a list. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useOverlay(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
        <div className="absolute inset-0 animate-fade-in bg-ink-900/45 backdrop-blur-[2px]" onClick={onClose} />
        <div className={cn('relative flex h-full w-full animate-slide-in-right flex-col bg-white shadow-lift', wide ? 'max-w-2xl' : 'max-w-md')}>
          <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
              {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
              <X size={20} />
            </button>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-5 py-4">{footer}</div> : null}
        </div>
      </div>
    </Portal>
  );
}

/* ───────────── Toasts ───────────── */

type Toast = { id: number; kind: 'success' | 'error'; text: string };
const ToastContext = createContext<{ success: (text: string) => void; error: (text: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);
  const api = useRef({ success: (text: string) => push('success', text), error: (text: string) => push('error', text) });

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex max-w-md animate-fade-up items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lift',
              toast.kind === 'success' ? 'bg-ink-900' : 'bg-accent-600',
            )}
          >
            {toast.kind === 'success' ? <Check size={18} className="text-mint-300" /> : <TriangleAlert size={18} />}
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** const toast = useToast(); toast.success('Saved'); toast.error(result.error); */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast needs <ToastProvider>');
  return ctx;
}

/* ───────────── Buttons with state ───────────── */

/** A button that shows a spinner while `loading`. Use for every save. */
export function LoadingButton({
  loading,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button {...props} disabled={disabled || loading}>
      {loading ? <Loader2 size={18} className="animate-spin" /> : null}
      {children}
    </Button>
  );
}

/**
 * Asks before doing something that cannot be undone.
 *   <ConfirmButton title="Void this receipt?" confirmLabel="Void receipt" onConfirm={async () => {…}}>Void</ConfirmButton>
 */
export function ConfirmButton({
  title,
  text,
  confirmLabel = 'Yes, continue',
  onConfirm,
  children,
  danger = true,
  ...props
}: Omit<ComponentProps<typeof Button>, 'onClick'> & {
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="danger" {...props} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={title}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <LoadingButton
              variant={danger ? 'accent' : 'primary'}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmLabel}
            </LoadingButton>
          </>
        }
      >
        <div className="text-[15px] text-ink-600">{text ?? 'This cannot be undone.'}</div>
      </Modal>
    </>
  );
}

export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass('secondary', 'md', 'no-print')}>
      <Printer size={18} /> {label}
    </button>
  );
}

/* ───────────── Filters that live in the URL ───────────── */

/** Changes one query parameter and keeps the rest; resets `page`. */
export function useUrlParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const set = useCallback(
    (name: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(name, value);
      else next.delete(name);
      if (name !== 'page') next.delete('page');
      const query = next.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    },
    [params, pathname, router],
  );
  return { get: (name: string) => params.get(name) ?? '', set, pending };
}

/** Search box bound to ?q= ; waits for a pause in typing. */
export function SearchInput({ placeholder = 'Search', param = 'q', className }: { placeholder?: string; param?: string; className?: string }) {
  const { get, set, pending } = useUrlParam();
  const [value, setValue] = useState(get(param));
  const timer = useRef<number | null>(null);
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => set(param, next.trim()), 300);
        }}
        className="control pl-10"
      />
      {pending ? <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-ink-400" /> : null}
    </div>
  );
}

/** A dropdown bound to a query parameter: status, class, month. */
export function UrlSelect({
  param,
  options,
  label,
  className,
}: {
  param: string;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  const { get, set } = useUrlParam();
  return (
    <select aria-label={label} value={get(param)} onChange={(event) => set(param, event.target.value)} className={cn('control w-auto min-w-[9rem] pr-9', className)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** A date or month picker bound to a query parameter. */
export function UrlDate({ param, type = 'date', label, className, max }: { param: string; type?: 'date' | 'month'; label: string; className?: string; max?: string }) {
  const { get, set } = useUrlParam();
  return <input type={type} aria-label={label} value={get(param)} max={max} onChange={(event) => set(param, event.target.value)} className={cn('control w-auto', className)} />;
}

export function Pagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const { set } = useUrlParam();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="no-print flex items-center justify-between gap-3 px-4 py-3 text-sm text-ink-500">
      <span>
        {from} to {to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => set('page', String(page - 1))} aria-label="Previous page">
          <ChevronLeft size={16} />
        </Button>
        <span className="px-2 font-semibold text-ink-700">
          {page} / {pages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => set('page', String(page + 1))} aria-label="Next page">
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
