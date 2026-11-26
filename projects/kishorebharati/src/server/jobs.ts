/**
 * What runs once a day by itself, at 9:00 in the morning India time
 * (vercel.json → /api/cron/daily). Each job is safe to run twice: a job that
 * runs again the same day finds nothing new to do.
 *
 * ADDING YOUR OWN (a business module: the monthly bills, a stock check)
 *   Write a function that does the work and returns one short line saying
 *   what it did, and add it to JOBS. One job failing does not stop the others.
 */
import { planAllows } from '@/lib/plans';
import { putSetting } from './admin/shared';
import { getPlatform } from './platform';
import { cleanQueue, fillQueue } from './reminders/service';

type Job = { name: string; run: () => Promise<string> };

const JOBS: Job[] = [
  {
    name: 'reminders',
    run: async () => {
      if (!planAllows((await getPlatform()).plan, 'panel')) return 'not in the plan';
      const { added, closed } = await fillQueue();
      return `${added} queued, ${closed} no longer needed`;
    },
  },
  { name: 'clean reminders', run: async () => `${await cleanQueue()} old rows removed` },
];

/** Runs every job, notes when it ran and what each did, and returns the same lines. */
export async function runDailyJobs(): Promise<string[]> {
  if ((await getPlatform()).status === 'suspended') return ['account paused: nothing run'];
  const lines: string[] = [];
  for (const job of JOBS) {
    try {
      lines.push(`${job.name}: ${await job.run()}`);
    } catch (error) {
      console.error('[jobs]', job.name, error);
      lines.push(`${job.name}: failed`);
    }
  }
  await putSetting('jobs', { lastRunAt: new Date().toISOString(), lastResult: lines });
  return lines;
}
