/**
 * Small helpers shared by route handlers and server actions.
 *
 * Route handler:
 *   export const POST = handle(async (req) => {
 *     const session = await apiSession(['admin']);
 *     const input = schema.parse(await req.json());
 *     return ok(await createThing(session, input));
 *   });
 *
 * Server action:
 *   export const saveThing = action(async (input: Input) => { …; return thing; });
 *   const result = await saveThing(input);   // { ok: true, data } | { ok: false, error }
 */
import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Throw from anywhere in a service to show the person a plain message. */
export const fail = (message: string, status = 400): never => {
  throw new ApiError(status, message);
};

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ ok: true, data }, init);

function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  return fields;
}

type Ctx = { params: Promise<Record<string, string>> };

export function handle(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      unstable_rethrow(error);
      if (error instanceof ApiError) {
        return NextResponse.json({ ok: false, error: error.message, fields: error.fields }, { status: error.status });
      }
      if (error instanceof ZodError) {
        return NextResponse.json(
          { ok: false, error: 'Please check the details and try again', fields: zodFields(error) },
          { status: 422 },
        );
      }
      console.error('[api]', req.method, new URL(req.url).pathname, error);
      return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  };
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

/** Wraps a server action so the screen always gets a result, never a thrown error. */
export function action<A extends unknown[], T>(fn: (...args: A) => Promise<T>) {
  return async (...args: A): Promise<ActionResult<T>> => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (error) {
      unstable_rethrow(error); // redirect() and notFound() must pass through
      if (error instanceof ApiError) return { ok: false, error: error.message, fields: error.fields };
      if (error instanceof ZodError) {
        return { ok: false, error: 'Please check the details and try again', fields: zodFields(error) };
      }
      console.error('[action]', error);
      return { ok: false, error: 'Something went wrong. Please try again.' };
    }
  };
}
