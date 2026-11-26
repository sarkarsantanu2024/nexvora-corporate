'use server';

/** Server actions of the money screens: who is asking, the service, then refresh. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { ADMIN_ONLY, TEAM_ROLES, requireSession } from '@/lib/auth';
import { cancelBill, createBill, previewRun, runBills, saveFeeHead, setConcession, type BillInput, type FeeHeadInput, type RunInput } from './bills';
import { deleteExpense, saveExpense, type ExpenseInput } from './expenses';
import { takePayment, voidPayment, type PaymentInput } from './payments';
import { saveExpenseCategories, saveFeeSettings, savePaymentDetails, type PaymentDetailsInput } from './settings';

// Money shows on the overview, fees, reports and the parents' corner, so one change refreshes the dashboard.
const refresh = () => {
  revalidatePath('/admin', 'layout');
  revalidatePath('/parent', 'layout');
};

export const previewRunAction = action(async (input: RunInput) => {
  const session = await requireSession(ADMIN_ONLY);
  return previewRun(session, input);
});

export const runBillsAction = action(async (input: RunInput) => {
  const session = await requireSession(ADMIN_ONLY);
  const result = await runBills(session, input);
  refresh();
  return result;
});

export const createBillAction = action(async (input: BillInput) => {
  const session = await requireSession(TEAM_ROLES);
  const bill = await createBill(session, input);
  refresh();
  return { id: bill.id, invoiceNo: bill.invoiceNo };
});

export const cancelBillAction = action(async (id: string, reason: string) => {
  const session = await requireSession(ADMIN_ONLY);
  const result = await cancelBill(session, id, reason);
  refresh();
  return result;
});

export const setConcessionAction = action(async (id: string, input: { discount: number; reason: string }) => {
  const session = await requireSession(ADMIN_ONLY);
  const bill = await setConcession(session, id, input);
  refresh();
  return { id: bill.id };
});

export const saveFeeHeadAction = action(async (input: FeeHeadInput) => {
  const session = await requireSession(ADMIN_ONLY);
  const row = await saveFeeHead(session, input);
  refresh();
  return { id: row.id };
});

export const takePaymentAction = action(async (input: PaymentInput) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await takePayment(session, input);
  refresh();
  return result;
});

export const voidPaymentAction = action(async (id: string, reason: string) => {
  const session = await requireSession(ADMIN_ONLY);
  const result = await voidPayment(session, id, reason);
  refresh();
  return result;
});

export const saveExpenseAction = action(async (input: ExpenseInput) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await saveExpense(session, input);
  refresh();
  return { id: row.id };
});

export const deleteExpenseAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await deleteExpense(session, id);
  refresh();
  return result;
});

export const savePaymentDetailsAction = action(async (input: PaymentDetailsInput) => {
  const session = await requireSession(ADMIN_ONLY);
  const saved = await savePaymentDetails(session, input);
  refresh();
  return saved;
});

export const saveFeeSettingsAction = action(async (input: { dueDays: number; receiptFooter: string }) => {
  const session = await requireSession(ADMIN_ONLY);
  const saved = await saveFeeSettings(session, input);
  refresh();
  return saved;
});

export const saveExpenseCategoriesAction = action(async (categories: string[]) => {
  const session = await requireSession(ADMIN_ONLY);
  const saved = await saveExpenseCategories(session, { categories });
  refresh();
  return saved;
});
