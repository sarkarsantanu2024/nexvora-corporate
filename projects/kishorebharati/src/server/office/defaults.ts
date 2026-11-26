/**
 * What the office registers start with before anyone changes them (the
 * 'office' group of settings). Kept free of database imports so
 * src/server/admin/shared.ts and client components can both use it.
 */

/** A kind of leave and how many days of it a person gets in a calendar year. 0 = no fixed limit. */
export type LeaveType = { key: string; name: string; quota: number };

/** Something the mid-day meal kitchen keeps in stock, and the unit it is counted in. */
export type MdmStockItem = { name: string; unit: string };

export type OfficeSettings = {
  /** Classes that get the mid-day meal (PM POSHAN covers up to Class 8). */
  mdmGrades: number[];
  /** The menu of each weekday, '1' Monday to '6' Saturday. */
  menu: Record<string, string>;
  stockItems: MdmStockItem[];
  leaveTypes: LeaveType[];
};

/**
 * The leave types and quotas are a start: casual leave is 14 days a year for
 * West Bengal school staff; the others are left without a fixed limit until
 * the school says what it follows.
 */
export const OFFICE_DEFAULTS: OfficeSettings = {
  mdmGrades: [5, 6, 7, 8],
  menu: {
    '1': 'ভাত, ডাল, সবজি',
    '2': 'ভাত, সয়াবিন-আলুর তরকারি',
    '3': 'ভাত, ডিমের ঝোল',
    '4': 'ভাত, ডাল, সবজি',
    '5': 'ভাত, ডিমের ঝোল',
    '6': 'খিচুড়ি',
  },
  stockItems: [
    { name: 'চাল', unit: 'kg' },
    { name: 'ডাল', unit: 'kg' },
    { name: 'সয়াবিন', unit: 'kg' },
    { name: 'তেল', unit: 'litre' },
    { name: 'ডিম', unit: 'pcs' },
  ],
  leaveTypes: [
    { key: 'CL', name: 'Casual leave', quota: 14 },
    { key: 'ML', name: 'Medical leave', quota: 0 },
    { key: 'EL', name: 'Earned leave', quota: 0 },
    { key: 'SL', name: 'Special leave', quota: 0 },
    { key: 'DL', name: 'Duty leave', quota: 0 },
  ],
};
