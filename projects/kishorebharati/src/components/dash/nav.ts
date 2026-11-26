/**
 * The menu of each dashboard, in one place. The sidebar on a laptop, and the
 * bottom bar and the icon grid on a phone, are all drawn from this; a screen
 * that is not listed here cannot be reached from the menu.
 *
 * Kishore Bharati: the office (admin, staff) and the teachers share the
 * /admin dashboard. A teacher sees only the screens marked for teachers, and
 * inside them only their own sections (checked again in each service).
 * Parents have their own area, /parent.
 *
 * Labels are written in English here. The frame passes them through t(), so
 * add each new label, title and short name to src/i18n/ui-bn.ts (and ui-hi.ts).
 */
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  Gift,
  Globe,
  GraduationCap,
  History,
  House,
  Images,
  IndianRupee,
  Library,
  MessageSquareText,
  NotebookPen,
  PartyPopper,
  School,
  Send,
  Settings,
  Sun,
  Trash2,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Boxes, CalendarOff, ClipboardList, DoorOpen, FileDown, Handshake, Megaphone, UtensilsCrossed } from 'lucide-react';
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
export type Area = 'admin' | 'parent';

const ADMIN: Role[] = ['admin'];
/** The school office. */
const OFFICE: Role[] = ['admin', 'staff'];
/** Office and teachers. */
const SCHOOL: Role[] = ['admin', 'staff', 'teacher'];
const TEACHER: Role[] = ['teacher'];

export const NAV: Record<Area, NavGroup[]> = {
  admin: [
    {
      items: [
        { href: '/admin', label: 'Overview', icon: House, exact: true, short: 'Home', roles: OFFICE },
        { href: '/admin/today', label: 'My day', icon: Sun, roles: TEACHER, short: 'Today' },
        { href: '/admin/enquiries', label: 'Admission enquiries', icon: MessageSquareText, roles: OFFICE, short: 'Enquiries' },
        { href: '/admin/reminders', label: 'Reminders', icon: Send, plan: 'panel', roles: OFFICE },
      ],
    },
    {
      title: 'Students',
      items: [
        { href: '/admin/students', label: 'Students', icon: GraduationCap, roles: SCHOOL, plan: 'platinum' },
        { href: '/admin/classes', label: 'Classes and subjects', icon: School, roles: OFFICE, short: 'Classes', plan: 'platinum' },
        { href: '/admin/certificates', label: 'Certificates', icon: Award, roles: OFFICE, plan: 'platinum' },
        { href: '/admin/schemes', label: 'Government schemes', icon: Gift, roles: OFFICE, short: 'Schemes', plan: 'platinum' },
      ],
    },
    {
      title: 'Every day',
      items: [
        { href: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck, roles: SCHOOL, plan: 'platinum' },
        { href: '/admin/diary', label: 'Class diary', icon: NotebookPen, roles: SCHOOL, short: 'Diary', plan: 'platinum' },
        { href: '/admin/timetable', label: 'Timetable', icon: CalendarClock, roles: SCHOOL, plan: 'platinum' },
        { href: '/admin/exams', label: 'Exams and results', icon: FileCheck2, roles: SCHOOL, short: 'Exams', plan: 'platinum' },
      ],
    },
    {
      title: 'Staff',
      items: [{ href: '/admin/staff', label: 'Teachers and staff', icon: Users, roles: OFFICE, short: 'Staff', plan: 'platinum' }],
    },
    {
      title: 'Money',
      items: [
        { href: '/admin/fees', label: 'Fees', icon: IndianRupee, roles: OFFICE, plan: 'platinum' },
        { href: '/admin/expenses', label: 'Expenses', icon: Wallet, roles: OFFICE, plan: 'platinum' },
        { href: '/admin/reports', label: 'Reports', icon: BarChart3, roles: ADMIN, plan: 'platinum' },
      ],
    },
    {
      title: 'School life',
      items: [
        { href: '/admin/library', label: 'Library', icon: Library, roles: OFFICE, plan: 'platinum' },
        { href: '/admin/events', label: 'Events and calendar', icon: PartyPopper, roles: SCHOOL, short: 'Events', plan: 'platinum' },
      ],
    },
    {
      title: 'Office registers',
      items: [
        { href: '/admin/mdm', label: 'Mid-day meal', icon: UtensilsCrossed, roles: OFFICE, short: 'Meal', plan: 'platinum' },
        { href: '/admin/leave', label: 'Staff leave', icon: CalendarOff, roles: SCHOOL, short: 'Leave', plan: 'platinum' },
        { href: '/admin/visitors', label: 'Visitors', icon: DoorOpen, roles: OFFICE, short: 'Gate', plan: 'platinum' },
        { href: '/admin/records', label: 'Student records', icon: ClipboardList, roles: SCHOOL, short: 'Records', plan: 'platinum' },
        { href: '/admin/stock', label: 'Stock register', icon: Boxes, roles: OFFICE, short: 'Stock', plan: 'platinum' },
        { href: '/admin/meetings', label: 'Meetings', icon: Handshake, roles: OFFICE, plan: 'platinum' },
        { href: '/admin/circulars', label: 'Staff circulars', icon: Megaphone, roles: SCHOOL, short: 'Circulars', plan: 'platinum' },
        { href: '/admin/exports', label: 'Exports', icon: FileDown, roles: OFFICE, plan: 'platinum' },
      ],
    },
    {
      title: 'Website',
      items: [
        { href: '/admin/website', label: 'Edit website', icon: Globe, short: 'Website', plan: 'panel', roles: OFFICE },
        { href: '/admin/website/gallery', label: 'Gallery', icon: Images, plan: 'panel', roles: OFFICE },
        { href: '/admin/website/notices', label: 'Notices', icon: CalendarDays, plan: 'panel', roles: OFFICE },
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
  parent: [
    {
      items: [
        { href: '/parent', label: 'My children', icon: House, exact: true, short: 'Home' },
        { href: '/parent/attendance', label: 'Attendance', icon: ClipboardCheck },
        { href: '/parent/diary', label: 'Class diary', icon: NotebookPen, short: 'Diary' },
        { href: '/parent/results', label: 'Results', icon: FileCheck2 },
        { href: '/parent/fees', label: 'Fees', icon: IndianRupee },
        { href: '/parent/notices', label: 'Notices', icon: CalendarDays },
        { href: '/parent/timetable', label: 'Timetable', icon: CalendarClock },
        { href: '/parent/library', label: 'Library books', icon: BookOpen, short: 'Library' },
      ],
    },
  ],
};

/** May this person, on this plan, open this menu entry? */
export const canOpen = (item: NavItem, role: Role, plan: Plan) => (!item.roles || item.roles.includes(role)) && (!item.plan || planAllows(plan, item.plan));

/**
 * The bottom bar on a phone: the screens a person opens most, in order. Each
 * person gets the first four of these that their role may open; everything
 * else is behind "More", which slides up every screen as a grid of icons.
 */
export const TABS: Record<Area, string[]> = {
  // Office: Home, Students, Attendance, Fees. Teacher: Today, Students, Attendance, Diary.
  admin: ['/admin', '/admin/today', '/admin/students', '/admin/attendance', '/admin/fees', '/admin/diary'],
  parent: ['/parent', '/parent/attendance', '/parent/results', '/parent/fees'],
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Head of school',
  staff: 'Office',
  teacher: 'Teacher',
  parent: 'Parent',
};
