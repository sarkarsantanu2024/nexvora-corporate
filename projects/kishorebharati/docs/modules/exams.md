# Exams, marks and results

Screen: `/admin/exams` (menu "Exams and results"). Code: `src/server/exams/` (service, actions, grading), `src/app/admin/exams/`, words in `src/i18n/modules/exams.ts`, sample in `src/db/sample/exams.ts`, tests in `tests/exams.test.ts`.

## How an exam moves

| Status | What happens | Who moves it |
|---|---|---|
| draft | The office adds the exam (name, from class, to class, dates, order) and sets up its papers. Teachers do not see it. | office |
| open | Teachers enter marks for the subjects they teach; the office for any paper. | office opens, or sends back to draft |
| published | Results are final: marks are locked, the parents' corner shows them. | head of school (admin) only |
| published → open | "Take back results" to correct a mark. Needs a reason, written in the activity log (`exam.unpublish`). | admin only |

Deleting an exam: admin only, and only while no marks exist.

## Papers

"Set up papers" adds one paper per subject for every class of the exam, from the subject list (Classes and subjects: from class, to class, stream). Defaults: 100 full / 25 pass up to Class 10, 100 / 30 for 11 and 12; each paper can then be changed (full marks, pass marks, date). Running it again only adds what is missing. A paper is per class; a stream subject shows only in sections of that stream.

One total per paper. The West Bengal theory and practical split (and project marks) is not kept separately; it can be added later as extra columns if the school wants it.

## Screens

- **List** (`/admin/exams`): the year's exams with status, papers and how far marks are. Admin: "Grading scale". Teachers: open and published exams only.
- **Exam** (`/admin/exams/[id]`, office): status buttons, edit, papers by class, and "Marks entered": every section x paper, entered/total, and the teacher who teaches it (from teaching assignments), in red while incomplete.
- **Enter marks** (`/admin/exams/marks?exam=&section=&paper=`): one paper of one section. Number keypad, Enter goes to the next boy, Absent button per row. Saves by itself 1.2 s after typing (and on Enter/leaving a box) in one batch; marks above full are shown in red and never sent. Unsaved marks are also kept in the phone's storage and sent when the screen opens again or the connection returns; a bar at the bottom says Saved / Saving / No connection. A teacher sees only sections and subjects he teaches (teaching assignments).
- **Results** (`/admin/exams/results?exam=&section=`): boys x papers, total, %, grade, pass/fail, rank, highest per paper, class teacher's remark per boy. CSV and print (A4 landscape). Office and the class teacher only.
- **Report cards** (`/admin/exams/report-cards?section=&student=`): one A4 page per boy, every published exam of the year side by side, subject marks and grade, total, %, grade, result, rank, attendance for the year (`getAttendanceSummary`), the latest remark, signature lines. Office and the class teacher only.

## Rules of the result (src/server/exams/grading.ts)

- A paper with no entry for a boy (optional subject not taken) is left out of his total and full marks.
- Absent = 0 and a fail in that paper. Pass overall = passed every paper he has an entry for.
- Grade from the percentage by the scale in settings group `grading`. Default (WBBSE): AA 90+, A+ 80, A 60, B+ 45, B 35, C 25, D below 25. **The school must confirm the scale.**
- Rank in the section by percentage; equal percentages share a rank and the next is skipped (1, 2, 2, 4). Every boy with marks is ranked, failed or not.
- An optional-subject paper counts as complete once anyone has marks (for progress and the bell).

## Stored where

- Marks: `marks` (one row per paper per boy; `absent` true with `marks` null).
- Remarks: `settings` row `remarks:<examId>` = `{ studentId: text }` (exams and enrolments have no column for it).
- Grading scale: `settings` row `grading`.
- Activity log: `exam.create/update/delete/open/draft/published/unpublish/papers/paper/marks/remark/grading`. Marks write one line per person per paper and section per half hour, not one per autosave.

## For other modules

- `listPublishedResults(studentId)` returns every published exam of the boy (newest year first) with per-paper marks, grade, highest, total, %, grade, rank and out-of, and the remark. It checks nothing; `getResultsForParent(session, studentId)` checks the parent owns the student.
- The bell (`examNotifications` in `SOURCES`): teachers get "Marks to enter: exam, section, subject" for each of their incomplete papers while an exam is open; the office gets "Exam X: N papers without marks".
