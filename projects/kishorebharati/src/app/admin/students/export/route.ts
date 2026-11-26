/** The students list as a CSV file for Excel, with the same filters as the screen. Office only. */
import { sectionLabel } from '@/config/school';
import { handle } from '@/lib/api';
import { TEAM_ROLES, apiSession } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { CATEGORY_LABELS, GENDER_LABELS, STUDENT_STATUS_LABELS } from '@/server/students/constants';
import { exportStudents, type StudentListRow } from '@/server/students/service';

const COLUMNS: [string, (row: StudentListRow) => string | number | null][] = [
  ['Admission number', (r) => r.admissionNo],
  ['Name', (r) => r.name],
  ['Name in Bengali', (r) => r.nameBn],
  ['Class', (r) => (r.grade !== null ? sectionLabel({ grade: r.grade, name: r.sectionName ?? '', stream: r.stream ?? '', shift: r.shift ?? 'day' }) : '')],
  ['Roll number', (r) => r.rollNo],
  ['Date of birth', (r) => r.dob],
  ['Gender', (r) => GENDER_LABELS[r.gender]],
  ["Father's name", (r) => r.fatherName],
  ["Mother's name", (r) => r.motherName],
  ['Guardian', (r) => r.guardianName],
  ['Guardian mobile', (r) => r.phone],
  ['Other mobile', (r) => r.altPhone],
  ['Address', (r) => r.address],
  ['Category', (r) => CATEGORY_LABELS[r.category]],
  ['Religion', (r) => r.religion],
  ['Blood group', (r) => r.bloodGroup],
  ['Banglar Shiksha ID', (r) => r.portalId],
  ['Admission date', (r) => r.admittedOn],
  ['Status', (r) => STUDENT_STATUS_LABELS[r.status]],
  ['Left on', (r) => r.leftOn],
];

const cell = (value: string | number | null) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const GET = handle(async (req) => {
  const session = await apiSession(TEAM_ROLES);
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const rows = await exportStudents(session, params);
  const lines = [COLUMNS.map(([header]) => cell(header)).join(','), ...rows.map((row) => COLUMNS.map(([, value]) => cell(value(row))).join(','))];
  // The byte order mark makes Excel read the Bengali names correctly.
  return new Response(`﻿${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="students-${todayIST()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});
