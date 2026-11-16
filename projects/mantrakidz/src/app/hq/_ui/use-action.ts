'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/client';
import type { ActionResult } from '@/lib/api';

/**
 * Runs a server action from a form: tracks "saving", keeps the field errors
 * for showing under each field, toasts the outcome and refreshes the screen.
 *
 *   const save = useAction(saveThingAction, { success: 'Saved', onDone: close });
 *   <LoadingButton loading={save.busy} onClick={() => save.run(input)} />
 *   <Field error={save.fields.name} />
 */
export function useAction<A extends unknown[], T>(
  fn: (...args: A) => Promise<ActionResult<T>>,
  options: { success?: string | ((data: T) => string); onDone?: (data: T) => void } = {},
) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const { success, onDone } = options;

  const run = useCallback(
    async (...args: A): Promise<boolean> => {
      setBusy(true);
      setFields({});
      try {
        const result = await fn(...args);
        if (!result.ok) {
          setFields(result.fields ?? {});
          toast.error(result.error);
          return false;
        }
        if (success) toast.success(typeof success === 'function' ? success(result.data) : success);
        onDone?.(result.data);
        router.refresh();
        return true;
      } catch {
        toast.error('Could not reach the server. Check the connection and try again.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [fn, onDone, router, success, toast],
  );

  return { run, busy, fields, clearFields: () => setFields({}) };
}

/** Form state as a plain object with a typed setter per key. */
export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const set = <K extends keyof T>(key: K, value: T[K]) => setValues((current) => ({ ...current, [key]: value }));
  return { values, set, reset: (next: T = initial) => setValues(next) };
}
