/** Words of the exams module that reach t() through a variable (added to src/i18n/modules/exams.ts by hand). */
import type { ExamStatus } from '@/db/schema';

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  draft: 'Draft',
  open: 'Open for marks',
  published: 'Published',
};

/** Offered as suggestions in the exam form; any name may be typed. */
export const EXAM_NAME_SUGGESTIONS = ['First Summative', 'Second Summative', 'Third Summative', 'Unit test', 'Test exam', 'Pre-test'];
