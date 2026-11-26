'use server';

/** Server actions of Government schemes. */
import { revalidatePath } from 'next/cache';
import type { BenefitStatus } from '@/db/schema';
import { action } from '@/lib/api';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';

const refresh = () => revalidatePath('/admin', 'layout');

type BenefitFields = { scheme: string; year: string; status: BenefitStatus; amount: number; receivedOn: string; note: string };

export const addBenefitAction = action(async (input: BenefitFields & { studentId: string }) => {
  const session = await requireSession(TEAM_ROLES);
  await service.addBenefit(session, input);
  refresh();
});

export const updateBenefitAction = action(async (id: string, input: BenefitFields) => {
  const session = await requireSession(TEAM_ROLES);
  await service.updateBenefit(session, id, input);
  refresh();
});

export const deleteBenefitAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await service.deleteBenefit(session, id);
  refresh();
});

export const addBenefitsForSectionAction = action(async (input: BenefitFields & { sectionId: string; studentIds: string[] }) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await service.addBenefitsForSection(session, input);
  refresh();
  return result;
});
