# Library

`/admin/library`, office logins. Code: `src/server/library`, screens `src/app/admin/library`.

## Screens

- **Books**: search by title, author, accession number or subject; filter by status (on the shelf, issued, lost, withdrawn). Add or change a book in a drawer; the accession number is given automatically (`<prefix>-00001` from the `accession` counter, skipping a number typed in by hand) or typed in. **Import books** takes the old accession register from a spreadsheet. Each row: Issue, change, and the "..." menu for lost, withdrawn or back on the shelf.
- **On loan / Overdue / Fines due / Returned**: the loans. Overdue rows carry a WhatsApp reminder link; open loans a Return button (date, the fine it comes to, paid now or not); fines not yet paid a "Fine paid" button.
- **Issue book**: pick the book (on the shelf only) and the borrower (student by name or admission number, or staff by name). Shows what the borrower already holds. The return date defaults to the loan days of the rules.

## Rules

The `library` setting, changed by the head of school in Settings: days a book may be kept (default 14), fine for each late day (default ₹1), books a student may hold at a time (default 2; staff are not held to it), accession prefix (default KB).

- A book on loan, lost or withdrawn cannot be issued. The book row is locked while issuing, so one copy is never lent twice.
- The fine is late days times the fine a day, worked out when the book comes back (and shown "so far" while it is out).
- A book on loan cannot be withdrawn; marking it lost closes the loan with the fine so far.

## Plugged into the shared lists

- Reminder `library_overdue` (dedupe `library_overdue:<issueId>`, set aside when the book is back), Bengali wording.
- Bell: "N library books are overdue" for office logins.
- Status colours of the four book statuses in `STATUS_TONES`.

## For the parents' corner

`listLoansForStudent(studentId)` in `src/server/library/service.ts`: the student's loans, newest first, with `overdue` and `fineDue`. The caller checks the student with `parentStudentIds`.
