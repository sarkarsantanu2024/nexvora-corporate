/**
 * How marks become a result: totals, percentage, letter grade, pass or fail
 * and the rank in the section. Plain functions over plain data, so the
 * screens, the report card, the parents' corner and the tests all work the
 * result out the same way.
 *
 * Rules (tell the school if one should change):
 *  - A paper a student has no entry for (an optional subject he does not
 *    take) is left out of his total and his full marks.
 *  - Absent counts as 0 out of the paper's full marks and fails that paper.
 *  - The grade comes from the percentage, by the scale in Settings (group
 *    'grading'); the default is the WBBSE scale.
 *  - Rank is by percentage within the section; equal percentages share a
 *    rank and the next rank is skipped (1, 2, 2, 4).
 */

export type GradeBand = { grade: string; min: number };

/** WBBSE letter grades. The school must confirm these before results go out. */
export const DEFAULT_GRADE_SCALE: GradeBand[] = [
  { grade: 'AA', min: 90 },
  { grade: 'A+', min: 80 },
  { grade: 'A', min: 60 },
  { grade: 'B+', min: 45 },
  { grade: 'B', min: 35 },
  { grade: 'C', min: 25 },
  { grade: 'D', min: 0 },
];

/** The letter for a percentage: the first band (highest first) whose minimum it reaches. */
export function gradeFor(percent: number, scale: GradeBand[] = DEFAULT_GRADE_SCALE): string {
  const bands = [...scale].sort((a, b) => b.min - a.min);
  return bands.find((band) => percent >= band.min)?.grade ?? bands[bands.length - 1]?.grade ?? '';
}

/** One decimal, as printed. */
export const roundPercent = (value: number) => Math.round(value * 10) / 10;

/**
 * Standard competition ranking: equal scores share a rank and the next rank
 * is skipped. Returns the rank for each id; ids with a null score get none.
 */
export function rankWithTies(scores: { id: string; score: number | null }[]): Map<string, number> {
  const ranked = scores.filter((row): row is { id: string; score: number } => row.score !== null).sort((a, b) => b.score - a.score);
  const out = new Map<string, number>();
  ranked.forEach((row, index) => {
    const previous = ranked[index - 1];
    out.set(row.id, previous && previous.score === row.score ? out.get(previous.id)! : index + 1);
  });
  return out;
}

export type ResultPaper = { id: string; subjectId: string; fullMarks: number; passMarks: number };
export type ResultMark = { paperId: string; studentId: string; marks: number | null; absent: boolean };
export type PaperResult = { marks: number | null; absent: boolean; passed: boolean; grade: string };
export type StudentResult = {
  studentId: string;
  /** paperId → the student's entry; a paper with no entry is not in the map. */
  papers: Map<string, PaperResult>;
  total: number;
  full: number;
  /** null when the student has no entry at all. */
  percent: number | null;
  grade: string;
  passed: boolean;
  /** Papers failed or missed. */
  failedIn: string[];
  rank: number | null;
};

/** Every student's result in one section for one exam, and the highest mark of each paper. */
export function computeResults(papers: ResultPaper[], studentIds: string[], marks: ResultMark[], scale: GradeBand[] = DEFAULT_GRADE_SCALE) {
  const paperById = new Map(papers.map((paper) => [paper.id, paper]));
  const byStudent = new Map<string, ResultMark[]>();
  for (const row of marks) {
    if (!paperById.has(row.paperId)) continue;
    if (row.marks === null && !row.absent) continue;
    byStudent.set(row.studentId, [...(byStudent.get(row.studentId) ?? []), row]);
  }

  const results: StudentResult[] = studentIds.map((studentId) => {
    const own = byStudent.get(studentId) ?? [];
    const entries = new Map<string, PaperResult>();
    let total = 0;
    let full = 0;
    const failedIn: string[] = [];
    for (const row of own) {
      const paper = paperById.get(row.paperId)!;
      const got = row.absent ? 0 : (row.marks ?? 0);
      const passed = !row.absent && got >= paper.passMarks;
      entries.set(row.paperId, { marks: row.absent ? null : row.marks, absent: row.absent, passed, grade: gradeFor(paper.fullMarks ? (got / paper.fullMarks) * 100 : 0, scale) });
      total += got;
      full += paper.fullMarks;
      if (!passed) failedIn.push(row.paperId);
    }
    const percent = full > 0 ? roundPercent((total / full) * 100) : null;
    return {
      studentId,
      papers: entries,
      total,
      full,
      percent,
      grade: percent === null ? '' : gradeFor(percent, scale),
      passed: entries.size > 0 && failedIn.length === 0,
      failedIn,
      rank: null,
    };
  });

  // Ranked on the exact percentage (two decimals), so rounding for print never makes a false tie.
  const ranks = rankWithTies(results.map((row) => ({ id: row.studentId, score: row.full > 0 ? Math.round((row.total / row.full) * 10000) / 100 : null })));
  for (const row of results) row.rank = ranks.get(row.studentId) ?? null;

  const highest = new Map<string, number>();
  for (const row of marks) {
    if (!paperById.has(row.paperId) || row.absent || row.marks === null) continue;
    highest.set(row.paperId, Math.max(highest.get(row.paperId) ?? 0, row.marks));
  }
  return { results, highest };
}
