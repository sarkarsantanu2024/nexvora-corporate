# Daily school life

Attendance, staff attendance, timetable, class diary, events and calendar, and the teacher's home "My day".

## Screens

| Address | Who | What |
|---|---|---|
| `/admin/attendance` | office, teachers | The register. Date and section in the URL; teachers see their own sections, class teacher's first. Everyone starts present; tap a name for absent, small buttons for late (L) and leave (LV); one Save sends the whole register in one request. Shows who was absent the last time the register was taken. Sundays and calendar holidays are shut. The office also gets a board of every section for the day (taken or not, % present). |
| `?tab=month` | office, teachers | Monthly register: students × days, P / A / L / LV, totals and %. Prints A4 landscape with the school header. |
| `?tab=staff`, `?tab=staffmonth` | office | Staff attendance for a day (present, absent, leave, half day, on duty) and the monthly sheet with print. |
| `/admin/timetable` | office edits, teachers read | By class (Mon–Sat × periods; tap a cell for subject, teacher, room), by teacher (a teacher sees "My timetable"), and Period times (admin). A teacher in two classes at the same time is refused with a warning; "Save anyway" saves it (combined class). Prints per class and per teacher. |
| `/admin/diary` | office, teachers | Homework and classwork. A teacher writes for subjects they teach in a section; the class teacher may also post a general note (no subject). Teachers change and delete only their own entries; deleting goes to the Trash. |
| `/admin/events` | office edits, teachers read | Month grid and list of holidays, exams, events, meetings. "Invite" opens WhatsApp with the text ready (nothing is sent by the app). |
| `/admin/today` | teachers | My day: today's periods, the class teacher's register (taken or not), links to the diary and marks, notices for staff (audience `staff` or `public`). The office is sent to `/admin`. |

## Rules

- **Who takes the register:** the office for every section; a teacher only for sections they are class teacher of. A subject teacher can read the register and the monthly register of the sections they teach. (Decision for the owner: open marking to subject teachers too, if the school wants a substitute to take it.)
- Saving a register again for the same day replaces it (one row per student per day). `attendance.created_at` is set again on every save and is shown as "last saved".
- A day still to come, a day outside the current school year, a Sunday and a holiday in the calendar are refused.
- Percent present counts **late** as present; leave is not present.
- Timetable period times live in the settings group `timetable` (`src/server/timetable/defaults.ts`). The start and end of the day per class are from the school's portal page; the cut into periods is a starting guess the head of school changes on the Period times tab. A class has only the periods that end by the time it goes home.

## For other modules

- `getAttendanceSummary(studentId, from, to)` in `src/server/attendance/service.ts`: present, absent, late, leave, days, percent. It checks no access, so the caller must.
- `listDiaryForSections(sectionIds, from, to)` in `src/server/diary/service.ts`: diary entries, newest first. No access check either.
- `listPublicEvents(from, limit)` in `src/server/events/service.ts`: calendar entries marked "show on website", ending on or after `from`. `listPastPublicEvents(before, limit)` for past ones.
- `presentToday()` for the overview tile; `closedOn(day)` in `src/server/daily/shared.ts` tells whether the school is shut.

## Plugged into

- Reminders: `absent_today` (`src/server/attendance/reminder.ts`), dedupe `absent:<studentId>:<date>`, set aside when the register is corrected. It is filled when the Reminders screen opens (the daily job runs at 9:00, before registers are taken). The default wording is in Bengali.
- Bell: `registerItems` (`src/server/daily/notify.ts`): after 11:30 India time on a school day, a red line per untaken register for its class teacher, one amber line for the office.
- Trash: diary entries and calendar entries (`src/server/daily/trash.ts`).
- Overview tile "Present today" (`src/app/admin/attendance/present-tile.tsx`).
- Words: `src/i18n/modules/daily.ts`. Sample: `src/db/sample/daily.ts`. Tests: `tests/daily.test.ts`.
