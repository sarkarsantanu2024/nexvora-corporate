/**
 * Dates. The business runs on India time, the server may not, so "today" is
 * always worked out in Asia/Kolkata. Days are 'YYYY-MM-DD', months 'YYYY-MM'.
 */
const IST = 'Asia/Kolkata';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Today in India, 'YYYY-MM-DD'. */
export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** This month in India, 'YYYY-MM'. */
export const currentPeriod = (now: Date = new Date()) => todayIST(now).slice(0, 7);

export const periodOf = (day: string) => day.slice(0, 7);

/** '2026-11' → 'Nov 2026' */
export function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** '2026-11' + 2 → '2027-01' */
export function addMonths(period: string, n: number): string {
  const [y, m] = period.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/** The last `n` months, oldest first, ending with `end` (default: this month). */
export function lastPeriods(n: number, end: string = currentPeriod()): string[] {
  return Array.from({ length: n }, (_, i) => addMonths(end, i - (n - 1)));
}

/** First and last day of a month. */
export function periodRange(period: string): { from: string; to: string } {
  const [y, m] = period.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${period}-01`, to: `${period}-${String(last).padStart(2, '0')}` };
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** '2026-11-15' → '15 Nov 2026'. Empty string for null. */
export function formatDate(day: string | null | undefined): string {
  if (!day) return '';
  const [y, m, d] = day.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** A timestamp → '15 Nov 2026, 4:05 pm' in India time. */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

/** 0 = Sunday … 6 = Saturday */
export const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();

/** Financial year label for a day: April 2026 to March 2027 → '26-27'. */
export function financialYear(day: string = todayIST()): string {
  const [y, m] = day.split('-').map(Number);
  const start = m >= 4 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

/** Age on a given day as "3 yrs 4 mos". */
export function ageLabel(dob: string | null | undefined, on: string = todayIST()): string {
  if (!dob) return '';
  const [y1, m1, d1] = dob.split('-').map(Number);
  const [y2, m2, d2] = on.split('-').map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  if (months < 0) months = 0;
  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  if (!yrs) return `${mos} mo${mos === 1 ? '' : 's'}`;
  return `${yrs} yr${yrs > 1 ? 's' : ''}${mos ? ` ${mos} mo${mos > 1 ? 's' : ''}` : ''}`;
}
