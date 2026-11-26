# Students, classes, staff, certificates, schemes

The school's records of people. Office (admin, staff) keeps them; a teacher reads the students of his own sections.

## Screens

| Address | What it does | Who |
|---|---|---|
| `/admin/students` | Admission register of the current year: search (name, Bengali name, admission no., mobile, father, portal ID), filter by class, section, status (`?status=` blank = on roll, `left`, `passed_out`, `all`; `?phone=none`). Import from a spreadsheet, download CSV (`/admin/students/export`, same filters). | office; teacher read-only, own sections |
| `/admin/students/new`, `/[id]/edit` | Admission form. Admission number is automatic (counter `admission`, format in Settings → Admission numbers, `{n}` and `{year}`), or typed. Class, section and roll make this year's enrolment; a blank roll gets the next one. | office |
| `/admin/students/[id]` | Record, photo, year-by-year history, mark left / back on roll, Trash (admin), parent login, certificates and schemes, and links to the other modules (`/admin/attendance?student=`, `/admin/exams?student=`, `/admin/fees?student=`, `/admin/library?student=`). | office; teacher read-only |
| `/admin/students/id-cards` | 88 × 56 mm cards, 10 per A4 with dashed cut lines. `?section=` (on-roll students, untick to leave out) or `?ids=a,b`. | office |
| `/admin/students/promote` | Year end, one section at a time. Needs next year (Classes → School years). | office |
| `/admin/classes` | Tabs: Sections (of a year, `?year=`), School years (add, copying sections, class teachers and subject teachers; make current), Subjects (add, edit, switch off), Who teaches what. | office |
| `/admin/staff` | Staff list, add/edit, left / bring back, Trash (admin). Logins only by admin: teacher or office role, linked by `staff.userId`. | office; logins admin |
| `/admin/certificates` | Register, issue (`/new?kind=&student=`), print (`/[id]`), void with reason (admin). | office; void admin |
| `/admin/schemes` | `student_benefits` per year: counts per scheme and status, filters, add for one student or a whole section. | office |

## Rules worth knowing

- **Parent login**: username = guardian mobile, password set by the office, must be changed at first login. If a parent login with that number exists, the student joins it; other students with the same mobile and no login join too (brothers). A mobile that is a staff username is refused.
- **Year end** (`src/server/students/promotion.ts`): promoted → next class in `SCHOOL.grades`; detained → same class; passed → only in `SCHOOL.boardExamGrades`, with a higher class (10 → 11 Science/Arts) or none (passed out); left → no place. One transaction; repeating keeps existing places and roll numbers, moves changed ones, removes places of students now marked left/passed out. Student status follows (`passed_out`, `left`, back to `active`).
- **Certificates**: serial `TC|CC|BC/<year>/<n>` from counter `certificate:<kind>:<year>`. The printed fields are stored in `certificates.data` at issue, so a reprint never changes. A TC marks an on-roll student left (same transaction) and a second TC is refused until the first is voided. A void does not bring the student back. Bonafide only for students on roll. The TC shows unpaid fees (invoices unpaid/partial) as a warning. The date of birth in words is English (`src/server/certificates/words.ts`).
- **Trash**: student (admin only); purge refused when the student has fee payments or certificates. Staff: purge refused when in the staff attendance register. Trashing or marking staff as left switches their login off.
- **Hooks**: reminder `birthday` (`birthday:<id>:<year>`, Bengali default wording), suggestion "N students have no mobile number", overview tile "Students on roll", Settings card "Admission numbers" (`students` setting).

## Files

`src/server/students/` (service, promotion, actions, constants, shared, trash, reminders, suggestions), `src/server/classes/`, `src/server/staff/`, `src/server/certificates/`, `src/server/schemes/`, `src/components/school/letterhead.tsx`, `src/components/school/student-picker.tsx`, words in `src/i18n/modules/students.ts`, tests in `tests/students.test.ts`.
