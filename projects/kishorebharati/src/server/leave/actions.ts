'use server';

/** Server actions of the Staff leave screen. Who may do what is checked in the service. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { ADMIN_ONLY, DASH_ROLES, requireSession } from '@/lib/auth';
import { assertPlan } from '../platform';
import { saveLeaveTypes, type leaveTypesInput } from '../office/settings';
import type { z } from 'zod';
import * as service from './service';

const refresh = () => revalidatePath('/admin', 'layout');

export const applyLeaveAction = action(async (input: service.LeaveInput) => {
  const session = await requireSession(DASH_ROLES);
  await assertPlan('platinum');
  await service.applyLeave(session, input);
  refresh();
});

export const decideLeaveAction = action(async (id: string, decision: 'approved' | 'rejected', note: string) => {
  const session = await requireSession(ADMIN_ONLY);
  await service.decideLeave(session, id, decision, note);
  refresh();
});

export const cancelLeaveAction = action(async (id: string) => {
  const session = await requireSession(DASH_ROLES);
  await service.cancelLeave(session, id);
  refresh();
});

export const saveLeaveTypesAction = action(async (types: z.input<typeof leaveTypesInput>) => {
  const session = await requireSession(ADMIN_ONLY);
  await saveLeaveTypes(session, types);
  refresh();
});
