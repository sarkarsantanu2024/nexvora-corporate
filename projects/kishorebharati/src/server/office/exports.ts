/**
 * Spreadsheets the office sends to the state portals (Banglar Shiksha,
 * UDISE+) and the mid-day meal returns. Read only. Each export is a list of
 * column headings and rows, turned into CSV by toCsv; the headings stay in
 * English because the portals' sheets are in English.
 */
import { and, asc, eq, isNull } from 'drizzle-orm';
import { SCHOOL, STREAM_LABELS, gradeLabel } from '@/config/school';
import { getDb } from '@/db';
import { CATEGORIES, enrolments, sections, students, type Category } from '@/db/schema';
import { ApiError } from '@/lib/api';
import type { Session } from '@/lib/session-token';
import { countInt } from '../admin/shared';
import { assertOffice, currentYear } from '../school/access';
import { qtyText } from './labels';
import { mdmMonth } from './mdm';

export type Sheet = { columns: string[]; rows: (string | number)[][] };

/** '2014-03-09' → '09/03/2014', the order the state portals ask for. */
const portalDate = (day: string | null) => (day ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : '');
const GENDER: Record<string, string> = { male: 'Male', female: 'Female', other: 'Transgender' };

export const PORTAL_COLUMNS = [
  'Student name',
  "Father's name",
  "Mother's name",
  'Date of birth',
  'Gender',
  'Social category',
  'Religion',
  'Admission number',
  'Class',
  'Section',
  'Roll number',
  'Mobile',
  'Address',
  'Banglar Shiksha ID',
];

/** The students of this year, class by class and roll by roll, in the column order of Banglar Shiksha and UDISE+. */
export async function studentPortalSheet(session: Session, filters: { grade?: string } = {}): Promise<Sheet> {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const grade = Number(filters.grade);
  const rows = await db
    .select({
      name: students.name,
      father: students.fatherName,
      mother: students.motherName,
      dob: students.dob,
      gender: students.gender,
      category: students.category,
      religion: students.religion,
      admissionNo: students.admissionNo,
      grade: sections.grade,
      sectionName: sections.name,
      stream: sections.stream,
      rollNo: enrolments.rollNo,
      phone: students.phone,
      address: students.address,
      portalId: students.portalId,
    })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .innerJoin(sections, eq(sections.id, enrolments.sectionId))
    .where(and(eq(enrolments.yearId, year.id), eq(students.status, 'active'), isNull(students.deletedAt), filters.grade && Number.isInteger(grade) ? eq(sections.grade, grade) : undefined))
    .orderBy(asc(sections.grade), asc(sections.stream), asc(sections.name), asc(enrolments.rollNo));
  return {
    columns: PORTAL_COLUMNS,
    rows: rows.map((r) => [
      r.name,
      r.father,
      r.mother,
      portalDate(r.dob),
      GENDER[r.gender] ?? r.gender,
      r.category,
      r.religion,
      r.admissionNo,
      r.grade,
      r.stream ? `${STREAM_LABELS[r.stream].en} ${r.sectionName}` : r.sectionName,
      r.rollNo,
      r.phone,
      r.address,
      r.portalId,
    ]),
  };
}

export type EnrolmentLine = { grade: number; cells: Record<Category, { boys: number; girls: number }>; boys: number; girls: number; total: number };

/**
 * The enrolment statement: boys and girls of each social category in each
 * class this year, with the totals. Only students still on the roll.
 */
export async function enrolmentStatement(session: Session) {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const rows = await db
    .select({ grade: sections.grade, category: students.category, gender: students.gender, n: countInt() })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .innerJoin(sections, eq(sections.id, enrolments.sectionId))
    .where(and(eq(enrolments.yearId, year.id), eq(students.status, 'active'), isNull(students.deletedAt)))
    .groupBy(sections.grade, students.category, students.gender);
  const empty = () => Object.fromEntries(CATEGORIES.map((c) => [c, { boys: 0, girls: 0 }])) as EnrolmentLine['cells'];
  const grades = [...new Set([...SCHOOL.grades, ...rows.map((row) => row.grade)])].sort((a, b) => a - b);
  const lines: EnrolmentLine[] = grades.map((grade) => ({ grade, cells: empty(), boys: 0, girls: 0, total: 0 }));
  for (const row of rows) {
    const line = lines.find((item) => item.grade === row.grade)!;
    const cell = line.cells[row.category] ?? line.cells.GEN;
    if (row.gender === 'female') {
      cell.girls += row.n;
      line.girls += row.n;
    } else if (row.gender === 'male') {
      cell.boys += row.n;
      line.boys += row.n;
    }
    line.total += row.n;
  }
  const totals: EnrolmentLine = { grade: 0, cells: empty(), boys: 0, girls: 0, total: 0 };
  for (const line of lines) {
    for (const c of CATEGORIES) {
      totals.cells[c].boys += line.cells[c].boys;
      totals.cells[c].girls += line.cells[c].girls;
    }
    totals.boys += line.boys;
    totals.girls += line.girls;
    totals.total += line.total;
  }
  return { year: year.name, lines, totals };
}

export async function enrolmentSheet(session: Session): Promise<Sheet> {
  const statement = await enrolmentStatement(session);
  const columns = ['Class', ...CATEGORIES.flatMap((c) => [`${c} boys`, `${c} girls`]), 'Total boys', 'Total girls', 'Total'];
  const line = (label: string, l: EnrolmentLine) => [label, ...CATEGORIES.flatMap((c) => [l.cells[c].boys, l.cells[c].girls]), l.boys, l.girls, l.total];
  return { columns, rows: [...statement.lines.map((l) => line(gradeLabel(l.grade), l)), line('Total', statement.totals)] };
}

/** The mid-day meal month: a line a day with the meals of each class, then the stock account. */
export async function mdmSheet(session: Session, month: string): Promise<Sheet> {
  const data = await mdmMonth(session, month);
  const columns = ['Date', 'Menu', ...data.grades.flatMap((g) => [`${gradeLabel(g)} present`, `${gradeLabel(g)} ate`]), 'Total present', 'Total ate', 'Cook-cum-helpers'];
  const rows: (string | number)[][] = data.lines.map((line) => [
    portalDate(line.day),
    line.shut ? `Closed: ${line.shut}` : line.menu,
    ...line.perGrade.flatMap((c): (string | number)[] => (c ? [c.present, c.ate] : ['', ''])),
    line.saved ? line.totalPresent : '',
    line.saved ? line.totalAte : '',
    line.cooksPresent ?? '',
  ]);
  const blank = () => columns.map(() => '');
  rows.push(blank());
  rows.push(['Days served', data.daysServed, ...data.classTotals.flatMap((c) => [`${c.daysServed} days`, c.meals]), '', data.meals, '']);
  rows.push(blank());
  rows.push(['Stock', 'Unit', 'Opening', 'Received', 'Used', 'Closing']);
  for (const item of data.stock) rows.push([item.item, item.unit, qtyText(item.opening), qtyText(item.received), qtyText(item.used), qtyText(item.closing)]);
  return { columns, rows };
}

const cell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV with a byte order mark, so Excel reads Bengali names correctly. */
export function toCsv(sheet: Sheet): string {
  const lines = [sheet.columns.map(cell).join(','), ...sheet.rows.map((row) => row.map(cell).join(','))];
  return `﻿${lines.join('\r\n')}\r\n`;
}

export const EXPORT_KINDS = ['students', 'enrolment', 'mdm'] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

export async function exportSheet(session: Session, kind: string, params: Record<string, string>): Promise<{ sheet: Sheet; name: string }> {
  if (kind === 'students') return { sheet: await studentPortalSheet(session, { grade: params.grade }), name: `students-portal${params.grade ? `-class-${params.grade}` : ''}` };
  if (kind === 'enrolment') return { sheet: await enrolmentSheet(session), name: 'enrolment-statement' };
  if (kind === 'mdm') return { sheet: await mdmSheet(session, params.month ?? ''), name: `mid-day-meal-${params.month}` };
  throw new ApiError(404, 'Not found');
}

