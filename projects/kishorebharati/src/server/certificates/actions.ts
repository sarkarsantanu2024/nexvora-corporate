'use server';

/** Server actions of Certificates. */
import { revalidatePath } from 'next/cache';
import { action } from '@/lib/api';
import { ADMIN_ONLY, TEAM_ROLES, requireSession } from '@/lib/auth';
import * as service from './service';

const refresh = () => revalidatePath('/admin', 'layout');

export const issueCertificateAction = action(async (input: service.IssueInput) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await service.issueCertificate(session, input);
  refresh();
  return result;
});

export const voidCertificateAction = action(async (id: string, reason: string) => {
  const session = await requireSession(ADMIN_ONLY);
  await service.voidCertificate(session, id, { reason });
  refresh();
});
