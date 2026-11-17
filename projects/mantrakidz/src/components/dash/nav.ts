/**
 * The menu of each dashboard, in one place. The sidebar is drawn from this;
 * a screen that is not listed here cannot be reached from the menu.
 */
import {
  Baby,
  BadgeIndianRupee,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  Globe,
  Handshake,
  History,
  House,
  Images,
  Megaphone,
  MessageSquareText,
  ReceiptIndianRupee,
  School,
  Settings,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/db/schema';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown only to these roles; everyone in the area when omitted. */
  roles?: Role[];
  /** Match only the exact path (for the area's home). */
  exact?: boolean;
  /** A shorter name for the bottom bar on a phone, where there is room for one word. */
  short?: string;
};
export type NavGroup = { title?: string; items: NavItem[] };
export type Area = 'hq' | 'centre' | 'parent';

const HQ_ADMIN: Role[] = ['hq_admin'];
const MANAGERS: Role[] = ['hq_admin', 'centre_admin'];

export const NAV: Record<Area, NavGroup[]> = {
  hq: [
    { items: [{ href: '/hq', label: 'Overview', icon: House, exact: true, short: 'Home' }] },
    {
      title: 'Franchise',
      items: [
        { href: '/hq/leads', label: 'Franchise leads', icon: Handshake, short: 'Leads' },
        { href: '/hq/centres', label: 'Schools', icon: Building2 },
        { href: '/hq/royalty', label: 'Royalty', icon: BadgeIndianRupee },
        { href: '/hq/announcements', label: 'Circulars', icon: Megaphone },
      ],
    },
    {
      title: 'School',
      items: [
        { href: '/hq/enquiries', label: 'Enquiries', icon: MessageSquareText },
        { href: '/hq/programmes', label: 'Programmes', icon: BookOpen },
        { href: '/hq/reports', label: 'Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Website',
      items: [
        { href: '/hq/website', label: 'Edit website', icon: Globe },
        { href: '/hq/website/gallery', label: 'Gallery', icon: Images },
        { href: '/hq/website/notices', label: 'Notices and events', icon: CalendarDays },
      ],
    },
    {
      title: 'Admin',
      items: [
        { href: '/hq/users', label: 'Team and logins', icon: UserCog, roles: HQ_ADMIN },
        { href: '/hq/audit', label: 'Activity log', icon: History, roles: HQ_ADMIN },
        { href: '/hq/settings', label: 'Settings', icon: Settings, roles: HQ_ADMIN },
      ],
    },
  ],
  centre: [
    { items: [{ href: '/centre', label: 'Overview', icon: House, exact: true, short: 'Home' }] },
    {
      title: 'Children',
      items: [
        { href: '/centre/enquiries', label: 'Admission enquiries', icon: UserPlus },
        { href: '/centre/students', label: 'Children', icon: Baby },
        { href: '/centre/batches', label: 'Classes', icon: School },
        { href: '/centre/attendance', label: 'Attendance', icon: CalendarCheck },
      ],
    },
    {
      title: 'Money',
      items: [
        { href: '/centre/fees', label: 'Fees', icon: ReceiptIndianRupee },
        { href: '/centre/expenses', label: 'Expenses', icon: Wallet, roles: MANAGERS },
        { href: '/centre/royalty', label: 'Royalty to HQ', icon: BadgeIndianRupee, roles: MANAGERS },
        { href: '/centre/reports', label: 'Reports', icon: BarChart3, roles: MANAGERS },
      ],
    },
    {
      title: 'School',
      items: [
        { href: '/centre/staff', label: 'Staff', icon: UsersRound, roles: MANAGERS },
        { href: '/centre/notices', label: 'Notices', icon: Bell },
        { href: '/centre/settings', label: 'Settings', icon: Settings, roles: MANAGERS },
      ],
    },
  ],
  parent: [
    {
      items: [
        { href: '/parent', label: 'Home', icon: House, exact: true },
        { href: '/parent/fees', label: 'Fees', icon: ReceiptIndianRupee },
        { href: '/parent/attendance', label: 'Attendance', icon: CalendarCheck },
        { href: '/parent/notices', label: 'Notices', icon: Bell },
      ],
    },
  ],
};

/**
 * The bottom bar on a phone: the screens a person opens most, in order, at
 * most four. Everything else is behind "More", which opens the full menu.
 * A screen the person's role cannot open is left out by itself.
 */
export const TABS: Record<Area, string[]> = {
  hq: ['/hq', '/hq/leads', '/hq/centres', '/hq/royalty'],
  centre: ['/centre', '/centre/students', '/centre/attendance', '/centre/fees'],
  parent: ['/parent', '/parent/fees', '/parent/attendance', '/parent/notices'],
};

export const ROLE_LABELS: Record<Role, string> = {
  hq_admin: 'Head office admin',
  hq_staff: 'Head office staff',
  centre_admin: 'School head',
  centre_staff: 'School staff',
  parent: 'Parent',
};

// Re-exported so screens can use the same icons as the menu.
export { Users };
