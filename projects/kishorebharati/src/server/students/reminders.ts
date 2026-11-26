/** Birthday wishes to a student's guardian on WhatsApp (see src/server/reminders/kinds.ts). */
import { and, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { students } from '@/db/schema';
import type { ReminderKind } from '../reminders/kinds';

export const birthdayReminder: ReminderKind = {
  key: 'birthday',
  label: 'Student birthday',
  description: 'Birthday wishes on WhatsApp to the guardian of each student on roll, on the day.',
  defaultTemplate: 'শুভ জন্মদিন {name}। {business}-এর পক্ষ থেকে অনেক শুভেচ্ছা ও আশীর্বাদ।',
  placeholders: ['name', 'business'],
  defaultOn: true,
  async collect({ db, today, business }) {
    const monthDay = today.slice(5);
    const rows = await db
      .select({ id: students.id, name: students.name, guardian: students.guardianName, father: students.fatherName, phone: students.phone })
      .from(students)
      .where(and(eq(students.status, 'active'), isNull(students.deletedAt), ne(students.phone, ''), sql`to_char(${students.dob}, 'MM-DD') = ${monthDay}`));
    return rows.map((row) => ({
      dedupeKey: `birthday:${row.id}:${today.slice(0, 4)}`,
      toName: row.guardian || row.father || row.name,
      phone: row.phone,
      values: { name: row.name.split(' ')[0] || row.name, business },
      entity: 'student',
      entityId: row.id,
      href: `/admin/students/${row.id}`,
      dueOn: today,
    }));
  },
  // A wish for a student who has left or was deleted is no longer needed.
  async resolved(db, ids) {
    if (!ids.length) return [];
    const still = await db
      .select({ id: students.id })
      .from(students)
      .where(and(inArray(students.id, ids), eq(students.status, 'active'), isNull(students.deletedAt)));
    const present = new Set(still.map((row) => row.id));
    return ids.filter((id) => !present.has(id));
  },
};
