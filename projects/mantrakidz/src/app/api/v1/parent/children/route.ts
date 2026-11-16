/** GET: the logged-in parent's own children with this month's attendance and what is due. */
import { handle, ok } from '@/lib/api';
import { apiSession } from '@/lib/auth';
import { listChildren } from '@/server/parent/service';

export const GET = handle(async () => ok(await listChildren(await apiSession(['parent']))));
