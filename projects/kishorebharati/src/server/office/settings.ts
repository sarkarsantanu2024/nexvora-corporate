/** The head of school's settings of the office registers: mid-day meal classes, menu and stock items; leave types and quotas. */
import { z } from 'zod';
import { SCHOOL } from '@/config/school';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { text } from '@/lib/validators';
import { assertAdmin, putSetting } from '../admin/shared';
import { UNITS } from './labels';
import { officeSettings } from './shared';

export const mdmSettingsInput = z.object({
  mdmGrades: z.array(z.coerce.number().int()).max(20),
  menu: z.record(z.string(), text(200)),
  stockItems: z
    .array(z.object({ name: z.string().trim().min(1, 'Name is required').max(40), unit: z.enum(UNITS) }))
    .max(15),
});

export async function saveMdmSettings(session: Session, raw: z.input<typeof mdmSettingsInput>) {
  assertAdmin(session);
  const input = mdmSettingsInput.parse(raw);
  const names = input.stockItems.map((item) => item.name.toLowerCase());
  if (new Set(names).size !== names.length) throw new ApiError(400, 'An item is listed twice');
  const current = await officeSettings();
  const menu = Object.fromEntries(['1', '2', '3', '4', '5', '6'].map((key) => [key, input.menu[key] ?? '']));
  await putSetting('office', { ...current, mdmGrades: SCHOOL.grades.filter((grade) => input.mdmGrades.includes(grade)), menu, stockItems: input.stockItems });
  await audit(session, 'mdm.settings', { entity: 'settings', entityId: 'office', summary: 'Changed the mid-day meal menu and stock items' });
}

export const leaveTypesInput = z
  .array(
    z.object({
      key: z.string().trim().min(1, 'Short code is required').max(6).transform((value) => value.toUpperCase()),
      name: z.string().trim().min(1, 'Name is required').max(40),
      quota: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole days only').min(0, 'Cannot be negative').max(365),
    }),
  )
  .min(1, 'Keep at least one leave type')
  .max(15);

/** A leave type already used keeps its code; renaming it keeps the old leave under the new name. */
export async function saveLeaveTypes(session: Session, raw: z.input<typeof leaveTypesInput>) {
  assertAdmin(session);
  const types = leaveTypesInput.parse(raw);
  if (new Set(types.map((type) => type.key)).size !== types.length) throw new ApiError(400, 'Two leave types have the same short code');
  const current = await officeSettings();
  await putSetting('office', { ...current, leaveTypes: types });
  await audit(session, 'leave.settings', { entity: 'settings', entityId: 'office', summary: 'Changed the leave types and quotas' });
}
