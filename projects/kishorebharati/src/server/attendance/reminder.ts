/**
 * The "absent today" WhatsApp reminder to a student's guardian. Listed in
 * REMINDER_KINDS (../reminders/kinds.ts). It is queued once per student per
 * day, and set aside by itself if the register is corrected to present.
 */
import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import { attendance, sections, students } from '@/db/schema';
import { sectionLabel } from '@/config/school';
import { formatDate } from '@/lib/date';
import type { ReminderKind } from '../reminders/kinds';

export const absentToday: ReminderKind = {
  key: 'absent_today',
  label: 'Absent today',
  description: "A message to the guardian's mobile when a student is marked absent in today's register.",
  defaultTemplate: 'নমস্কার, আজ {date} {name} ({class}) স্কুলে অনুপস্থিত। কারণটা শ্রেণি শিক্ষককে জানাবেন। {business}',
  placeholders: ['name', 'class', 'date', 'business'],
  defaultOn: true,
  async collect({ db, today, business }) {
    const rows = await db
      .select({ id: attendance.id, studentId: students.id, name: students.name, nameBn: students.nameBn, guardian: students.guardianName, father: students.fatherName, phone: students.phone, grade: sections.grade, section: sections.name, stream: sections.stream, shift: sections.shift })
      .from(attendance)
      .innerJoin(students, eq(students.id, attendance.studentId))
      .innerJoin(sections, eq(sections.id, attendance.sectionId))
      .where(and(eq(attendance.day, today), eq(attendance.status, 'absent'), isNull(students.deletedAt), ne(students.phone, '')));
    return rows.map((row) => ({
      dedupeKey: `absent:${row.studentId}:${today}`,
      toName: row.guardian || row.father || row.name,
      phone: row.phone,
      values: { name: row.nameBn || row.name, class: sectionLabel({ grade: row.grade, name: row.section, stream: row.stream, shift: row.shift }, 'bn'), date: formatDate(today), business },
      entity: 'attendance',
      entityId: row.id,
      href: `/admin/students/${row.studentId}`,
      dueOn: today,
    }));
  },
  // Corrected to present, late or leave (or the row is gone): no message needed.
  async resolved(db, ids) {
    if (!ids.length) return [];
    const still = await db.select({ id: attendance.id }).from(attendance).where(and(inArray(attendance.id, ids), eq(attendance.status, 'absent')));
    const absent = new Set(still.map((row) => row.id));
    return ids.filter((id) => !absent.has(id));
  },
};
