/**
 * Sample records of each business module, run in this order after the sample
 * students exist (see seedSchoolSample in ../seed-school.ts). Each module owns
 * its own file here; mark what it makes as sample wherever the table has a
 * `meta` column, and keep it small so the first start stays quick.
 */
import type { DB } from '../index';
import { seedDailySample } from './daily';
import { seedExamsSample } from './exams';
import { seedMoneySample } from './money';
import { seedLibrarySample } from './library';
import { seedOfficeSample } from './office';

export type SampleContext = {
  yearId: string;
  officeUserId: string;
  teacherUserId: string;
  /** The staff row of the sample teacher login. */
  teacherStaffId: string | null;
};

export type SampleSeeder = (db: DB, context: SampleContext) => Promise<void>;

export const SAMPLE_SEEDERS: SampleSeeder[] = [seedDailySample, seedExamsSample, seedMoneySample, seedLibrarySample, seedOfficeSample];
