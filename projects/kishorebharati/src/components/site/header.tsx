'use client';

/**
 * The site header, built like a school's letterhead.
 *
 * Laptop: a thin navy strip (founding year, UDISE, phone, language, login),
 * then the letterhead row: seal, the name in Bengali and English, and the
 * menu as six groups. A group opens a wide panel with its pages. The row
 * stays at the top while the page scrolls and slims down.
 *
 * Phone: a compact letterhead at the top and an app-style bar at the bottom
 * (Home, Notices, Admission, Call, Menu). Menu slides up a sheet with every
 * page as a tile, grouped, plus language, call, WhatsApp and login.
 */
import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Download,
  FileText,
  Globe,
  GraduationCap,
  HandCoins,
  Home,
  Images,
  Info,
  LogIn,
  Mail,
  Megaphone,
  Menu,
  Phone,
  School,
  ShieldCheck,
  Users,
  UserRoundCheck,
  Briefcase,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { LANG_NAMES, LANGS, localePath, splitLocale, type Lang } from '@/lib/i18n';
import { telLink, waLink } from '@/lib/wa';
import { fill } from './i18n';
import { SiteLink, useSite } from './i18n/client';
import { WhatsAppIcon } from './icons';
import { GUTTER } from './theme';
import { ctaClass } from './ui';

/** Icons by name, because a component cannot be handed from the server to the browser. */
export const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  about: School,
  teachers: Users,
  facilities: Building2,
  disclosure: Info,
  academics: BookOpen,
  results: Award,
  events: CalendarDays,
  downloads: Download,
  admission: GraduationCap,
  schemes: HandCoins,
  faq: CircleHelp,
  life: ShieldCheck,
  gallery: Images,
  alumni: UserRoundCheck,
  notices: Megaphone,
  careers: Briefcase,
  contact: Mail,
  file: FileText,
};

export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { key: string; label: string; items: NavItem[] };

type Props = {
  names: { bn: string; en: string };
  tagline: string;
  mark: string;
  udise: string;
  groups: NavGroup[];
  admissionLabel: string;
  callLabel: string;
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

function Letterhead({ names, mark, small, lang }: { names: Props['names']; mark: string; small?: boolean; lang: Lang }) {
  const { t } = useSite();
  // The Bengali name always leads, as on the school's signboard; the other line is English.
  const second = lang === 'bn' ? names.en : names.en === names.bn ? '' : names.en;
  return (
    <SiteLink href="/" aria-label={fill(t.header.homeAria, { name: lang === 'bn' ? names.bn : names.en })} className="group flex min-h-[44px] min-w-0 items-center gap-3 rounded-lg">
      <span className={cn('relative block shrink-0 rounded-full bg-white transition-all duration-300', small ? 'h-10 w-10' : 'h-11 w-11 lg:h-[60px] lg:w-[60px]')}>
        {mark.startsWith('/') ? (
          <Image src={mark} alt="" fill sizes="60px" priority className="object-contain p-0.5 transition-transform duration-700 group-hover:rotate-[20deg]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mark} alt="" className="h-full w-full object-contain" />
        )}
      </span>
      <span className="min-w-0 leading-tight">
        <span lang="bn" className={cn('block truncate font-bold text-brand-950 transition-all duration-300', small ? 'text-[17px]' : 'text-[17px] sm:text-xl lg:text-[23px]')}>
          {names.bn}
        </span>
        {second ? (
          <span lang="en" className="block truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700/80 sm:text-xs">
            {second}
          </span>
        ) : null}
      </span>
    </SiteLink>
  );
}

function LanguageLinks({ path, className, itemClass }: { path: string; className?: string; itemClass: (current: boolean) => string }) {
  const { lang, t } = useSite();
  return (
    <ul aria-label={t.header.chooseLanguage} className={className}>
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
              className={itemClass(current)}
            >
              {LANG_NAMES[code].own}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ───────────── laptop: groups with wide panels ───────────── */

function MegaMenu({ groups, path }: { groups: NavGroup[]; path: string }) {
  const { t } = useSite();
  const [open, setOpen] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const hold = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };
  const later = () => {
    hold();
    closeTimer.current = window.setTimeout(() => setOpen(null), 160);
  };

  useEffect(() => setOpen(null), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    const onDown = (e: PointerEvent) => !navRef.current?.contains(e.target as Node) && setOpen(null);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const current = groups.find((g) => g.key === open);

  return (
    <nav ref={navRef} aria-label={t.header.mainNav} className="hidden xl:block" onMouseLeave={later} onMouseEnter={hold}>
      <ul className="flex items-center">
        {groups.map((group) => {
          const single = group.items.length === 1;
          const here = group.items.some((item) => isActive(path, item.href));
          const cls = cn(
            'relative flex h-11 items-center gap-1 whitespace-nowrap rounded-md px-3 text-[15px] font-semibold transition-colors 2xl:px-4 2xl:text-base',
            here ? 'text-brand-950' : 'text-ink-700 hover:text-brand-950',
          );
          const underline = <span aria-hidden className={cn('absolute inset-x-3 -bottom-0.5 h-[3px] origin-left rounded-full bg-sun-400 transition-transform duration-300', here || open === group.key ? 'scale-x-100' : 'scale-x-0')} />;
          return (
            <li key={group.key}>
              {single ? (
                <SiteLink href={group.items[0].href} className={cls} aria-current={here ? 'page' : undefined} onMouseEnter={() => setOpen(null)}>
                  {group.label}
                  {underline}
                </SiteLink>
              ) : (
                <button
                  type="button"
                  className={cls}
                  aria-expanded={open === group.key}
                  aria-controls="mega-panel"
                  onClick={() => setOpen((v) => (v === group.key ? null : group.key))}
                  onMouseEnter={() => {
                    hold();
                    setOpen(group.key);
                  }}
                >
                  {group.label}
                  <ChevronDown aria-hidden size={15} strokeWidth={2.6} className={cn('transition-transform duration-300', open === group.key && 'rotate-180')} />
                  {underline}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {current ? (
          <motion.div
            id="mega-panel"
            key="panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute inset-x-0 top-full border-t border-brand-950/10 bg-[#fbf7ec] shadow-[0_30px_60px_-30px_rgba(22,26,58,.45)]"
          >
            <div className={cn(GUTTER, 'mx-auto grid max-w-[1560px] grid-cols-[260px_1fr] gap-10 py-8')}>
              <div>
                <p className="text-sm font-semibold text-accent-600">{t.header.menu}</p>
                <p className="mt-1 text-3xl font-bold text-brand-950">{current.label}</p>
                <span aria-hidden className="mt-4 block h-[3px] w-14 rounded-full bg-sun-400" />
              </div>
              <ul className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
                {current.items.map((item, i) => {
                  const Icon = NAV_ICONS[item.icon] ?? FileText;
                  const here = isActive(path, item.href);
                  return (
                    <motion.li key={item.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.25 }}>
                      <SiteLink
                        href={item.href}
                        aria-current={here ? 'page' : undefined}
                        className={cn(
                          'group flex min-h-[64px] items-center gap-3 rounded-lg border px-4 py-3 transition duration-200',
                          here ? 'border-brand-700 bg-white' : 'border-brand-950/10 bg-white/60 hover:-translate-y-0.5 hover:border-brand-700/40 hover:bg-white',
                        )}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-950 text-sun-300 transition-transform duration-300 group-hover:-rotate-6">
                          <Icon aria-hidden size={19} />
                        </span>
                        <span className="text-[16px] font-semibold text-brand-950">{item.label}</span>
                      </SiteLink>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}

/* ───────────── phone: bottom bar and menu sheet ───────────── */

function MenuSheet({ open, onClose, props, path }: { open: boolean; onClose: () => void; props: Props; path: string }) {
  const { lang, t } = useSite();
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tel = telLink(props.phone);
  const wa = waLink(props.whatsapp, props.whatsappMessage);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const items = sheetRef.current.querySelectorAll<HTMLElement>('a[href], button');
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
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] xl:hidden" role="dialog" aria-modal="true" aria-label={t.header.menu} id="site-sheet">
          <motion.div className="absolute inset-0 bg-brand-950/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.div
            ref={sheetRef}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl bg-[#fbf7ec] shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 330, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-brand-950/10 px-4 pb-3 pt-2">
              <span aria-hidden className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-brand-950/20" />
              <p className="pt-4 text-lg font-bold text-brand-950">{t.header.menu}</p>
              <button ref={closeRef} type="button" onClick={onClose} aria-label={t.header.closeMenu} className="mt-3 grid h-11 w-11 place-items-center rounded-full bg-brand-950/5 text-brand-950 active:scale-95">
                <X aria-hidden size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-3">
              {props.groups.map((group, gi) => (
                <section key={group.key} className="mt-3 first:mt-0" aria-labelledby={`sheet-${group.key}`}>
                  <h2 id={`sheet-${group.key}`} className="text-[13px] font-bold text-accent-600">
                    {group.label}
                  </h2>
                  <ul className="mt-2 grid grid-cols-2 gap-2 min-[520px]:grid-cols-3">
                    {group.items.map((item, i) => {
                      const Icon = NAV_ICONS[item.icon] ?? FileText;
                      const here = isActive(path, item.href);
                      return (
                        <motion.li key={item.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 + gi * 0.03 + i * 0.015, duration: 0.25 }}>
                          <SiteLink
                            href={item.href}
                            onClick={onClose}
                            aria-current={here ? 'page' : undefined}
                            className={cn(
                              'flex min-h-[76px] flex-col justify-between gap-2 rounded-xl border p-3 transition active:scale-[.97]',
                              here ? 'border-brand-950 bg-brand-950 text-white' : 'border-brand-950/10 bg-white text-brand-950',
                            )}
                          >
                            <Icon aria-hidden size={20} className={here ? 'text-sun-300' : 'text-brand-700'} />
                            <span className="text-[14.5px] font-semibold leading-snug">{item.label}</span>
                          </SiteLink>
                        </motion.li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              <div className="mt-5 flex items-center gap-2">
                <Globe aria-hidden size={16} className="text-ink-500" />
                <span className="text-sm font-semibold text-ink-600">{t.header.language}</span>
                <LanguageLinks
                  path={path}
                  className="ml-auto flex gap-2"
                  itemClass={(current) => cn('flex h-10 items-center rounded-full border px-4 text-[15px] font-semibold', current ? 'border-brand-950 bg-brand-950 text-white' : 'border-brand-950/20 text-brand-950')}
                />
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-brand-950/10 bg-white p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))]">
              {tel ? (
                <a href={tel} className={ctaClass('indigo', 'sm', 'w-full rounded-lg')}>
                  <Phone aria-hidden size={17} />
                  {props.callLabel}
                </a>
              ) : null}
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={ctaClass('whatsapp', 'sm', 'w-full rounded-lg')}>
                  <WhatsAppIcon size={18} />
                  {t.header.whatsapp}
                </a>
              ) : null}
              <Link href="/login" onClick={onClose} className="col-span-2 flex min-h-[44px] items-center justify-center gap-2 text-[15px] font-semibold text-brand-800">
                <LogIn aria-hidden size={16} />
                {fill(t.header.loginFor, { login: props.loginLabel })}
              </Link>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function TabBar({ path, onMenu, menuOpen, phone, admissionLabel }: { path: string; onMenu: () => void; menuOpen: boolean; phone: string; admissionLabel: string }) {
  const { t } = useSite();
  const tel = telLink(phone);
  const tab = (active: boolean) => cn('flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold transition', active ? 'text-brand-950' : 'text-ink-500');
  return (
    <nav aria-label={t.header.menu} className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-brand-950/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch px-1">
        <li className="flex flex-1">
          <SiteLink href="/" className={tab(path === '/')} aria-current={path === '/' ? 'page' : undefined}>
            <Home aria-hidden size={21} />
            {t.tabs.home}
          </SiteLink>
        </li>
        <li className="flex flex-1">
          <SiteLink href="/notices" className={tab(isActive(path, '/notices'))} aria-current={isActive(path, '/notices') ? 'page' : undefined}>
            <Megaphone aria-hidden size={21} />
            {t.tabs.notices}
          </SiteLink>
        </li>
        <li className="flex flex-1">
          <SiteLink href="/admission" className="-mt-4 flex flex-1 flex-col items-center justify-end gap-0.5 pb-1.5 text-[11.5px] font-bold text-brand-950" aria-current={isActive(path, '/admission') ? 'page' : undefined}>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-600 text-white shadow-[0_8px_20px_-6px_rgba(223,42,34,.7)] ring-4 ring-white">
              <GraduationCap aria-hidden size={22} />
            </span>
            {admissionLabel}
          </SiteLink>
        </li>
        <li className="flex flex-1">
          {tel ? (
            <a href={tel} className={tab(false)}>
              <Phone aria-hidden size={21} />
              {t.tabs.call}
            </a>
          ) : null}
        </li>
        <li className="flex flex-1">
          <button type="button" onClick={onMenu} aria-expanded={menuOpen} aria-controls="site-sheet" className={tab(menuOpen)}>
            <Menu aria-hidden size={21} />
            {t.tabs.menu}
          </button>
        </li>
      </ul>
    </nav>
  );
}

/* ───────────── the header ───────────── */

export function SiteHeader(props: Props) {
  const { lang, t } = useSite();
  const path = splitLocale(usePathname()).path;
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40));
  useEffect(() => setSheet(false), [path]);
  const closeSheet = useCallback(() => setSheet(false), []);
  const tel = telLink(props.phone);

  return (
    <>
      <a href="#main" className="fixed left-4 top-3 z-[70] -translate-y-24 rounded-md bg-brand-950 px-5 py-3 font-bold text-white transition-transform focus:translate-y-0">
        {t.header.skip}
      </a>

      {/* the thin strip: laptop only */}
      <div className="hidden bg-brand-950 text-[13px] text-brand-100 xl:block">
        <div className={cn(GUTTER, 'mx-auto flex h-10 max-w-[1880px] items-center justify-between gap-6')}>
          <p className="flex items-center gap-4">
            <span className="font-semibold text-sun-300">{t.header.estd}</span>
            <span aria-hidden className="h-3 w-px bg-white/20" />
            <span>{fill(t.header.udise, { code: props.udise })}</span>
            <span aria-hidden className="h-3 w-px bg-white/20" />
            <span lang="bn" className="tracking-wide text-brand-100/80">
              {props.tagline}
            </span>
          </p>
          <div className="flex items-center gap-5">
            {tel ? (
              <a href={tel} className="inline-flex min-h-[32px] items-center gap-1.5 font-semibold text-white hover:text-sun-300">
                <Phone aria-hidden size={14} />
                {props.phone}
              </a>
            ) : null}
            <LanguageLinks
              path={path}
              className="flex items-center gap-1"
              itemClass={(current) => cn('inline-flex min-h-[32px] items-center rounded px-2 font-semibold transition', current ? 'bg-white/10 text-white' : 'text-brand-200 hover:text-white')}
            />
            <Link href="/login" className="inline-flex min-h-[32px] items-center gap-1.5 text-brand-200 hover:text-white">
              <LogIn aria-hidden size={14} />
              {props.loginLabel}
            </Link>
          </div>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300',
          scrolled ? 'border-brand-950/10 bg-[#fbf7ec]/95 shadow-[0_10px_30px_-18px_rgba(22,26,58,.5)] backdrop-blur-md' : 'border-transparent bg-[#fbf7ec]',
        )}
      >
        <div className={cn(GUTTER, 'relative mx-auto flex max-w-[1880px] items-center justify-between gap-3 transition-[height] duration-300', scrolled ? 'h-16' : 'h-16 xl:h-[88px]')}>
          <Letterhead names={props.names} mark={props.mark} small={scrolled} lang={lang} />
          <MegaMenu groups={props.groups} path={path} />
          <div className="flex shrink-0 items-center gap-2">
            {tel ? (
              <a href={tel} aria-label={fill(t.dock.call, { phone: props.phone })} className="grid h-11 w-11 place-items-center rounded-full border border-brand-950/15 text-brand-950 transition hover:bg-brand-950 hover:text-white xl:hidden">
                <Phone aria-hidden size={18} />
              </a>
            ) : null}
            <SiteLink href="/admission" className={ctaClass('red', 'sm', 'hidden rounded-md px-5 xl:inline-flex')}>
              {props.admissionLabel}
            </SiteLink>
          </div>
        </div>
      </header>

      <TabBar path={path} onMenu={() => setSheet(true)} menuOpen={sheet} phone={props.phone} admissionLabel={props.admissionLabel} />
      <MenuSheet open={sheet} onClose={closeSheet} props={props} path={path} />
    </>
  );
}
