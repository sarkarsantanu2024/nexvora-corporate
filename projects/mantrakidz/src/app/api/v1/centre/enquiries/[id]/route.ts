/** PATCH an enquiry: its details, its stage, or both in one call. */
import { getDb } from '@/db';
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { enquiryAsInput, loadEnquiry, setEnquiryStage, updateEnquiry } from '@/server/centre/children/enquiries';

const STAGE_KEYS = ['stage', 'visitOn', 'lostReason'];

export const PATCH = handle(async (req, { params }) => {
  const ctx = await apiCentre();
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  let row = await loadEnquiry(await getDb(), ctx.centre.id, id);

  const details = Object.fromEntries(Object.entries(body).filter(([key]) => !STAGE_KEYS.includes(key)));
  if (Object.keys(details).length) row = await updateEnquiry(ctx, id, { ...enquiryAsInput(row), ...details });
  if (typeof body.stage === 'string') {
    row = await setEnquiryStage(ctx, id, { stage: body.stage, visitOn: body.visitOn, lostReason: body.lostReason, nextFollowUp: body.nextFollowUp } as Parameters<typeof setEnquiryStage>[2]);
  }
  return ok(row);
});
