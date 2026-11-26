/**
 * Transfer, character and bonafide certificates. Each kind has its own
 * running serial number per school year (TC/2026/7). What was printed is
 * kept with the certificate as it was issued, so a reprint is the same paper.
 * A wrong certificate is voided with a reason, never deleted.
 *
 * Issuing a transfer certificate marks the student as left, in the same
 * transaction, unless he has already left or passed out.
 */
import { and, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { CERTIFICATE_KINDS, academicYears, certificates, enrolments, invoices, sections, students, type CertificateKind } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day, requiredText, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, pageOf } from '../admin/shared';
import { assertOffice, currentYear } from '../school/access';
import { CERTIFICATE_CODES } from '../students/constants';
import { nextNumber } from '../students/shared';
import { dateInWords } from './words';

const isKind = (value: unknown): value is CertificateKind => (CERTIFICATE_KINDS as readonly string[]).includes(value as string);

/* ───────────── register ───────────── */

export type CertificateFilters = { kind?: string; q?: string; voided?: string; page?: string | number };

export async function listCertificates(session: Session, filters: CertificateFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const conds: (SQL | undefined)[] = [];
  if (isKind(filters.kind)) conds.push(eq(certificates.kind, filters.kind));
  const term = filters.q?.trim();
  if (term) {
    const pattern = `%${term}%`;
    conds.push(or(ilike(students.name, pattern), ilike(students.admissionNo, pattern), ilike(certificates.serialNo, pattern)));
  }
  if (filters.voided === 'yes') conds.push(sql`${certificates.voidedAt} is not null`);
  if (filters.voided === 'no') conds.push(isNull(certificates.voidedAt));
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [{ n }], kinds] = await Promise.all([
    db
      .select({
        id: certificates.id,
        kind: certificates.kind,
        serialNo: certificates.serialNo,
        issuedOn: certificates.issuedOn,
        voidedAt: certificates.voidedAt,
        voidReason: certificates.voidReason,
        studentId: students.id,
        name: students.name,
        admissionNo: students.admissionNo,
      })
      .from(certificates)
      .innerJoin(students, eq(students.id, certificates.studentId))
      .where(where)
      .orderBy(desc(certificates.issuedOn), desc(certificates.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(certificates).innerJoin(students, eq(students.id, certificates.studentId)).where(where),
    db.select({ kind: certificates.kind, n: countInt() }).from(certificates).where(isNull(certificates.voidedAt)).groupBy(certificates.kind),
  ]);
  const counts = Object.fromEntries(CERTIFICATE_KINDS.map((kind) => [kind, 0])) as Record<CertificateKind, number>;
  for (const row of kinds) counts[row.kind] = row.n;
  return { rows, total: n, page, pageSize: PAGE_SIZE, counts };
}

export async function getCertificate(session: Session, id: string) {
  assertOffice(session);
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return null;
  const db = await getDb();
  const [row] = await db.select().from(certificates).where(eq(certificates.id, parsed.data)).limit(1);
  if (!row) return null;
  const [student] = await db.select({ id: students.id, name: students.name, photo: students.photo }).from(students).where(eq(students.id, row.studentId));
  return { certificate: row, student };
}

/* ───────────── a new certificate ───────────── */

/** Unpaid bills of a student, in rupees (cancelled bills left out). */
async function duesOf(studentId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ due: sql<number>`coalesce(sum(${invoices.total} - ${invoices.paid}), 0)::int` })
    .from(invoices)
    .where(and(eq(invoices.studentId, studentId), inArray(invoices.status, ['unpaid', 'partial'])));
  return row?.due ?? 0;
}

/** What the issue form starts with: the student's details, his latest class and what he still owes. */
export async function certificateDraft(session: Session, studentId: string) {
  assertOffice(session);
  const parsed = uuid.safeParse(studentId);
  if (!parsed.success) return null;
  const db = await getDb();
  const [student] = await db.select().from(students).where(and(eq(students.id, parsed.data), isNull(students.deletedAt))).limit(1);
  if (!student) return null;
  const [latest] = await db
    .select({ yearName: academicYears.name, grade: sections.grade, sectionName: sections.name, stream: sections.stream, shift: sections.shift, rollNo: enrolments.rollNo, result: enrolments.result })
    .from(enrolments)
    .innerJoin(academicYears, eq(academicYears.id, enrolments.yearId))
    .innerJoin(sections, eq(sections.id, enrolments.sectionId))
    .where(eq(enrolments.studentId, student.id))
    .orderBy(desc(academicYears.startsOn))
    .limit(1);
  const issued = await db
    .select({ id: certificates.id, kind: certificates.kind, serialNo: certificates.serialNo, issuedOn: certificates.issuedOn })
    .from(certificates)
    .where(and(eq(certificates.studentId, student.id), isNull(certificates.voidedAt)))
    .orderBy(desc(certificates.issuedOn));
  return { student, latest: latest ?? null, dues: await duesOf(student.id), issued, today: todayIST() };
}

const issueInput = z.object({
  kind: z.enum(CERTIFICATE_KINDS),
  studentId: uuid,
  issuedOn: day,
  /** Transfer certificate */
  leftOn: z.union([z.literal(''), day]).default(''),
  reason: text(200),
  promoted: z.enum(['yes', 'no', 'na']).default('na'),
  promotedTo: text(40),
  duesCleared: z.boolean().default(true),
  /** Transfer and character certificate */
  conduct: text(60),
  /** Bonafide: what it is for (bank account, scholarship) */
  purpose: text(200),
  remarks: text(300),
});
export type IssueInput = z.input<typeof issueInput>;

export async function issueCertificate(session: Session, input: IssueInput) {
  assertOffice(session);
  const data = issueInput.parse(input);
  if (data.kind === 'tc') {
    if (!data.leftOn) throw new ApiError(400, 'Pick the date of leaving', { leftOn: 'Pick a date' });
    if (!data.reason) throw new ApiError(400, 'Give the reason for leaving', { reason: 'Reason is required' });
  }
  if (data.kind !== 'bonafide' && !data.conduct) throw new ApiError(400, 'Choose the conduct', { conduct: 'Choose the conduct' });
  const db = await getDb();
  const draft = await certificateDraft(session, data.studentId);
  if (!draft) throw new ApiError(404, 'Student not found');
  const { student, latest } = draft;
  if (data.kind === 'bonafide' && student.status !== 'active') throw new ApiError(400, 'A bonafide certificate is only for a student on roll');
  if (data.kind === 'tc' && draft.issued.some((row) => row.kind === 'tc')) throw new ApiError(400, 'A transfer certificate is already issued. Void it first to issue a new one.');

  const printed: Record<string, unknown> = {
    name: student.name,
    nameBn: student.nameBn,
    fatherName: student.fatherName,
    motherName: student.motherName,
    admissionNo: student.admissionNo,
    portalId: student.portalId,
    category: student.category,
    dob: student.dob ?? '',
    dobWords: student.dob ? dateInWords(student.dob) : '',
    admittedOn: student.admittedOn ?? '',
    admittedGrade: student.admittedGrade,
    grade: latest?.grade ?? null,
    sectionName: latest?.sectionName ?? '',
    stream: latest?.stream ?? '',
    shift: latest?.shift ?? 'day',
    rollNo: latest?.rollNo ?? null,
    yearName: latest?.yearName ?? '',
    remarks: data.remarks,
  };
  if (data.kind === 'tc') Object.assign(printed, { leftOn: data.leftOn, reason: data.reason, promoted: data.promoted, promotedTo: data.promotedTo, duesCleared: data.duesCleared, conduct: data.conduct });
  if (data.kind === 'character') Object.assign(printed, { conduct: data.conduct, fromOn: student.admittedOn ?? '', toOn: student.leftOn ?? '' });
  if (data.kind === 'bonafide') Object.assign(printed, { purpose: data.purpose });

  const row = await db.transaction(async (tx) => {
    const year = await currentYear(tx);
    const n = await nextNumber(tx, `certificate:${data.kind}:${year.name}`);
    const [certificate] = await tx
      .insert(certificates)
      .values({ kind: data.kind, serialNo: `${CERTIFICATE_CODES[data.kind]}/${year.name}/${n}`, studentId: student.id, issuedOn: data.issuedOn, data: printed, issuedBy: session.uid })
      .returning();
    if (data.kind === 'tc' && student.status === 'active') {
      await tx.update(students).set({ status: 'left', leftOn: data.leftOn, leftReason: data.reason, updatedAt: new Date() }).where(eq(students.id, student.id));
    }
    return certificate;
  });
  await audit(session, 'certificate.issue', { entity: 'certificate', entityId: row.id, summary: `Issued ${row.serialNo} to ${student.name}` });
  return { id: row.id, serialNo: row.serialNo };
}

const voidInput = z.object({ reason: requiredText('Reason', 200) });

/** The serial number stays used; the register shows the certificate struck out. A voided TC does not bring the student back on roll. */
export async function voidCertificate(session: Session, id: string, input: z.input<typeof voidInput>) {
  assertAdmin(session);
  const data = voidInput.parse(input);
  const db = await getDb();
  const [row] = await db
    .update(certificates)
    .set({ voidedAt: new Date(), voidReason: data.reason })
    .where(and(eq(certificates.id, uuid.parse(id)), isNull(certificates.voidedAt)))
    .returning();
  if (!row) throw new ApiError(404, 'Certificate not found or already void');
  await audit(session, 'certificate.void', { entity: 'certificate', entityId: row.id, summary: `Voided ${row.serialNo}: ${data.reason}` });
}
