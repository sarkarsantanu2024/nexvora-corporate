/**
 * Words for the enquiry statuses. Kept free of any database import so client
 * components can use them too.
 */
import type { EnquiryStatus } from '@/db/schema';

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
};
