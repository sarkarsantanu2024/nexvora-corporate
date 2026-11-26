/** Students and staff in the Trash (see src/server/trash/service.ts). */
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DB } from '@/db';
import { certificates, payments, staff, staffAttendance, students } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { countInt } from '../admin/shared';
import type { TrashSource } from '../trash/service';

const LIST_LIMIT = 200;

export const studentTrash: TrashSource = {
  kind: 'student',
  label: 'Student',
  async list(db) {
    const rows = await db
      .select({ id: students.id, name: students.name, admissionNo: students.admissionNo, phone: students.phone, deletedAt: students.deletedAt })
      .from(students)
      .where(isNotNull(students.deletedAt))
      .orderBy(desc(students.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({ kind: 'student', id: row.id, title: row.name, detail: [row.admissionNo, row.phone].filter(Boolean).join(' · '), deletedAt: row.deletedAt as Date }));
  },
  async restore(db, id) {
    const [row] = await db.update(students).set({ deletedAt: null, updatedAt: new Date() }).where(and(eq(students.id, id), isNotNull(students.deletedAt))).returning({ name: students.name });
    return row?.name ?? null;
  },
  async purge(db: DB, id) {
    const [row] = await db.select({ name: students.name }).from(students).where(and(eq(students.id, id), isNotNull(students.deletedAt))).limit(1);
    if (!row) return null;
    // Money and issued certificates are records of the school: never removed.
    const [paid] = await db.select({ n: countInt() }).from(payments).where(eq(payments.studentId, id));
    if (paid.n) throw new ApiError(400, 'This student has fee payments, so the record is kept. It can stay in the Trash.');
    const [issued] = await db.select({ n: countInt() }).from(certificates).where(eq(certificates.studentId, id));
    if (issued.n) throw new ApiError(400, 'Certificates were issued to this student, so the record is kept. It can stay in the Trash.');
    await db.delete(students).where(eq(students.id, id));
    return row.name;
  },
};

export const staffTrash: TrashSource = {
  kind: 'staff',
  label: 'Staff member',
  async list(db) {
    const rows = await db
      .select({ id: staff.id, name: staff.name, designation: staff.designation, phone: staff.phone, deletedAt: staff.deletedAt })
      .from(staff)
      .where(isNotNull(staff.deletedAt))
      .orderBy(desc(staff.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({ kind: 'staff', id: row.id, title: row.name, detail: [row.designation, row.phone].filter(Boolean).join(' · '), deletedAt: row.deletedAt as Date }));
  },
  async restore(db, id) {
    const [row] = await db.update(staff).set({ deletedAt: null, updatedAt: new Date() }).where(and(eq(staff.id, id), isNotNull(staff.deletedAt))).returning({ name: staff.name });
    return row?.name ?? null;
  },
  async purge(db, id) {
    const [row] = await db.select({ name: staff.name }).from(staff).where(and(eq(staff.id, id), isNotNull(staff.deletedAt))).limit(1);
    if (!row) return null;
    const [marked] = await db.select({ n: countInt() }).from(staffAttendance).where(eq(staffAttendance.staffId, id));
    if (marked.n) throw new ApiError(400, 'This staff member is in the attendance register, so the record is kept. It can stay in the Trash.');
    await db.delete(staff).where(eq(staff.id, id));
    return row.name;
  },
};
