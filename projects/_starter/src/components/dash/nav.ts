/**
 * The menu of each dashboard, in one place. The sidebar on a laptop, and the
 * bottom bar and the icon grid on a phone, are all drawn from this; a screen
 * that is not listed here cannot be reached from the menu.
 *
 * A business module adds its screens as a new group under `admin` (or as a
 * new area of its own): see docs/CONVENTIONS.md, "Adding a business module".
 *
 * Icons: pick one that shows what the screen is about (a house for home, a
 * speech bubble for enquiries). The same icon is the tile in the phone menu,
 * so it must be clear without its label.
 *
 * Labels are written in English here. The frame passes them through t(), so
 * add each new label, title and short name to src/i18n/ui-hi.ts and ui-bn.ts.
 */
import { CalendarDays, Globe, History, House, Images, MessageSquareText, Send, Settings, Trash2, UserCog, type LucideIcon } from 'lucide-react';
import type { Role } from '@/db/schema';
import { planAllows, type Plan } from '@/lib/plans';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown only to these roles; everyone in the area when omitted. */
  roles?: Role[];
  /** The lowest plan that opens this screen (see src/server/platform.ts); every plan when omitted. */
  plan?: Plan;
  /** Match only the exact path (for the area's home). */
  exact?: boolean;
  /** A shorter name for the bottom bar and the icon grid on a phone, where there is room for one word. */
  short?: string;
};
export type NavGroup = { title?: string; items: NavItem[] };
export type Area = 'admin';

const ADMIN: Role[] = ['admin'];

export const NAV: Record<Area, NavGroup[]> = {
  admin: [
    {
      items: [
        { href: '/admin', label: 'Overview', icon: House, exact: true, short: 'Home' },
        { href: '/admin/enquiries', label: 'Enquiries', icon: MessageSquareText },
        { href: '/admin/reminders', label: 'Reminders', icon: Send, plan: 'panel' },
      ],
    },
    {
      title: 'Website',
      items: [
        { href: '/admin/website', label: 'Edit website', icon: Globe, short: 'Website', plan: 'panel' },
        { href: '/admin/website/gallery', label: 'Gallery', icon: Images, plan: 'panel' },
        { href: '/admin/website/notices', label: 'Notices and events', icon: CalendarDays, short: 'Notices', plan: 'panel' },
      ],
    },
    {
      title: 'Admin',
      items: [
        { href: '/admin/users', label: 'Team and logins', icon: UserCog, roles: ADMIN, short: 'Team' },
        { href: '/admin/audit', label: 'Activity log', icon: History, roles: ADMIN, short: 'Activity' },
        { href: '/admin/trash', label: 'Trash', icon: Trash2, roles: ADMIN },
        { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ADMIN },
      ],
    },
  ],
};

/** May this person, on this plan, open this menu entry? */
export const canOpen = (item: NavItem, role: Role, plan: Plan) => (!item.roles || item.roles.includes(role)) && (!item.plan || planAllows(plan, item.plan));

/**
 * The bottom bar on a phone: the screens a person opens most, in order, at
 * most four. Everything else is behind "More", which slides up every screen
 * as a grid of icons. A screen the person's role cannot open is left out by
 * itself.
 */
export const TABS: Record<Area, string[]> = {
  admin: ['/admin', '/admin/enquiries', '/admin/website', '/admin/website/gallery'],
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  staff: 'Staff',
};
