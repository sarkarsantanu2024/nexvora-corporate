/**
 * One wrapper for every public form endpoint: rate limit, honeypot,
 * validation and saving, with every message in the visitor's language.
 *
 * It sits on top of handle() from lib/api, which already turns a failed
 * validation into { ok: false, fields }. The only thing added here is that
 * the general messages (too many requests, something went wrong) are also
 * translated, since handle() knows English only.
 */
import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { getDict } from '@/components/site/i18n';
import { handle, ok } from '@/lib/api';
import type { Lang } from '@/lib/i18n';
import { bodyLang, isBot } from './enquiries';
import { overLimit } from './rate-limit';

export function publicForm<S extends ZodTypeAny>(form: string, schema: (lang: Lang) => S, save: (input: z.infer<S>) => Promise<unknown>) {
  return handle(async (req) => {
    const body: unknown = await req.json().catch(() => null);
    const lang = bodyLang(body);
    const e = getDict(lang).errors;

    if (overLimit(req, form)) return NextResponse.json({ ok: false, error: e.tooMany }, { status: 429 });

    let input: z.infer<S>;
    try {
      input = schema(lang).parse(body ?? {});
    } catch (error) {
      if (!(error instanceof ZodError)) throw error;
      const fields: Record<string, string> = {};
      for (const issue of error.issues) fields[issue.path.join('.') || '_'] ??= issue.message;
      return NextResponse.json({ ok: false, error: e.check, fields }, { status: 422 });
    }

    if (isBot(input as { website?: string })) return ok({ received: true });
    try {
      await save(input);
    } catch (error) {
      console.error('[public form]', form, error);
      return NextResponse.json({ ok: false, error: e.generic }, { status: 500 });
    }
    return ok({ received: true }, { status: 201 });
  });
}
