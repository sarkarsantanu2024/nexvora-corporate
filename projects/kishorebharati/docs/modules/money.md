# Money: fees, expenses, reports

Dum Dum Kishore Bharati is a government school. Its fees are small and set by the state, so nothing here holds an amount of its own: the office enters the **fee heads** (what is charged, once a year, one time or every month, and for which classes) and every bill is made from them. Real use starts with no fee heads; the sample data has a few marked "(sample)".

## Screens

| Address | Who | What |
|---|---|---|
| `/admin/fees` | office | Tabs: **Dues** (one row per student who owes, class filter, sort, WhatsApp reminder link, Take payment), **Bills** (list with totals, filters by year/month, status, class, student), **Day book** (receipts of a day by method, printable), and for the head of school **Fee heads** and **Payment details** (UPI ID, QR picture, bank account). |
| `/admin/fees/collect` | office | Find the student (name, admission no, mobile, or class + roll), tick the bills, amount, method, reference. Spread oldest first over the ticked bills, one receipt row per bill, printed together on one sheet. |
| `/admin/fees/receipts/[id]` | office | The receipt (half A4 / A5 landscape when printed, seal and school header from the `school` setting), Send on WhatsApp, Void (head of school, with reason). |
| `/admin/fees/bills/[id]` | office | Items, receipts, how to pay; Concession and Cancel bill for the head of school. Printable. |
| `/admin/fees/run` | admin | Bill run: yearly (`period` = 'YYYY', annual + one-time heads) or monthly ('YYYY-MM', monthly heads), a class range, the heads, the due date. Preview, then raise. |
| `/admin/fees/new` | office | A one-off bill (period null) for one student. |
| `/admin/expenses` | office | Add, change, delete (to the Trash) expenses; month and category filters; monthly total. Categories are a setting. |
| `/admin/reports` | admin | Income vs expenses for 12 months, collection by fee head, dues by class, and the printable income and expense statement of a month or a year. |
| Settings | admin | Fee rules (days to pay, receipt foot line), expense categories, library rules. |

## Rules kept in the code

- Whole rupees. A receipt is never deleted; voiding keeps the row (`voidedAt`, `voidReason`) and recomputes the bill. Voided receipts and trashed expenses are left out of every total (`livePayment`, `liveExpense`).
- Every write that touches more than one money row runs in `db.transaction`. Bill numbers (`B/2026/0001`, counter `bill:YYYY`) and receipt numbers (`R/26-27/0001`, counter `receipt:<financial year>`, as the cash book runs) are taken inside it.
- One bill per student per period (unique index). The run is safe to repeat: a student who already has the period's bill gets only the heads not on it yet (so the Class 11 admission fee can be added to the yearly bill later); nothing twice.
- Roles: staff take payments, raise one-off bills and write expenses; only the head of school (admin) runs bills, changes fee heads and payment details, gives concessions, cancels bills, voids receipts and opens Reports. Checked in the services.
- No payment gateway. Payment details show on bills and at the end of the WhatsApp reminder; the office records the receipt when money arrives.
- Expenses in the Trash can be restored; purge refuses (money records are never removed).

## Plugged into the shared lists

- Reminders (`src/server/money/reminders.ts`): `fee_due` (dedupe `fee_due:<invoiceId>`, the days before is the reminders setting) and `fee_overdue` (`fee_overdue:<invoiceId>:<YYYY-MM>`, once a month). Both set aside once the bill is paid or cancelled. Wording in Bengali, editable in Settings.
- Bell (`src/server/money/bell.ts`): "N bills fall due this week". Suggestion: "This month the expenses are higher than the fees collected" (admin).
- Overview tiles: Collected this month, Dues (`moneyTiles()` in `reports.ts`).
- Trash: `expenseTrashSource`.

## For the parents' corner

- `listBillsForStudent(studentId)` in `src/server/money/bills.ts`: bills (with items), live receipts and the total due. The caller checks the student with `parentStudentIds`.
- `getReceiptForStudents(paymentId, studentIds)` in `payments.ts`, and `<ReceiptSheet>` in `src/app/admin/fees/receipts/receipt-sheet.tsx`.
- `getPaymentDetails()` in `shared.ts`, and `<PayInfo>` in `src/app/admin/fees/pay-info.tsx` (pass `upiLink="always"`).

Library fines are kept in the library (`book_issues.fine`, `finePaid`) and are not in the income statement.
