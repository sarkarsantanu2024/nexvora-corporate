'use client';

/**
 * The two sounds the microphone makes: one when it starts hearing you, one when
 * it stops.
 *
 * Ported from Halkhata, where it was learnt the hard way: when the mic's state
 * is only written on the screen, people talk to a button that is not
 * listening, nothing happens, and they conclude voice does not work. An audio
 * feature has to answer in audio.
 *
 * Rising for start, falling for stop, because that is the direction every
 * device on earth already uses and nobody has to be taught it.
 *
 * Deliberately synthesised rather than shipped as two audio files: it is a few
 * lines of oscillator against ~10 KB of MP3 that would have to be decoded, and
 * this runs on ordinary Android phones on a patchy connection.
 */

/**
 * One AudioContext for the life of the page.
 *
 * Browsers cap how many a document may create : Chrome stops granting them
 * somewhere around six : so a fresh one per beep would leave a mic silent after
 * a few minutes of ordinary use, which is precisely the failure this is meant
 * to prevent.
 */
let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  try {
    if (!context) context = new Ctor();
    // Created before the first gesture, a context starts suspended and stays
    // that way. Every cue follows a tap, so this always has permission to run.
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

/**
 * A short tone sliding from one pitch to another.
 *
 * The gain envelope is the point: an oscillator switched on and off squarely
 * clicks, and on a phone speaker a click sounds like a fault rather than a
 * cue. Ramping up over 15ms and down to near-silence removes it.
 *
 * Never throws. A phone with audio unavailable should lose the beep and keep
 * the microphone, so every failure here is swallowed.
 */
function tone(fromHz: number, toHz: number, seconds: number) {
  const ctx = audioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    // A sine is the least harsh thing a small speaker can make, and this plays
    // a few inches from someone's ear across a counter.
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(fromHz, now);
    oscillator.frequency.linearRampToValueAtTime(toHz, now + seconds);

    // 0.0001 rather than 0 : an exponential ramp cannot reach zero.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + seconds);
  } catch {
    /* No audio on this device. The mic still works. */
  }
}

/** Rising : the mic is now listening. */
export function cueStart() {
  tone(660, 990, 0.12);
}

/** Falling : the mic has stopped. */
export function cueStop() {
  tone(880, 520, 0.16);
}

/** Two quick rising notes: the change was applied. */
export function cueDone() {
  tone(740, 740, 0.07);
  window.setTimeout(() => tone(1110, 1110, 0.1), 80);
}
