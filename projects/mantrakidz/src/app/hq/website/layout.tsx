/**
 * Every website-editing screen gets the voice assistant: the mic floats over
 * the page and can change any section, whichever screen is open.
 */
import type { ReactNode } from 'react';
import { SECTIONS } from '@/cms/sections';
import type { SectionDef } from '@/cms/types';
import { VoiceAssistant } from '@/components/cms/voice-assistant';
import { VoiceBridgeProvider } from '@/components/cms/voice-bridge';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { requirePlan } from '@/server/platform';
import { buildCatalogue } from '@/voice/catalogue';

export default async function WebsiteLayout({ children }: { children: ReactNode }) {
  await requireSession(HQ_ROLES);
  // The edit panel is part of the "panel" plan and above.
  await requirePlan('panel');
  return (
    <VoiceBridgeProvider>
      {children}
      <VoiceAssistant catalogue={buildCatalogue(SECTIONS as SectionDef[])} freeForm={Boolean(process.env.ANTHROPIC_API_KEY)} />
    </VoiceBridgeProvider>
  );
}
