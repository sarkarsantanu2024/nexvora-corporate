/**
 * Laying saved content over a section's defaults. Kept apart from
 * src/cms/content.ts (which needs a live request) so the edit panel's
 * services and their tests can use it.
 */
import type { ContentData, SectionDef } from '@/cms/types';

/** Defaults with the saved values on top. Unknown saved keys are dropped. */
export function mergeContent<T extends ContentData>(def: SectionDef<T>, saved: ContentData | null | undefined): T {
  const out: ContentData = { ...def.defaults };
  if (saved) {
    for (const field of def.fields) {
      const value = saved[field.name];
      if (value === undefined || value === null) continue;
      if (field.type === 'list') {
        if (Array.isArray(value)) out[field.name] = value;
      } else if (typeof value === 'string') {
        out[field.name] = value;
      }
    }
    if (typeof saved._hidden === 'string') out._hidden = saved._hidden;
  }
  return out as T;
}
