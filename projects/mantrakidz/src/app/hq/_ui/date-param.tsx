'use client';

import { useUrlParam } from '@/components/ui/client';

/**
 * A date bound to a query parameter that shows the date the page is really
 * using, even when the URL has none yet (the shared UrlDate would show blank).
 */
export function DateParam({ param, value, label, max }: { param: string; value: string; label: string; max?: string }) {
  const { set } = useUrlParam();
  return <input type="date" aria-label={label} title={label} value={value} max={max} onChange={(e) => set(param, e.target.value)} className="control w-auto" />;
}
