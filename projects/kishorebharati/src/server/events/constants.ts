import type { CalendarKind } from '@/db/schema';

/** The words for each kind of calendar entry; screens pass them through t(). */
export const KIND_WORDS: Record<CalendarKind, string> = { holiday: 'Holiday', exam: 'Exam', event: 'Event', meeting: 'Meeting' };
