'use client';

/**
 * The frame around every dashboard screen: sidebar on a laptop, slide-over
 * menu on a phone, and a top bar with the person's name and log out.
 */
import { ArrowLeftRight, ChevronDown, ExternalLink, KeyRound, LogOut, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Role } from '@/db/schema';
import { cn } from '@/lib/cn';
import { leaveCentre, logout } from '@/server/session-actions';
import { Avatar } from '../ui/core';
import { NAV, ROLE_LABELS, type Area, type NavItem } from './nav';

export type ShellUser = { name: string; username: string; role: Role };

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  // '/hq/website' must not light up for '/hq/website/gallery', which has its own entry.
  if (item.href === '/hq/website') return pathname === item.href || (pathname.startsWith('/hq/website/') && !/^\/hq\/website\/(gallery|notices)/.test(pathname));
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function Menu_({ area, role, onNavigate }: { area: Area; role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV[area].map((group, index) => {
        const items = group.items.filter((item) => !item.roles || item.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={group.title ?? index}>
            {group.title ? <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-300/80">{group.title}</p> : null}
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
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition',
                        active ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-100 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <Icon size={19} className={cn('shrink-0', active ? 'text-brand-700' : 'text-brand-300 group-hover:text-white')} />
                      {item.label}
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
    <div className="flex items-center gap-3 px-5 pb-2 pt-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white p-1 shadow-sm">
        <Image src="/brand/mark.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-tight text-white">Mantra Kidz</p>
        <p className="truncate text-xs font-medium text-brand-200">{subtitle}</p>
      </div>
    </div>
  );
}

export function DashShell({
  area,
  user,
  subtitle,
  actingCentre,
  children,
}: {
  area: Area;
  user: ShellUser;
  /** Under the logo: "Head office" or the centre's name. */
  subtitle: string;
  /** Set when a head-office user has stepped into a centre. */
  actingCentre?: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!userOpen) return;
    const close = (event: MouseEvent) => {
      if (!userRef.current?.contains(event.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userOpen]);

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* sidebar, laptop */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-brand-800 to-brand-950 lg:flex">
        <Brand subtitle={subtitle} />
        <Menu_ area={area} role={user.role} />
        <Link href="/" target="_blank" className="mx-3 mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white">
          <ExternalLink size={16} /> Open the website
        </Link>
      </aside>

      {/* slide-over menu, phone */}
      {menuOpen ? (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-900/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-xs animate-[slide-in-left_.25s_ease] flex-col bg-gradient-to-b from-brand-800 to-brand-950 shadow-lift">
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full text-brand-100 hover:bg-white/10">
              <X size={20} />
            </button>
            <Brand subtitle={subtitle} />
            <Menu_ area={area} role={user.role} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* top bar */}
      <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200/70 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="-ml-1 grid h-10 w-10 place-items-center rounded-xl text-ink-700 hover:bg-ink-100 lg:hidden">
          <Menu size={22} />
        </button>
        <p className="min-w-0 flex-1 truncate font-display text-lg font-bold text-ink-900 lg:hidden">{subtitle}</p>
        <div className="hidden flex-1 lg:block" />

        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserOpen((open) => !open)}
            aria-expanded={userOpen}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-ink-100"
          >
            <Avatar name={user.name} size={36} />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-ink-900">{user.name}</span>
              <span className="block text-xs leading-tight text-ink-500">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown size={16} className="text-ink-400" />
          </button>
          {userOpen ? (
            <div className="absolute right-0 top-full mt-2 w-60 animate-scale-in rounded-2xl border border-ink-200 bg-white p-1.5 shadow-lift">
              <div className="border-b border-ink-100 px-3 pb-2.5 pt-2 sm:hidden">
                <p className="text-sm font-semibold text-ink-900">{user.name}</p>
                <p className="text-xs text-ink-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <Link href="/account/password" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
                <KeyRound size={17} /> Change password
              </Link>
              <form action={logout}>
                <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-accent-700 hover:bg-accent-50">
                  <LogOut size={17} /> Log out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>

      {actingCentre ? (
        <div className="no-print flex flex-wrap items-center justify-between gap-2 bg-sun-100 px-4 py-2 text-sm font-medium text-sun-700 sm:px-6">
          <span>
            You are working inside <strong>{actingCentre}</strong> as head office.
          </span>
          <form action={leaveCentre}>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1 font-semibold hover:bg-white">
              <ArrowLeftRight size={15} /> Back to head office
            </button>
          </form>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
