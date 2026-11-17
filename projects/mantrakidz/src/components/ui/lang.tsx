'use client';

/**
 * Dashboard words in the person's language, for client components, and the
 * dropdown that changes the language. See src/i18n/ui.ts for how it works.
 */
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { makeT, type Translate, type UiDict } from '@/i18n/ui';
import { cn } from '@/lib/cn';
import { LANGS, LANG_NAMES, type Lang } from '@/lib/i18n';
import { setUiLang } from '@/server/session-actions';

const UiLangContext = createContext<{ lang: Lang; t: Translate }>({ lang: 'en', t: makeT(null) });

/** The dashboard frame wraps every screen in this; `dict` is empty for English. */
export function UiLangProvider({ lang, dict, children }: { lang: Lang; dict: UiDict | null; children: ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(dict) }), [lang, dict]);
  return <UiLangContext.Provider value={value}>{children}</UiLangContext.Provider>;
}

export const useT = (): Translate => useContext(UiLangContext).t;
export const useUiLang = (): Lang => useContext(UiLangContext).lang;

/**
 * The language dropdown of the top bar. Each language is written in its own
 * script, so a person can find theirs whatever the screen is set to.
 */
export function LangMenu() {
  const lang = useUiLang();
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const order: Lang[] = (['en', 'hi', 'bn'] as const).filter((code) => LANGS.includes(code));

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t('Language')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn('flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 text-[13px] font-semibold text-ink-700 transition active:scale-95 hover:bg-ink-50', pending && 'opacity-60')}
      >
        <Languages size={16} className="text-ink-500" />
        {/* the short name on a phone, where the top bar is tight */}
        <span lang={LANG_NAMES[lang].htmlLang} className="sm:hidden">
          {LANG_NAMES[lang].short}
        </span>
        <span lang={LANG_NAMES[lang].htmlLang} className="max-sm:hidden">
          {LANG_NAMES[lang].own}
        </span>
        <ChevronDown size={14} className={cn('text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <ul role="listbox" aria-label={t('Language')} className="absolute right-0 top-full z-10 mt-2 w-44 origin-top-right animate-scale-in rounded-xl border border-ink-200 bg-white p-1 shadow-lift">
          {order.map((code) => (
            <li key={code} role="option" aria-selected={lang === code}>
              <button
                type="button"
                lang={LANG_NAMES[code].htmlLang}
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  if (code === lang) return;
                  start(async () => {
                    await setUiLang(code);
                    router.refresh();
                  });
                }}
                className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm', lang === code ? 'bg-brand-50 font-semibold text-brand-800' : 'font-medium text-ink-700 hover:bg-ink-50')}
              >
                {LANG_NAMES[code].own}
                {lang === code ? <Check size={16} /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
