/**
 * Dashboard words of the school's own modules, one file per module, merged
 * over the starter's dictionary (../ui-bn.ts) by ../ui.ts.
 */
import { BN as DAILY } from './daily';
import { BN as EXAMS } from './exams';
import { BN as MONEY } from './money';
import { BN as OFFICE } from './office';
import { BN as PARENT } from './parent';
import { BN as SITE } from './site';
import { BN as STUDENTS } from './students';

export const MODULES_BN: Record<string, string> = { ...SITE, ...STUDENTS, ...DAILY, ...EXAMS, ...MONEY, ...PARENT, ...OFFICE };
