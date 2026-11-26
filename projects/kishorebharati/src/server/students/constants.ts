/**
 * Words and fixed lists of the students, staff, certificates and schemes
 * screens. Free of any database import so client components can use them.
 * Every label is English; the screens pass it through t().
 */
import type { BenefitStatus, Category, CertificateKind, Gender, StaffKind, StudentStatus, YearResult } from '@/db/schema';

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: 'On roll',
  left: 'Left',
  passed_out: 'Passed out',
};

export const GENDER_LABELS: Record<Gender, string> = { male: 'Boy', female: 'Girl', other: 'Other' };

export const CATEGORY_LABELS: Record<Category, string> = { GEN: 'General', SC: 'SC', ST: 'ST', 'OBC-A': 'OBC-A', 'OBC-B': 'OBC-B' };

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

/** Offered as suggestions in the admission form; anything else may be typed. */
export const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'];

export const RESULT_LABELS: Record<Exclude<YearResult, ''>, string> = {
  promoted: 'Promoted',
  detained: 'Detained',
  passed: 'Passed',
  left: 'Left',
};

export const STAFF_KIND_LABELS: Record<StaffKind, string> = { teaching: 'Teaching', non_teaching: 'Non-teaching' };

export const CERTIFICATE_LABELS: Record<CertificateKind, string> = {
  tc: 'Transfer certificate',
  character: 'Character certificate',
  bonafide: 'Bonafide certificate',
};

/** Short code printed in the serial number: TC/2026/7. */
export const CERTIFICATE_CODES: Record<CertificateKind, string> = { tc: 'TC', character: 'CC', bonafide: 'BC' };

export const BENEFIT_STATUS_LABELS: Record<BenefitStatus, string> = {
  applied: 'Applied',
  sanctioned: 'Sanctioned',
  received: 'Received',
  rejected: 'Rejected',
};

/**
 * Schemes West Bengal schools handle for their students. Suggestions in the
 * form only: the office may type any other name, and no class rule is enforced.
 */
export const SCHEME_SUGGESTIONS = [
  'Sabooj Sathi',
  'Taruner Swapna',
  'Aikyashree',
  'Oasis',
  'Swami Vivekananda Merit-cum-Means',
  'National Means-cum-Merit',
  'Shikshashree',
];

export const CONDUCT_OPTIONS = ['Good', 'Very good', 'Satisfactory'];

/** {n} is the running number, {year} the school year: '{n}/{year}' gives 215/2026. */
export const DEFAULT_ADMISSION_FORMAT = '{n}/{year}';

export const formatAdmissionNo = (format: string, n: number, year: string) =>
  (format.trim() || DEFAULT_ADMISSION_FORMAT).replaceAll('{n}', String(n)).replaceAll('{year}', year);
