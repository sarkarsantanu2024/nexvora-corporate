/** Zod pieces reused across forms. */
import { z } from 'zod';

/** Accepts +91 / 0 prefixes and spaces; always yields the bare 10 digits. */
export const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ''))
  .pipe(z.string().regex(/^(\+?91|0)?[6-9]\d{9}$/, 'Enter a 10 digit mobile number'))
  .transform((v) => v.slice(-10));

export const optionalPhone = z.union([z.literal(''), phone]).default('');
export const optionalEmail = z.union([z.literal(''), z.string().trim().email('Enter a valid email')]).default('');
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');
/** '' or missing → null */
export const optionalDay = z
  .union([z.literal(''), day, z.null(), z.undefined()])
  .transform((v) => v || null);
export const period = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Pick a month');
export const rupees = z.coerce
  .number({ invalid_type_error: 'Enter an amount' })
  .int('Whole rupees only')
  .min(0, 'Cannot be negative')
  .max(1_00_00_000, 'That amount is too large');
export const text = (max = 200) => z.string().trim().max(max).default('');
export const requiredText = (label: string, max = 200) => z.string().trim().min(1, `${label} is required`).max(max);
export const uuid = z.string().uuid();
/** '' or missing → null */
export const optionalUuid = z
  .union([z.literal(''), z.string().uuid(), z.null(), z.undefined()])
  .transform((v) => v || null);

/** lower-case letters, digits, dot, dash, underscore */
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'At least 3 characters')
  .max(40)
  .regex(/^[a-z0-9._-]+$/, 'Use letters, numbers, dot, dash or underscore');

export const password = z.string().min(6, 'At least 6 characters').max(100);

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
