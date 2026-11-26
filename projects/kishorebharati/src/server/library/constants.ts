/** Words of the library screens. No server imports, so client forms can use them. */
import type { BookStatus } from '@/db/schema';

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  available: 'On the shelf',
  issued: 'Issued',
  lost: 'Lost',
  withdrawn: 'Withdrawn',
};

export const BOOK_LANGUAGES = ['Bengali', 'English', 'Hindi', 'Sanskrit', 'Other'];
