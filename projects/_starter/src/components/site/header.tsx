'use client';

/**
 * The site header. It runs the full width of the screen. Tall and airy at the
 * top of a page; once the visitor scrolls it shrinks, turns to frosted white
 * and gains a shadow. Below the desktop width the links move into a drawer
 * that slides in from the right.
 */
import { Check, ChevronDown, Globe, LogIn, Menu, Phone, X } from 'lucide-react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { LANG_NAMES, LANGS, localePath, splitLocale, type Lang } from '@/lib/i18n';
import { telLink, waLink } from '@/lib/wa';
import { fill } from './i18n';
import { SiteLink, useSite } from './i18n/client';
import { WhatsAppIcon } from './icons';
import { GUTTER } from './theme';
import { ctaClass } from './ui';

export type NavItem = { href: string; label: string };

type Props = {
  brand: { name: string; tagline: string; mark: string };
  nav: NavItem[];
  enquireLabel: string;
  loginLabel: string;
  phone: string;
  whatsapp: string;
  whatsappMessage: string;
};

const isActive = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

/** Remembered only so a returning visitor's choice can be offered again; nothing redirects on it. */
const rememberLang = (lang: Lang) => {
  document.cookie = `app_lang=${lang}; path=/; max-age=31536000; samesite=lax`;
};

function Brand({ brand, small }: { brand: Props['brand']; small: boolean }) {
  const { t } = useSite();
  return (
    <SiteLink href="/" aria-label={fill(t.header.homeAria, { name: brand.name })} className="group flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-xl">
      <span className={cn('relative block shrink-0 transition-all duration-300', small ? 'h-10 w-10' : 'h-11 w-11 sm:h-14 sm:w-14')}>
        {brand.mark.startsWith('/') ? (
          <Image src={brand.mark} alt="" fill sizes="56px" priority className="object-contain transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.mark} alt="" className="h-full w-full object-contain" />
        )}
      </span>
      <span className="leading-none">
        <span className={cn('block whitespace-nowrap font-display font-extrabold tracking-tight text-brand-700 transition-all duration-300', small ? 'text-xl' : 'text-xl sm:text-2xl')}>
          {brand.name}
        </span>
        <span className="mt-0.5 block whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.14em] text-accent-600 sm:text-xs">{brand.tagline}</span>
      </span>
    </SiteLink>
  );
}

/**
 * The language menu in the header: a button that opens a short list. The
 * links are plain anchors, so the page loads afresh in the new language
 * (the <html lang> and the typefaces change with it).
 */
function LanguageMenu({ path }: { path: string }) {
  const { lang, t } = useSite();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={boxRef}
      className="relative"
      onBlur={(e) => {
        // Tabbing out of the list closes it.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="language-list"
        aria-label={`${t.header.language}: ${LANG_NAMES[lang].own}`}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold text-brand-800 transition hover:bg-brand-50"
      >
        <Globe aria-hidden size={18} strokeWidth={2.2} />
        <span lang={LANG_NAMES[lang].htmlLang}>{LANG_NAMES[lang].short}</span>
        <ChevronDown aria-hidden size={15} strokeWidth={2.6} className={cn('transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            id="language-list"
            aria-label={t.header.chooseLanguage}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-lift"
          >
            {LANGS.map((code) => {
              const current = code === lang;
              return (
                <li key={code}>
                  <a
                    href={localePath(code, path)}
                    hrefLang={LANG_NAMES[code].htmlLang}
                    lang={LANG_NAMES[code].htmlLang}
                    aria-current={current ? 'true' : undefined}
                    onClick={() => rememberLang(code)}
                    className={cn(
                      'flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-3.5 text-base font-semibold leading-normal transition',
                      current ? 'bg-brand-100 text-brand-800' : 'text-ink-800 hover:bg-ink-50',
                    )}
                  >
                    {LANG_NAMES[code].own}
                    {current ? <Check aria-hidden size={17} strokeWidth={2.8} /> : null}
                  </a>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SiteHeader({ brand, nav, enquireLabel, loginLabel, phone, whatsapp, whatsappMessage }: Props) {
  const { lang, t } = useSite();
  // The address bar shows /bn/about; the menu compares against /about.
  const path = splitLocale(usePathname()).path;
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  // A link was followed: put the drawer away.
  useEffect(() => setOpen(false), [path]);

  // While the drawer is open: lock the page behind it, close on Escape, keep Tab inside it.
  useEffect(() => {
    if (!open) return;
    const opener = openerRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const items = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button');
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [open]);

  const tel = telLink(phone);
  const wa = waLink(whatsapp, whatsappMessage);

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-full bg-brand-700 px-5 py-3 font-display font-bold text-white transition-transform focus:translate-y-0"
      >
        {t.header.skip}
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300',
          scrolled ? 'bg-white/90 shadow-[0_6px_30px_-12px_rgba(42,36,92,.35)] backdrop-blur-md' : 'bg-white',
        )}
      >
        {/* Full width with side padding, not boxed to the content width. */}
        <div className={cn(GUTTER, 'flex w-full items-center justify-between gap-3 transition-[height] duration-300', scrolled ? 'h-16' : 'h-[72px] sm:h-[88px]')}>
          <Brand brand={brand} small={scrolled} />

          <nav aria-label={t.header.mainNav} className="hidden min-[1360px]:block">
            <ul className="flex items-center 2xl:gap-1">
              {nav.map((item) => {
                const active = isActive(path, item.href);
                return (
                  <li key={item.href}>
                    <SiteLink
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex min-h-[44px] items-center whitespace-nowrap rounded-full px-3 text-[15px] font-semibold leading-normal transition-colors min-[1700px]:px-4 min-[1700px]:text-base',
                        active ? 'text-brand-800' : 'text-ink-700 hover:text-brand-700',
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full bg-brand-100"
                          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                      <span className="relative">{item.label}</span>
                    </SiteLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageMenu path={path} />
            </div>
            <Link
              href="/login"
              className="hidden h-11 min-w-[44px] items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[15px] font-bold leading-normal text-brand-800 transition hover:bg-brand-50 md:inline-flex"
            >
              <LogIn aria-hidden size={17} strokeWidth={2.4} />
              {loginLabel}
            </Link>
            <SiteLink href="/contact#enquire" className={ctaClass('red', 'sm', 'px-4 sm:px-5')}>
              {enquireLabel}
            </SiteLink>
            <button
              ref={openerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t.header.openMenu}
              aria-expanded={open}
              aria-controls="site-drawer"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-800 transition hover:bg-brand-100 active:scale-95 min-[1360px]:hidden"
            >
              <Menu aria-hidden size={22} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </header>
      {/* The header is fixed, so that shrinking it never moves the page; this keeps its place in the flow. */}
      <div aria-hidden className="h-[72px] sm:h-[88px]" />

      {/* Outside the header on purpose: a header with backdrop-filter traps anything fixed inside it. */}
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 min-[1360px]:hidden" role="dialog" aria-modal="true" aria-label={t.header.menu} id="site-drawer">
            <motion.div
              className="absolute inset-0 bg-brand-950/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={drawerRef}
              className="absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col overflow-hidden rounded-l-[2rem] bg-white shadow-2xl"
              initial={reduce ? { opacity: 0 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <Brand brand={brand} small />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.header.closeMenu}
                  className="grid h-11 w-11 place-items-center rounded-full bg-ink-100 text-ink-700 transition hover:bg-ink-200 active:scale-95"
                >
                  <X aria-hidden size={22} strokeWidth={2.4} />
                </button>
              </div>

              <div className="scrollbar-thin flex-1 overflow-y-auto">
                <nav aria-label={t.header.menu} className="px-3 py-3">
                  <motion.ul initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.08 } } }}>
                    {[{ href: '/', label: t.nav.home }, ...nav].map((item) => {
                      const active = isActive(path, item.href);
                      return (
                        <motion.li
                          key={item.href}
                          variants={{ hidden: reduce ? { opacity: 1 } : { opacity: 0, x: 24 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } }}
                        >
                          <SiteLink
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex min-h-[48px] items-center rounded-2xl px-4 font-display text-xl font-bold leading-normal transition',
                              active ? 'bg-brand-100 text-brand-800' : 'text-ink-800 hover:bg-ink-50',
                            )}
                          >
                            {item.label}
                          </SiteLink>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </nav>

                <div className="px-5 pb-4">
                  <p id="drawer-language" className="flex items-center gap-1.5 text-sm font-bold text-ink-500">
                    <Globe aria-hidden size={15} />
                    {t.header.language}
                  </p>
                  <ul aria-labelledby="drawer-language" className="mt-2 grid grid-cols-3 gap-2">
                    {LANGS.map((code) => {
                      const current = code === lang;
                      return (
                        <li key={code}>
                          <a
                            href={localePath(code, path)}
                            hrefLang={LANG_NAMES[code].htmlLang}
                            lang={LANG_NAMES[code].htmlLang}
                            aria-current={current ? 'true' : undefined}
                            onClick={() => rememberLang(code)}
                            className={cn(
                              'flex min-h-[44px] items-center justify-center rounded-xl border px-2 text-[15px] font-bold leading-normal transition',
                              current ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-700 hover:border-ink-300',
                            )}
                          >
                            {LANG_NAMES[code].own}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-ink-100 bg-brand-50/60 p-4">
                <SiteLink href="/contact#enquire" onClick={() => setOpen(false)} className={ctaClass('red', 'md', 'w-full')}>
                  {enquireLabel}
                </SiteLink>
                <div className="grid grid-cols-2 gap-2.5">
                  {tel ? (
                    <a href={tel} className={ctaClass('outline', 'sm', 'w-full px-3')}>
                      <Phone aria-hidden size={17} strokeWidth={2.4} />
                      {t.header.call}
                    </a>
                  ) : null}
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className={ctaClass('whatsapp', 'sm', 'w-full px-3')}>
                      <WhatsAppIcon size={18} />
                      {t.header.whatsapp}
                    </a>
                  ) : null}
                </div>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-full text-center text-[15px] font-bold leading-normal text-brand-800 hover:bg-white"
                >
                  <LogIn aria-hidden size={17} strokeWidth={2.4} />
                  {fill(t.header.loginFor, { login: loginLabel })}
                </Link>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
