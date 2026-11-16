/**
 * POST { alternatives: string[] } → what a free-form sentence means, as an Intent.
 *
 * Only used when the built-in grammar could not place the sentence, and only
 * does anything when ANTHROPIC_API_KEY is set. Head office only. The answer is
 * a suggestion: the assistant shows it for confirmation like any other.
 */
import { z } from 'zod';
import { SECTIONS } from '@/cms/sections';
import type { SectionDef } from '@/cms/types';
import { ApiError, handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { buildCatalogue } from '@/voice/catalogue';
import { allowInterpret, interpretWithClaude, voiceFallbackEnabled } from '@/voice/interpret';

export const runtime = 'nodejs';

const input = z.object({ alternatives: z.array(z.string().trim().min(1).max(400)).min(1).max(5) });

export const POST = handle(async (req) => {
  const session = await apiSession(HQ_ROLES);
  if (!voiceFallbackEnabled()) return ok({ enabled: false, intent: null });
  const { alternatives } = input.parse(await req.json().catch(() => ({})));
  if (!allowInterpret(session.uid)) throw new ApiError(429, 'That is a lot of commands in a short time. Wait a minute, or use the form.');
  const outcome = await interpretWithClaude(alternatives.slice(0, 3), buildCatalogue(SECTIONS as SectionDef[]));
  return ok({ enabled: true, intent: outcome.intent, problem: outcome.problem ?? null });
});
