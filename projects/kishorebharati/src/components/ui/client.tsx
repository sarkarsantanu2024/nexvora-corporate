'use client';

/**
 * Interactive building blocks: dialogs, toasts, confirm, URL-bound filters.
 * Everything here is keyboard friendly and closes on Escape.
 */
import { Check, ChevronLeft, ChevronRight, Loader2, Printer, Search, SlidersHorizontal, TriangleAlert, X } from 'lucide-react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
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
import { useT } from './lang';

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

/** True at phone width. False on the first draw, so only use it for things opened by a tap. */
function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639.98px)');
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return phone;
}

type PanelProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

function PanelHead({ title, description, onClose }: Pick<PanelProps, 'title' | 'description' | 'onClose'>) {
  const t = useT();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-ink-900">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label={t('Close')}
        className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 transition active:scale-90 hover:bg-ink-100"
      >
        <X size={20} />
      </button>
    </div>
  );
}

const SPRING = { type: 'spring', stiffness: 360, damping: 36 } as const;
const BACKDROP = 'absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]';
const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

/**
 * A panel that slides up from the bottom of a phone. Pull its top edge up to
 * open it to the full screen, pull it down to shrink it again or to shut it.
 * On a phone every Modal and Drawer is drawn as one of these.
 */
export function BottomSheet({ open, onClose, title, description, children, footer }: PanelProps) {
  const drag = useDragControls();
  const [full, setFull] = useState(false);
  useOverlay(open, onClose);
  useEffect(() => {
    if (!open) setFull(false);
  }, [open]);
  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <div className="no-print fixed inset-0 z-50" role="dialog" aria-modal="true">
            <motion.div className={BACKDROP} {...fade} onClick={onClose} />
            <motion.section
              className={cn(
                'absolute inset-x-0 bottom-0 mx-auto flex max-w-xl flex-col bg-white shadow-lift transition-[min-height,border-radius] duration-300',
                full ? 'max-h-dvh min-h-dvh rounded-none pt-[env(safe-area-inset-top)]' : 'max-h-[88dvh] min-h-[30dvh] rounded-t-3xl',
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SPRING}
              drag="y"
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: full ? 0 : 0.25, bottom: 0.7 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -50 || info.velocity.y < -500) setFull(true);
                else if (info.offset.y > 90 || info.velocity.y > 500) {
                  if (full) setFull(false);
                  else onClose();
                }
              }}
            >
              <div className="shrink-0 cursor-grab touch-none border-b border-ink-100 px-5 pb-3 pt-2.5" onPointerDown={(event) => drag.start(event)} onDoubleClick={() => setFull((value) => !value)}>
                <span className="mx-auto mb-2.5 block h-1.5 w-11 rounded-full bg-ink-200" />
                <PanelHead title={title} description={description} onClose={onClose} />
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
              {footer ? (
                <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-ink-100 px-5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-3.5 [&>*]:flex-1 sm:[&>*]:flex-none">{footer}</div>
              ) : null}
            </motion.section>
          </div>
        ) : null}
      </AnimatePresence>
    </Portal>
  );
}

/** A dialog in the middle of the screen; a bottom sheet on a phone. */
export function Modal({ size = 'md', ...props }: PanelProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const phone = useIsPhone();
  if (phone) return <BottomSheet {...props} />;
  return <DeskModal size={size} {...props} />;
}

function DeskModal({ open, onClose, title, description, children, footer, size }: PanelProps & { size: 'sm' | 'md' | 'lg' | 'xl' }) {
  useOverlay(open, onClose);
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <motion.div className={BACKDROP} {...fade} onClick={onClose} />
            <motion.div
              className={cn('relative flex max-h-[92dvh] w-full flex-col rounded-3xl bg-white shadow-lift', width)}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className="border-b border-ink-100 px-5 py-4">
                <PanelHead title={title} description={description} onClose={onClose} />
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
              {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-5 py-4">{footer}</div> : null}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </Portal>
  );
}

/**
 * A panel for a form beside a list. Laptop: slides in from the right, and its
 * left edge can be pulled to make it wider. Phone: a bottom sheet.
 */
export function Drawer({ wide, ...props }: PanelProps & { wide?: boolean }) {
  const phone = useIsPhone();
  if (phone) return <BottomSheet {...props} />;
  return <SideDrawer wide={wide} {...props} />;
}

function SideDrawer({ open, onClose, title, description, children, footer, wide }: PanelProps & { wide?: boolean }) {
  const [big, setBig] = useState(false);
  useOverlay(open, onClose);
  useEffect(() => {
    if (!open) setBig(false);
  }, [open]);
  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
            <motion.div className={BACKDROP} {...fade} onClick={onClose} />
            <motion.div
              className={cn('relative flex h-full w-full flex-col bg-white shadow-lift transition-[max-width] duration-300', big ? 'max-w-5xl' : wide ? 'max-w-2xl' : 'max-w-md')}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={SPRING}
            >
              {/* the edge to pull: left to widen, right to narrow or shut */}
              <motion.div
                aria-hidden
                className="group absolute inset-y-0 -left-2 z-10 flex w-4 cursor-ew-resize touch-none items-center justify-center"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                dragSnapToOrigin
                onDoubleClick={() => setBig((value) => !value)}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) setBig(true);
                  else if (info.offset.x > 40) {
                    if (big) setBig(false);
                    else onClose();
                  }
                }}
              >
                <span className="h-12 w-1.5 rounded-full bg-ink-300 opacity-60 transition group-hover:bg-brand-500 group-hover:opacity-100" />
              </motion.div>
              <div className="border-b border-ink-100 px-5 py-4">
                <PanelHead title={title} description={description} onClose={onClose} />
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
              {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-5 py-4">{footer}</div> : null}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
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
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(1rem+var(--dash-bottom))] z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
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
  confirmLabel,
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
  const t = useT();
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
              {t('Cancel')}
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
              {confirmLabel ?? t('Yes, continue')}
            </LoadingButton>
          </>
        }
      >
        <div className="text-[15px] text-ink-600">{text ?? t('This cannot be undone.')}</div>
      </Modal>
    </>
  );
}

export function PrintButton({ label }: { label?: string }) {
  const t = useT();
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass('secondary', 'md', 'no-print')}>
      <Printer size={18} /> {label ?? t('Print')}
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

/**
 * Filters on a phone.
 *
 * On a laptop a list's dropdowns and date pickers sit in a row above it. A
 * phone has no room for that row, so inside a <FilterHost> (the dashboard
 * frame is one) each <UrlSelect> and <UrlDate> hides itself at phone width
 * and hands its choices to a round button at the bottom right. Tapping it
 * slides up a sheet with every filter as a tick list. A screen does nothing
 * special: it keeps placing UrlSelect and UrlDate as before.
 */
type FilterDef =
  | { kind: 'select'; param: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'date'; param: string; label: string; type: 'date' | 'month'; max?: string };

const FilterHostContext = createContext<((def: FilterDef) => () => void) | null>(null);

function useFilterSlot(def: FilterDef): boolean {
  const register = useContext(FilterHostContext);
  const key = JSON.stringify(def);
  useEffect(() => {
    if (!register) return;
    return register(JSON.parse(key) as FilterDef);
  }, [register, key]);
  return Boolean(register);
}

export function FilterHost({ children }: { children: ReactNode }) {
  const [defs, setDefs] = useState<FilterDef[]>([]);
  const register = useCallback((def: FilterDef) => {
    setDefs((list) => (list.some((d) => d.param === def.param) ? list.map((d) => (d.param === def.param ? def : d)) : [...list, def]));
    return () => setDefs((list) => list.filter((d) => d !== def));
  }, []);
  return (
    <FilterHostContext.Provider value={register}>
      {children}
      {defs.length ? <FilterButton defs={defs} /> : null}
    </FilterHostContext.Provider>
  );
}

function FilterButton({ defs }: { defs: FilterDef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { get, set } = useUrlParam();
  const t = useT();
  const [open, setOpen] = useState(false);
  const active = defs.filter((def) => get(def.param)).length;

  const clearAll = () => {
    const next = new URLSearchParams(params.toString());
    for (const def of defs) next.delete(def.param);
    next.delete('page');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <button
        type="button"
        aria-label={active ? `${t('Filters')}: ${active}` : t('Filters')}
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-[calc(1rem+var(--dash-bottom))] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white shadow-lift transition-transform active:scale-90 sm:hidden"
      >
        <SlidersHorizontal size={22} />
        {active ? <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">{active}</span> : null}
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('Filters')}
        footer={
          <>
            <Button variant="secondary" className="flex-1" disabled={!active} onClick={clearAll}>
              {t('Clear all')}
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              {t('Show results')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {defs.map((def) => (
            <fieldset key={def.param}>
              <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">{def.label}</legend>
              {def.kind === 'date' ? (
                <input type={def.type} aria-label={def.label} value={get(def.param)} max={def.max} onChange={(event) => set(def.param, event.target.value)} className="control" />
              ) : (
                <ul className="overflow-hidden rounded-xl border border-ink-200">
                  {def.options.map((option) => {
                    const checked = get(def.param) === option.value;
                    return (
                      <li key={option.value} className="border-b border-ink-100 last:border-b-0">
                        <label className={cn('flex cursor-pointer items-center gap-3 px-3.5 py-3 text-[15px] active:bg-ink-50', checked ? 'font-semibold text-brand-800' : 'text-ink-800')}>
                          <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => set(def.param, option.value)} />
                          <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors', checked ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-300 bg-white text-transparent')}>
                            <Check size={14} strokeWidth={3} />
                          </span>
                          {option.label}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

/** Search box bound to ?q= ; waits for a pause in typing. */
export function SearchInput({ placeholder: given, param = 'q', className }: { placeholder?: string; param?: string; className?: string }) {
  const t = useT();
  const placeholder = given ?? t('Search');
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
  const inSheet = useFilterSlot({ kind: 'select', param, label, options });
  return (
    <select aria-label={label} value={get(param)} onChange={(event) => set(param, event.target.value)} className={cn('control w-auto min-w-[9rem] pr-9', inSheet && 'max-sm:hidden', className)}>
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
  const inSheet = useFilterSlot({ kind: 'date', param, label, type, max });
  return <input type={type} aria-label={label} value={get(param)} max={max} onChange={(event) => set(param, event.target.value)} className={cn('control w-auto', inSheet && 'max-sm:hidden', className)} />;
}

export function Pagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const t = useT();
  const { set } = useUrlParam();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="no-print flex items-center justify-between gap-3 px-4 py-3 text-sm text-ink-500">
      <span>
        {t('{from} to {to} of {total}', { from, to, total })}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => set('page', String(page - 1))} aria-label={t('Previous page')}>
          <ChevronLeft size={16} />
        </Button>
        <span className="px-2 font-semibold text-ink-700">
          {page} / {pages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => set('page', String(page + 1))} aria-label={t('Next page')}>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
