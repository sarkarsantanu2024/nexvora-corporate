'use server';

/** Server actions of the office registers. Who may do what is checked again in each service. */
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { action } from '@/lib/api';
import { ADMIN_ONLY, DASH_ROLES, TEAM_ROLES, requireSession } from '@/lib/auth';
import { assertPlan } from '../platform';
import * as circulars from './circulars';
import * as mdm from './mdm';
import * as meetings from './meetings';
import * as records from './records';
import * as settings from './settings';
import * as stock from './stock';
import * as gate from './visitors';

const refresh = () => revalidatePath('/admin', 'layout');

async function office() {
  const session = await requireSession(TEAM_ROLES);
  await assertPlan('platinum');
  return session;
}

/* mid-day meal */
export const saveMdmDayAction = action(async (input: mdm.MdmInput) => {
  await mdm.saveMdmDay(await office(), input);
  refresh();
});
export const saveMdmSettingsAction = action(async (input: z.input<typeof settings.mdmSettingsInput>) => {
  await settings.saveMdmSettings(await requireSession(ADMIN_ONLY), input);
  refresh();
});

/* visitors and gate passes */
export const addVisitorAction = action(async (input: gate.VisitorInput) => {
  await gate.addVisitor(await office(), input);
  refresh();
});
export const markVisitorOutAction = action(async (id: string, outTime: string) => {
  await gate.markVisitorOut(await office(), id, outTime);
  refresh();
});
export const deleteVisitorAction = action(async (id: string) => {
  await gate.deleteVisitor(await requireSession(ADMIN_ONLY), id);
  refresh();
});
export const createGatePassAction = action(async (input: gate.GatePassInput) => {
  const row = await gate.createGatePass(await office(), input);
  refresh();
  return { id: row.id };
});

/* student records */
export const addRecordAction = action(async (input: records.RecordInput) => {
  await records.addRecord(await office(), input);
  refresh();
});
export const updateRecordAction = action(async (id: string, input: { day: string; data: Record<string, unknown> }) => {
  await records.updateRecord(await office(), id, input);
  refresh();
});
export const deleteRecordAction = action(async (id: string) => {
  await records.deleteRecord(await office(), id);
  refresh();
});

/* stock register */
export const createAssetAction = action(async (input: stock.AssetInput) => {
  const row = await stock.createAsset(await office(), input);
  refresh();
  return { id: row.id };
});
export const updateAssetAction = action(async (id: string, input: z.input<typeof stock.assetDetailsInput>) => {
  await stock.updateAsset(await office(), id, input);
  refresh();
});
export const addMovementAction = action(async (id: string, input: stock.MovementInput) => {
  await stock.addMovement(await office(), id, input);
  refresh();
});
export const deleteAssetAction = action(async (id: string) => {
  await stock.deleteAsset(await requireSession(ADMIN_ONLY), id);
  refresh();
});

/* meetings */
export const saveMeetingAction = action(async (id: string | null, input: meetings.MeetingInput) => {
  const row = await meetings.saveMeeting(await office(), id, input);
  refresh();
  return { id: row.id };
});
export const deleteMeetingAction = action(async (id: string) => {
  await meetings.deleteMeeting(await requireSession(ADMIN_ONLY), id);
  refresh();
});

/* circulars */
export const saveCircularAction = action(async (id: string | null, input: circulars.CircularInput) => {
  const row = await circulars.saveCircular(await office(), id, input);
  refresh();
  return { id: row.id };
});
export const deleteCircularAction = action(async (id: string) => {
  await circulars.deleteCircular(await requireSession(ADMIN_ONLY), id);
  refresh();
});
export const markCircularReadAction = action(async (id: string) => {
  await circulars.markCircularRead(await requireSession(DASH_ROLES), id);
  refresh();
});
