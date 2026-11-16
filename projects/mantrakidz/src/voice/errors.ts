import type { VoiceErrorCode } from './useVoice';

/**
 * Why the microphone is not running, and what the person holding the phone
 * can do about it. Each message names the cause AND the remedy, because none
 * of these are things the server can put right.
 */
export const VOICE_ERRORS: Record<VoiceErrorCode, string> = {
  'insecure-context': 'Voice needs a secure address (https). It works on the live site and on localhost, not on an http:// address.',
  'not-allowed': 'The microphone is blocked. Allow it for this site in the browser (the lock icon beside the address), then tap the mic again.',
  'service-not-allowed': 'This browser refused speech recognition although the mic is allowed. A work profile often does this: try a personal profile, or Edge.',
  'no-microphone': 'No microphone found. Plug one in, or use a phone.',
  network: 'Voice needs the internet: the browser sends the sound away to be written down. Check the connection and tap the mic again.',
  unknown: 'Voice stopped unexpectedly. Tap the mic to try again.',
};

/** One line for the switched-off mic where the browser has no speech recognition. */
export const UNSUPPORTED = 'Voice works in Chrome, Edge and recent Safari. In this browser, type the command instead.';
