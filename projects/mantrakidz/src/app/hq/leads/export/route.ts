import { handle } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';
import { formatDate, todayIST } from '@/lib/date';
import { STAGE_LABELS } from '@/server/hq/constants';
import { exportLeads } from '@/server/hq/leads';

export const GET = handle(async (req) => {
  await apiSession(HQ_ROLES);
  const url = new URL(req.url);
  const get = (name: string) => url.searchParams.get(name) ?? undefined;
  const rows = await exportLeads({ q: get('q'), stage: get('stage'), source: get('source') });
  const csv = toCsv(rows, [
    { header: 'Name', value: (r) => r.lead.name },
    { header: 'Mobile', value: (r) => r.lead.phone },
    { header: 'Email', value: (r) => r.lead.email },
    { header: 'City', value: (r) => r.lead.city },
    { header: 'State', value: (r) => r.lead.state },
    { header: 'Occupation', value: (r) => r.lead.occupation },
    { header: 'Investment range', value: (r) => r.lead.investmentRange },
    { header: 'Has space', value: (r) => (r.lead.hasSpace === null ? '' : r.lead.hasSpace ? 'Yes' : 'No') },
    { header: 'Space sq ft', value: (r) => r.lead.spaceSqft },
    { header: 'Source', value: (r) => r.lead.source },
    { header: 'Stage', value: (r) => STAGE_LABELS[r.lead.stage] },
    { header: 'Next follow-up', value: (r) => formatDate(r.lead.nextFollowUp) },
    { header: 'Assigned to', value: (r) => r.assignedName },
    { header: 'Lost reason', value: (r) => r.lead.lostReason },
    { header: 'Message', value: (r) => r.lead.message },
    { header: 'Received on', value: (r) => formatDate(todayIST(r.lead.createdAt)) },
  ]);
  return csvResponse(`franchise-leads-${todayIST()}.csv`, csv);
});
