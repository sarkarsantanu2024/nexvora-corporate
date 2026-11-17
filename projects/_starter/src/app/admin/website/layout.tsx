/**
 * Every website-editing screen gets the voice assistant: the mic floats over
 * the page and can change any section, whichever screen is open.
 */
import type { ReactNode } from 'react';
import { SECTIONS } from '@/cms/sections';
import type { SectionDef } from '@/cms/types';
import { VoiceAssistant } from '@/components/cms/voice-assistant';
import { VoiceBridgeProvider } from '@/components/cms/voice-bridge';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { buildCatalogue } from '@/voice/catalogue';

export default async function WebsiteLayout({ children }: { children: ReactNode }) {
  await requireSession(TEAM_ROLES);
  return (
    <VoiceBridgeProvider>
      {children}
      <VoiceAssistant catalogue={buildCatalogue(SECTIONS as SectionDef[])} freeForm={Boolean(process.env.ANTHROPIC_API_KEY)} />
    </VoiceBridgeProvider>
  );
}
