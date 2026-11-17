'use client';

/**
 * The bell in the top bar and the list on the notifications screen.
 *
 * The list itself comes from the server (src/server/notifications.ts). What
 * this file adds is "new or already seen": the ids a person has looked at are
 * kept on their own device, the bell counts the ones that are not in that
 * list, and opening the notifications screen marks them all as seen.
 */
import { Bell, BellOff, ChevronRight, ClipboardCheck, Globe, IndianRupee, Megaphone, MessageSquareText, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { Notification, NotificationKind } from '@/server/notifications';
import { useT } from '../ui/lang';
import type { Area } from './nav';

const SEEN_KEY = 'app_notifications_seen';
/** Other parts of the screen (the bell) hear about a change through this. */
const SEEN_EVENT = 'app-notifications-seen';

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}
function writeSeen(ids: string[]) {
  try {
    // Only what is still in the list is worth remembering.
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(SEEN_EVENT));
  } catch {}
}

/** The bell: a count of what is new, and a tap away from the full list. */
export function NotificationBell({ area }: { area: Area }) {
  const t = useT();
  const pathname = usePathname();
  const [ids, setIds] = useState<string[]>([]);
  const [fresh, setFresh] = useState(0);
  const href = `/${area}/notifications`;

  // Ask again on every screen change and every five minutes, so the count is never stale for long.
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/notifications?area=${area}`, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: { ok: boolean; data: Notification[] } | null) => {
          if (alive && body?.ok) setIds(body.data.map((item) => item.id));
        })
        .catch(() => {});
    load();
    const timer = window.setInterval(load, 5 * 60000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [area, pathname]);

  useEffect(() => {
    const count = () => {
      const seen = readSeen();
      setFresh(ids.filter((id) => !seen.has(id)).length);
    };
    count();
    window.addEventListener(SEEN_EVENT, count);
    return () => window.removeEventListener(SEEN_EVENT, count);
  }, [ids]);

  const active = pathname === href;
  return (
    <Link
      href={href}
      aria-label={fresh ? `${t('Notifications')}: ${fresh}` : t('Notifications')}
      aria-current={active ? 'page' : undefined}
      className={cn('relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition active:scale-90', active ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50')}
    >
      <Bell size={18} />
      {fresh ? (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white">{fresh > 9 ? '9+' : fresh}</span>
      ) : null}
    </Link>
  );
}

/** One icon for each kind of notification. A new kind in src/server/notifications.ts needs its icon here. */
const ICONS: Record<NotificationKind, LucideIcon> = {
  enquiry: MessageSquareText,
  website: Globe,
  notice: Megaphone,
  money: IndianRupee,
  task: ClipboardCheck,
};
const TONES = {
  red: { chip: 'bg-accent-50 text-accent-700', group: 'Needs you today' },
  amber: { chip: 'bg-sun-50 text-sun-700', group: 'To do soon' },
  blue: { chip: 'bg-sky-50 text-sky-700', group: 'For your information' },
} as const;

/** The notifications screen: grouped by how urgent, new ones marked with a dot. */
export function NotificationList({ items }: { items: Notification[] }) {
  const t = useT();
  // What was new when the screen opened keeps its dot until the person leaves:
  // dots are only ever added here, also when the list is loaded again.
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    const seen = readSeen();
    const unseen = items.filter((item) => !seen.has(item.id)).map((item) => item.id);
    if (unseen.length) setFresh((current) => new Set([...current, ...unseen]));
    writeSeen(items.map((item) => item.id));
  }, [items]);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-ink-200 bg-white px-6 py-16 text-center shadow-card">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-500">
          <BellOff size={26} />
        </span>
        <p className="text-base font-bold text-ink-900">{t('Nothing needs you right now')}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-500">{t('New enquiries, website changes waiting to be published and new notices show here as they come up.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(['red', 'amber', 'blue'] as const).map((tone) => {
        const group = items.filter((item) => item.tone === tone);
        if (!group.length) return null;
        return (
          <section key={tone}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {t(TONES[tone].group)} <span className="text-ink-400">({group.length})</span>
            </h2>
            <ul className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
              {group.map((item) => {
                const Icon = ICONS[item.kind];
                return (
                  <li key={item.id} className="border-b border-ink-100 last:border-b-0">
                    <Link href={item.href} className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-ink-50 hover:bg-ink-50/70">
                      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', TONES[tone].chip)}>
                        <Icon size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-semibold text-ink-900">{item.title}</span>
                          {fresh.has(item.id) ? <span aria-label={t('New')} className="h-2 w-2 shrink-0 rounded-full bg-accent-500" /> : null}
                        </span>
                        {item.text ? <span className="mt-0.5 block text-sm text-ink-500">{item.text}</span> : null}
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-ink-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
