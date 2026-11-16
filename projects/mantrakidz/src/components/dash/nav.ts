/**
 * The menu of each dashboard, in one place. The sidebar is drawn from this;
 * a screen that is not listed here cannot be reached from the menu.
 */
import {
  BadgeIndianRupee,
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Handshake,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  PanelsTopLeft,
  Receipt,
  Settings,
  Shapes,
  UserCog,
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
};
export type NavGroup = { title?: string; items: NavItem[] };
export type Area = 'hq' | 'centre' | 'parent';

const HQ_ADMIN: Role[] = ['hq_admin'];
const MANAGERS: Role[] = ['hq_admin', 'centre_admin'];

export const NAV: Record<Area, NavGroup[]> = {
  hq: [
    { items: [{ href: '/hq', label: 'Overview', icon: LayoutDashboard, exact: true }] },
    {
      title: 'Franchise',
      items: [
        { href: '/hq/leads', label: 'Franchise leads', icon: Handshake },
        { href: '/hq/centres', label: 'Centres', icon: Building2 },
        { href: '/hq/royalty', label: 'Royalty', icon: BadgeIndianRupee },
        { href: '/hq/announcements', label: 'Circulars', icon: Megaphone },
      ],
    },
    {
      title: 'School',
      items: [
        { href: '/hq/enquiries', label: 'Enquiries', icon: MessageSquareText },
        { href: '/hq/programmes', label: 'Programmes', icon: Shapes },
        { href: '/hq/reports', label: 'Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Website',
      items: [
        { href: '/hq/website', label: 'Edit website', icon: PanelsTopLeft },
        { href: '/hq/website/gallery', label: 'Gallery', icon: ImageIcon },
        { href: '/hq/website/notices', label: 'Notices and events', icon: Megaphone },
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
    { items: [{ href: '/centre', label: 'Overview', icon: LayoutDashboard, exact: true }] },
    {
      title: 'Children',
      items: [
        { href: '/centre/enquiries', label: 'Admission enquiries', icon: MessageSquareText },
        { href: '/centre/students', label: 'Children', icon: GraduationCap },
        { href: '/centre/batches', label: 'Classes', icon: Shapes },
        { href: '/centre/attendance', label: 'Attendance', icon: CalendarCheck },
      ],
    },
    {
      title: 'Money',
      items: [
        { href: '/centre/fees', label: 'Fees', icon: Receipt },
        { href: '/centre/expenses', label: 'Expenses', icon: Wallet, roles: MANAGERS },
        { href: '/centre/royalty', label: 'Royalty to HQ', icon: BadgeIndianRupee, roles: MANAGERS },
        { href: '/centre/reports', label: 'Reports', icon: BarChart3, roles: MANAGERS },
      ],
    },
    {
      title: 'Centre',
      items: [
        { href: '/centre/staff', label: 'Staff', icon: UsersRound, roles: MANAGERS },
        { href: '/centre/notices', label: 'Notices', icon: Megaphone },
        { href: '/centre/settings', label: 'Settings', icon: Settings, roles: MANAGERS },
      ],
    },
  ],
  parent: [
    {
      items: [
        { href: '/parent', label: 'Home', icon: LayoutDashboard, exact: true },
        { href: '/parent/fees', label: 'Fees', icon: Receipt },
        { href: '/parent/attendance', label: 'Attendance', icon: CalendarCheck },
        { href: '/parent/notices', label: 'Notices', icon: ClipboardList },
      ],
    },
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  hq_admin: 'Head office admin',
  hq_staff: 'Head office staff',
  centre_admin: 'Centre head',
  centre_staff: 'Centre staff',
  parent: 'Parent',
};

// Re-exported so screens can use the same icons as the menu.
export { Users };
