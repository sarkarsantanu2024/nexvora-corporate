'use client';

/**
 * The frame around every dashboard screen.
 *
 * Laptop: a sidebar on the left and a top bar with the person's name.
 * Phone and tablet: it behaves like an app. A bottom bar holds the screens
 * used most, "More" slides up every screen as a grid of icons (pull it down
 * to shut), and the top bar shows the screen's name with a back arrow on
 * inner screens, because an installed app has no browser buttons.
 *
 * Nothing here belongs to one client: the menu comes from ./nav and the name
 * and logo from src/config/brand.
 */
import { ArrowLeft, ChevronDown, ExternalLink, KeyRound, LogOut, Menu, MessageCircle, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion, useDragControls } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { BRAND } from '@/config/brand';
import type { Role } from '@/db/schema';
import type { UiDict } from '@/i18n/ui';
import { cn } from '@/lib/cn';
import type { Lang } from '@/lib/i18n';
import { logout } from '@/server/session-actions';
import { InstallBanner, SendToWhatsApp } from '../pwa/install-banner';
import { InstallApp, OfflineBar, RouteProgress, usePwa } from '../pwa/pwa';
import { FilterHost } from '../ui/client';
import { LangMenu, UiLangProvider, useT } from '../ui/lang';
import { Avatar } from '../ui/core';
import type { Plan } from '@/lib/plans';
import { NAV, ROLE_LABELS, TABS, canOpen, type Area, type NavItem } from './nav';
import { NotificationBell } from './notifications';

export type ShellUser = { name: string; username: string; role: Role };

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  // '/admin/website' must not light up for '/admin/website/gallery', which has its own entry.
  if (item.href === '/admin/website') return pathname === item.href || (pathname.startsWith('/admin/website/') && !/^\/admin\/website\/(gallery|notices)/.test(pathname));
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Every menu entry this role may open on this plan, in menu order. */
const itemsFor = (area: Area, role: Role, plan: Plan) => NAV[area].flatMap((group) => group.items).filter((item) => canOpen(item, role, plan));

function Menu_({ area, role, plan, onNavigate }: { area: Area; role: Role; plan: Plan; onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="scrollbar-thin flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-3">
      {NAV[area].map((group, index) => {
        const items = group.items.filter((item) => canOpen(item, role, plan));
        if (!items.length) return null;
        return (
          <div key={group.title ?? index}>
            {group.title ? <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{t(group.title)}</p> : null}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        active ? 'bg-brand-50 font-semibold text-brand-800' : 'font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                      )}
                    >
                      <Icon size={18} className={cn('shrink-0', active ? 'text-brand-700' : 'text-ink-400 group-hover:text-ink-600')} />
                      {t(item.label)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-ink-200 px-4">
      <Image src={BRAND.mark} alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-tight text-ink-900">{BRAND.name}</p>
        <p className="truncate text-xs leading-tight text-ink-500">{subtitle}</p>
      </div>
    </div>
  );
}

const SIDE_LINK = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-900';

function SideFooter() {
  const t = useT();
  return (
    <div className="border-t border-ink-200 p-3">
      <InstallApp className={SIDE_LINK} iconSize={16} />
      <Link href="/" target="_blank" className={SIDE_LINK}>
        <ExternalLink size={16} /> {t('Open the website')}
      </Link>
    </div>
  );
}

const TILE = 'grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-150 group-active:scale-90';

/**
 * "More" on a phone: every screen the person may open, as a grid of icons
 * under the same group names as the laptop sidebar.
 */
function MenuSheet({ area, role, plan, subtitle, onClose }: { area: Area; role: Role; plan: Plan; subtitle: string; onClose: () => void }) {
  const pathname = usePathname();
  const t = useT();
  const drag = useDragControls();
  const label = 'mt-1.5 block text-center text-[11.5px] font-medium leading-tight text-ink-700';
  return (
    <div className="no-print fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t('Menu')}>
      <motion.div
        className="absolute inset-0 bg-ink-900/55 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.section
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-white shadow-lift"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        drag="y"
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 500) onClose();
        }}
      >
        {/* the part to pull: the handle and the name */}
        <div className="shrink-0 cursor-grab touch-none px-5 pb-3 pt-2.5" onPointerDown={(event) => drag.start(event)}>
          <span className="mx-auto block h-1.5 w-11 rounded-full bg-ink-200" />
          <div className="mt-3 flex items-center gap-3">
            <Image src={BRAND.mark} alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold leading-tight text-ink-900">{BRAND.name}</p>
              <p className="truncate text-xs text-ink-500">{subtitle}</p>
            </div>
            <button type="button" aria-label={t('Close menu')} onClick={onClose} onPointerDown={(event) => event.stopPropagation()} className="grid h-9 w-9 place-items-center rounded-full bg-ink-100 text-ink-700 active:scale-90">
              <X size={19} />
            </button>
          </div>
        </div>

        {/* One even grid, four to a row, in menu order: no half-empty rows. */}
        <div className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1">
          <ul className="grid grid-cols-4 gap-y-4">
            {itemsFor(area, role, plan).map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onClose} aria-current={active ? 'page' : undefined} className="group flex flex-col items-center px-1">
                    <span className={cn(TILE, active ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-700')}>
                      <Icon size={24} strokeWidth={1.8} />
                    </span>
                    <span className={cn(label, active && 'text-brand-800')}>{t(item.short ?? item.label)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/" target="_blank" className="mx-1 mt-5 flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 text-sm font-semibold text-ink-700 active:bg-ink-50">
            {t('Open the website')}
            <ExternalLink size={17} className="text-ink-400" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

/** The bottom bar of the phone layout. */
function TabBar({ area, role, plan, onMore, moreOpen }: { area: Area; role: Role; plan: Plan; onMore: () => void; moreOpen: boolean }) {
  const pathname = usePathname();
  const t = useT();
  const all = itemsFor(area, role, plan);
  const tabs = TABS[area].map((href) => all.find((item) => item.href === href)).filter((item): item is NavItem => Boolean(item));
  const hasMore = all.length > tabs.length;
  const activeHref = tabs.find((item) => isActive(pathname, item))?.href;
  const moreActive = moreOpen || (hasMore && !activeHref);

  const cell = 'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[11px] font-semibold transition-transform active:scale-90';
  const pill = <motion.span layoutId="tab-pill" className="absolute inset-x-1 top-0 h-8 rounded-full bg-brand-100" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />;

  return (
    <nav
      aria-label={t('Main screens')}
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-xl items-stretch px-1">
        {tabs.map((item) => {
          const active = !moreActive && item.href === activeHref;
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <Link href={item.href} aria-current={active ? 'page' : undefined} className={cn(cell, active ? 'text-brand-800' : 'text-ink-500')}>
                <span className="relative grid h-8 w-16 place-items-center">
                  {active ? pill : null}
                  <Icon size={21} strokeWidth={active ? 2.4 : 2} className="relative" />
                </span>
                <span className="max-w-full truncate px-1">{t(item.short ?? item.label)}</span>
              </Link>
            </li>
          );
        })}
        {hasMore ? (
          <li className="flex min-w-0 flex-1">
            <button type="button" onClick={onMore} aria-expanded={moreOpen} className={cn(cell, moreActive ? 'text-brand-800' : 'text-ink-500')}>
              <span className="relative grid h-8 w-16 place-items-center">
                {moreActive ? pill : null}
                <Menu size={21} strokeWidth={moreActive ? 2.4 : 2} className="relative" />
              </span>
              <span>{t('More')}</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

type ShellProps = {
  area: Area;
  user: ShellUser;
  /** Under the logo: the name of this area. */
  subtitle: string;
  /** The plan this client bought: screens above it are left out of the menu. */
  plan?: Plan;
  children: ReactNode;
};

/** `lang` and `dict` come from the layout: the language the person chose and its words (none for English). */
export function DashShell({ lang, dict, ...props }: ShellProps & { lang: Lang; dict: UiDict | null }) {
  return (
    <UiLangProvider lang={lang} dict={dict}>
      <Frame {...props} />
    </UiLangProvider>
  );
}

function Frame({ area, user, subtitle, plan = 'platinum', children }: ShellProps) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { installed } = usePwa();

  // The screen's name for the phone top bar, and whether this is a screen inside it.
  const current = itemsFor(area, user.role, plan)
    .filter((item) => isActive(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const inner = Boolean(current) && pathname !== current.href;
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(current?.href ?? `/${area}`);
  };

  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [pathname]);

  // On a phone a table is drawn as cards (see globals.css). Each cell needs to
  // know its column's heading for that, so copy the headings onto the cells,
  // again whenever the screen's rows change.
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const label = () => {
      for (const table of root.querySelectorAll<HTMLTableElement>('table.table-cards')) {
        const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent?.trim() ?? '');
        for (const row of table.querySelectorAll('tbody tr, tfoot tr')) {
          const cells = row.querySelectorAll<HTMLTableCellElement>(':scope > td');
          if (cells.length !== heads.length) continue;
          cells.forEach((cell, index) => {
            if (cell.dataset.label !== heads[index]) cell.dataset.label = heads[index];
          });
        }
      }
    };
    label();
    const watcher = new MutationObserver(label);
    watcher.observe(root, { childList: true, subtree: true });
    return () => watcher.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!userOpen) return;
    const close = (event: MouseEvent) => {
      if (!userRef.current?.contains(event.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userOpen]);

  // While the menu is open the page behind must not scroll, and Escape shuts it.
  useEffect(() => {
    if (!menuOpen) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // "never": a sheet that only fades stops reading as an app; the owner asked
  // for the slide on every device, also where the system asks for less motion.
  return (
    <MotionConfig reducedMotion="never">
      <div className="dash-app app-ui min-h-dvh lg:pl-64">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <InstallBanner />
        <SendToWhatsApp open={sendOpen} onClose={() => setSendOpen(false)} role={user.role} />

        {/* sidebar, laptop */}
        <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-200 bg-white lg:flex">
          <Brand subtitle={subtitle} />
          <Menu_ area={area} role={user.role} plan={plan} />
          <SideFooter />
        </aside>

        {/* every screen as a grid of icons, phone: slides up, can be pulled down to shut */}
        <AnimatePresence>
          {menuOpen ? <MenuSheet area={area} role={user.role} plan={plan} subtitle={subtitle} onClose={() => setMenuOpen(false)} /> : null}
        </AnimatePresence>

        {/* top bar */}
        <header className="no-print sticky top-0 z-20 border-b border-ink-200 bg-white pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center gap-2.5 px-3 sm:px-6 lg:h-16">
            {inner ? (
              <button type="button" aria-label={t('Back')} onClick={goBack} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-700 transition active:scale-90 hover:bg-ink-100 lg:hidden">
                <ArrowLeft size={22} />
              </button>
            ) : (
              <Image src={BRAND.mark} alt="" width={34} height={34} className="ml-1 h-[34px] w-[34px] shrink-0 object-contain lg:hidden" />
            )}
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="truncate text-[16px] font-bold leading-tight text-ink-900">{pathname === `/${area}/notifications` ? t('Notifications') : inner ? t(current.label) : BRAND.name}</p>
              <p className="truncate text-[11px] font-medium leading-tight text-ink-500">{subtitle}</p>
            </div>
            <div className="hidden flex-1 lg:block" />

            <NotificationBell area={area} />
            <LangMenu />

            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((open) => !open)}
                aria-expanded={userOpen}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition active:scale-95 hover:bg-ink-100"
              >
                <Avatar name={user.name} size={36} />
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight text-ink-900">{user.name}</span>
                  <span className="block text-xs leading-tight text-ink-500">{t(ROLE_LABELS[user.role])}</span>
                </span>
                <ChevronDown size={16} className="text-ink-400" />
              </button>
              {userOpen ? (
                <div className="absolute right-0 top-full mt-2 w-60 origin-top-right animate-scale-in rounded-2xl border border-ink-200 bg-white p-1.5 shadow-lift">
                  <div className="border-b border-ink-100 px-3 pb-2.5 pt-2 sm:hidden">
                    <p className="text-sm font-semibold text-ink-900">{user.name}</p>
                    <p className="text-xs text-ink-500">{t(ROLE_LABELS[user.role])}</p>
                  </div>
                  <InstallApp className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50" />
                  {installed ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUserOpen(false);
                        router.refresh();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                    >
                      <RefreshCw size={17} /> {t('Refresh this screen')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      setSendOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-700 hover:bg-ink-50"
                  >
                    <MessageCircle size={17} /> {t('Send app link to WhatsApp')}
                  </button>
                  <Link href="/account/password" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
                    <KeyRound size={17} /> {t('Change password')}
                  </Link>
                  <form action={logout}>
                    <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-accent-700 hover:bg-accent-50">
                      <LogOut size={17} /> {t('Log out')}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
          <OfflineBar />
        </header>

        {/* Every dashboard screen takes its width from here: full width up to a very wide monitor. */}
        <main className="mx-auto w-full max-w-[1880px] px-4 pb-[calc(1.5rem+var(--dash-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <FilterHost>
            <div key={pathname} ref={pageRef} className="animate-page-in">
              {children}
            </div>
          </FilterHost>
        </main>

        <TabBar area={area} role={user.role} plan={plan} moreOpen={menuOpen} onMore={() => setMenuOpen((open) => !open)} />
      </div>
    </MotionConfig>
  );
}
