'use server';

/** Server actions for the money screens: get the centre, call the service, refresh the screens. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { requireCentre } from '@/lib/auth';
import { cancelBill, createBill, discountBill, runMonthly, saveFeeHead, type BillInput, type FeeHeadInput } from './bills';
import { deleteExpense, paySalaries, saveExpense, type ExpenseInput, type SalaryInput } from './expenses';
import { deleteNotice, saveNotice, setNoticePinned, type NoticeInput } from './notices';
import { savePaymentDetails, type PaymentDetailsInput } from './payment-details';
import { takePayment, voidPayment, type PaymentInput } from './payments';

// Money shows on the overview, fees, a child's page and reports, so one change refreshes the whole centre area.
const refresh = () => revalidatePath('/centre', 'layout');

export const runMonthlyAction = action(async (month: string) => {
  const result = await runMonthly(await requireCentre(), month);
  refresh();
  return result;
});

export const createBillAction = action(async (input: BillInput) => {
  const bill = await createBill(await requireCentre(), input);
  refresh();
  return { id: bill.id, invoiceNo: bill.invoiceNo };
});

export const cancelBillAction = action(async (id: string, reason: string) => {
  const result = await cancelBill(await requireCentre(), id, reason);
  refresh();
  return result;
});

export const discountBillAction = action(async (id: string, input: { discount: number; reason: string }) => {
  const bill = await discountBill(await requireCentre(), id, input);
  refresh();
  return { id: bill.id };
});

export const saveFeeHeadAction = action(async (input: FeeHeadInput) => {
  const row = await saveFeeHead(await requireCentre(), input);
  refresh();
  return { id: row.id };
});

export const takePaymentAction = action(async (input: PaymentInput) => {
  const result = await takePayment(await requireCentre(), input);
  refresh();
  return result;
});

export const voidPaymentAction = action(async (id: string, reason: string) => {
  const result = await voidPayment(await requireCentre(), id, reason);
  refresh();
  return result;
});

export const saveExpenseAction = action(async (input: ExpenseInput) => {
  const row = await saveExpense(await requireCentre(), input);
  refresh();
  return { id: row.id };
});

export const deleteExpenseAction = action(async (id: string) => {
  const result = await deleteExpense(await requireCentre(), id);
  refresh();
  return result;
});

export const paySalariesAction = action(async (input: SalaryInput) => {
  const result = await paySalaries(await requireCentre(), input);
  refresh();
  return result;
});

export const saveNoticeAction = action(async (input: NoticeInput) => {
  const row = await saveNotice(await requireCentre(), input);
  refresh();
  return { id: row.id };
});

export const pinNoticeAction = action(async (id: string, pinned: boolean) => {
  const row = await setNoticePinned(await requireCentre(), id, pinned);
  refresh();
  return { id: row.id };
});

export const deleteNoticeAction = action(async (id: string) => {
  const result = await deleteNotice(await requireCentre(), id);
  refresh();
  return result;
});

export const savePaymentDetailsAction = action(async (input: PaymentDetailsInput) => {
  const saved = await savePaymentDetails(await requireCentre(), input);
  refresh();
  // Parents see these details on their fees page.
  revalidatePath('/parent', 'layout');
  return saved;
});
