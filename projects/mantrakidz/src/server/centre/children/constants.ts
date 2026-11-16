/**
 * Value lists and labels for the children side of the centre dashboard.
 * No database imports here, so client components can use them too.
 */
import type { AttendanceStatus, EnquiryStage } from '@/db/schema';

export const ENQUIRY_SOURCES = ['walk-in', 'phone', 'website', 'referral', 'facebook', 'other'] as const;

export const SOURCE_LABELS: Record<string, string> = {
  'walk-in': 'Walk-in',
  phone: 'Phone call',
  website: 'Website',
  referral: 'Referral',
  facebook: 'Facebook',
  other: 'Other',
};
export const sourceLabel = (source: string) => SOURCE_LABELS[source] ?? source;

export const STAGE_LABELS: Record<EnquiryStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  visit_scheduled: 'Visit scheduled',
  visited: 'Visited',
  admitted: 'Admitted',
  lost: 'Lost',
};

export const GENDERS = ['Girl', 'Boy'] as const;
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export const TSHIRT_SIZES = ['18', '20', '22', '24', '26', '28', '30'] as const;
export const STAFF_ROLES = ['Centre Head', 'Teacher', 'Assistant Teacher', 'Helper (Didi)', 'Front Desk', 'Other'] as const;

/** One letter per status, for the monthly register. */
export const ATTENDANCE_LETTER: Record<AttendanceStatus, string> = { present: 'P', absent: 'A', leave: 'L', holiday: 'H' };

/** The three marks a teacher can give a child or a staff member for a day. */
export const MARKS = ['present', 'absent', 'leave'] as const;
export type Mark = (typeof MARKS)[number];

/** Age in whole months on a given day; null when there is no date of birth. */
export function ageInMonths(dob: string | null | undefined, on: string): number | null {
  if (!dob) return null;
  const [y1, m1, d1] = dob.split('-').map(Number);
  const [y2, m2, d2] = on.split('-').map(Number);
  return Math.max(0, (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0));
}
