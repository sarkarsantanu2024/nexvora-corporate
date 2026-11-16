'use client';

/**
 * The microphone and the speaker, as one hook. Ported from Halkhata (the same
 * owner's shop app), where every odd corner below was found on real phones.
 *
 *   SpeechRecognition : mic in  (Chrome, Edge, Android Chrome, recent Safari)
 *   speechSynthesis   : speaker out
 *
 * Both are vendor-prefixed on WebKit and missing on Firefox, so `supported`
 * is exposed and the mic is shown switched off with a reason where it is false.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { cueStart, cueStop } from './cue';
import type { VoiceLang } from './intent';

// The DOM lib has no SpeechRecognition types; only the parts used are declared.
type RecognitionAlternative = { transcript: string };
type RecognitionResult = ArrayLike<RecognitionAlternative> & { isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error?: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
};
type RecognitionCtor = new () => SpeechRecognitionLike;

/**
 * How long the recogniser may go without any sign of life before it is torn
 * down and rebuilt. Chrome ends a session by itself well inside a minute of
 * silence and `onend` restarts it, so a healthy session touches `lastEventRef`
 * every few seconds whether or not anybody is talking. Ninety seconds of
 * nothing is Chrome's speech service having gone away without saying so.
 */
const SILENT_LIMIT_MS = 90_000;
const WATCHDOG_MS = 15_000;

/**
 * How long the mic stays on with nobody talking into it. A mic that pulses
 * forever over an open microphone is either a privacy problem or a lie about
 * a recogniser that has stopped hearing. Measured from the last sign of a
 * human voice (`heardRef`), not from the last API event, which the silence
 * restart cycle touches every few seconds.
 */
const IDLE_STOP_MS = 9_000;
const IDLE_CHECK_MS = 500;

/** Long enough for Chrome to finish tearing a session down before the next. */
const RESTART_DELAY_MS = 250;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceState = 'idle' | 'listening' | 'denied' | 'error';

/**
 * Why the mic is not running. Chrome folds several different causes into one
 * `not-allowed`, so they are told apart here: "you blocked the mic" and "this
 * browser cannot reach the speech service" need different fixes.
 */
export type VoiceErrorCode = 'insecure-context' | 'not-allowed' | 'service-not-allowed' | 'no-microphone' | 'network' | 'unknown';

export type UseVoiceOptions = {
  lang: VoiceLang;
  /** Silence after which the mic turns itself off; 0 keeps it on until tapped. */
  idleStopMs?: number;
  /**
   * Called once per finished sentence with the recogniser's ranked guesses,
   * best first. Try them all: on an unclear speaker the top guess is often
   * wrong where the second or third is exactly right.
   */
  onPhrase: (alternatives: string[]) => void;
};

export function useVoice({ lang, onPhrase, idleStopMs = IDLE_STOP_MS }: UseVoiceOptions) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<VoiceState>('idle');
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);
  const [interim, setInterim] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // The recogniser stops itself after a pause; `wantedRef` tells onend whether
  // that was the person tapping stop or just silence, so it can restart.
  const wantedRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  /** When this recogniser last showed any sign of life. See SILENT_LIMIT_MS. */
  const lastEventRef = useRef(0);
  /** When a human was last heard. See IDLE_STOP_MS. */
  const heardRef = useRef(0);
  const onPhraseRef = useRef(onPhrase);
  onPhraseRef.current = onPhrase;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    setSupported(recognitionCtor() !== null);
  }, []);

  const cancelRestart = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  /**
   * Takes a recogniser out of service for good.
   *
   * Unhooking the handlers BEFORE aborting is the whole point. `abort()` makes
   * Chrome fire `onend` on the next tick, by which time a replacement has been
   * built and `wantedRef` is true again, so the dead recogniser's own `onend`
   * would restart ITSELF. Two recognisers then share one microphone and take
   * turns aborting each other: the button says Listening and nothing is heard.
   */
  const retire = useCallback((recognition: SpeechRecognitionLike | null) => {
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    recognition.onspeechstart = null;
    try {
      recognition.abort();
    } catch {
      /* already gone */
    }
  }, []);

  const stop = useCallback(() => {
    wantedRef.current = false;
    cancelRestart();
    const current = recognitionRef.current;
    recognitionRef.current = null;
    retire(current);
    setState('idle');
    setInterim('');
  }, [cancelRestart, retire]);

  // `onend` may need to rebuild the session, and it closes over `launch`
  // before `launch` exists. A ref is the way round that ordering.
  const launchRef = useRef<(() => void) | null>(null);

  /**
   * Builds a recogniser and starts it, replacing whatever was running. Apart
   * from `start` so the watchdog and the restart timer can rebuild the session
   * without going back through the permission prompt.
   */
  const launch = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    cancelRestart();
    const previous = recognitionRef.current;
    recognitionRef.current = null;
    retire(previous);

    const recognition = new Ctor();
    recognition.lang = langRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    /** Ignore anything from an instance that has since been replaced. */
    const current = () => recognitionRef.current === recognition;
    const alive = () => {
      lastEventRef.current = Date.now();
    };
    /** Alive, AND it was a person rather than the session cycling. */
    const heard = () => {
      lastEventRef.current = Date.now();
      heardRef.current = Date.now();
    };

    recognition.onstart = alive;
    recognition.onspeechstart = heard;

    recognition.onresult = (event) => {
      if (!current()) return;
      heard();
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result.isFinal) {
          pending += String(result[0]?.transcript ?? '');
          continue;
        }
        const alternatives: string[] = [];
        for (let n = 0; n < result.length; n += 1) {
          const phrase = String(result[n]?.transcript ?? '').trim();
          if (phrase && !alternatives.includes(phrase)) alternatives.push(phrase);
        }
        if (alternatives.length > 0) onPhraseRef.current(alternatives);
      }
      setInterim(pending.trim());
    };

    recognition.onerror = (event) => {
      if (!current()) return;
      const code = String(event?.error ?? '');
      // "no-speech" and "aborted" are routine in a long session; onend restarts it.
      if (!code || code === 'no-speech' || code === 'aborted') {
        alive();
        return;
      }
      wantedRef.current = false;
      if (code === 'not-allowed') {
        setErrorCode('not-allowed');
        setState('denied');
      } else if (code === 'service-not-allowed') {
        // The mic permission is fine; the browser itself refused to run speech recognition.
        setErrorCode('service-not-allowed');
        setState('denied');
      } else if (code === 'network') {
        setErrorCode('network');
        setState('error');
      } else if (code === 'audio-capture') {
        // Permission granted and still nothing to listen to: no mic, or another app holds it.
        setErrorCode('no-microphone');
        setState('error');
      } else {
        setErrorCode('unknown');
        setState('error');
      }
    };

    recognition.onend = () => {
      if (!current()) return;
      alive();
      setInterim('');
      if (!wantedRef.current) {
        setState((now) => (now === 'listening' ? 'idle' : now));
        return;
      }
      // Chrome ended the session after a silence. Restart on a later tick:
      // calling start() from inside this handler throws InvalidStateError
      // while the old session is still tearing down.
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        if (!current() || !wantedRef.current) return;
        try {
          recognition.start();
          lastEventRef.current = Date.now();
        } catch {
          // Still not ready, or already running. A full rebuild is always safe.
          launchRef.current?.();
        }
      }, RESTART_DELAY_MS);
    };

    recognitionRef.current = recognition;
    wantedRef.current = true;
    lastEventRef.current = Date.now();
    // A fresh session is a fresh idle window.
    heardRef.current = Date.now();
    try {
      recognition.start();
      setState('listening');
    } catch {
      setErrorCode('unknown');
      setState('error');
    }
  }, [cancelRestart, retire]);
  launchRef.current = launch;

  const start = useCallback(async () => {
    if (!recognitionCtor()) return;
    setErrorCode(null);

    // http:// on a LAN address (a phone testing the dev server) is not a
    // secure context, and Chrome then refuses the mic with the same opaque
    // error as a real block. Say which one it is.
    if (!window.isSecureContext) {
      setErrorCode('insecure-context');
      setState('denied');
      return;
    }

    // Ask for the mic explicitly first. SpeechRecognition asks implicitly but
    // its refusal carries no reason; getUserMedia tells "said no" from "no
    // microphone", and it is what raises the permission prompt on first tap.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const name = (error as { name?: string })?.name;
      setErrorCode(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no-microphone' : 'not-allowed');
      setState('denied');
      return;
    }
    launch();
  }, [launch]);

  /**
   * The person's own tap, and the only place the beeps belong. `pause` and
   * `resume` below are the read-back cycle and the silence restart: a chirp
   * when the machine changes its own mind teaches nothing.
   */
  const toggle = useCallback(() => {
    if (state === 'listening') {
      cueStop();
      stop();
    } else {
      cueStart();
      void start();
    }
  }, [state, start, stop]);

  /** Mic off while the app speaks, so it does not hear itself; `resume` turns it back on. */
  const pause = useCallback(() => {
    if (!wantedRef.current) return false;
    cancelRestart();
    const current = recognitionRef.current;
    recognitionRef.current = null;
    retire(current);
    return true;
  }, [cancelRestart, retire]);

  const resume = useCallback(() => {
    if (wantedRef.current) launch();
  }, [launch]);

  // The recogniser that dies without saying so: checked from outside, rebuilt from scratch.
  useEffect(() => {
    if (state !== 'listening') return;
    const timer = window.setInterval(() => {
      if (!wantedRef.current || restartTimerRef.current !== null) return;
      if (Date.now() - lastEventRef.current < SILENT_LIMIT_MS) return;
      launch();
    }, WATCHDOG_MS);
    return () => window.clearInterval(timer);
  }, [state, launch]);

  // The mic nobody is talking into turns itself off. No beep: see `toggle`.
  useEffect(() => {
    if (state !== 'listening' || idleStopMs <= 0) return;
    const timer = window.setInterval(() => {
      if (!wantedRef.current || recognitionRef.current === null) return;
      if (Date.now() - heardRef.current < idleStopMs) return;
      stop();
    }, IDLE_CHECK_MS);
    return () => window.clearInterval(timer);
  }, [state, idleStopMs, stop]);

  // Never leave the mic on after the component goes away.
  useEffect(() => {
    return () => {
      wantedRef.current = false;
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
      const current = recognitionRef.current;
      recognitionRef.current = null;
      retire(current);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, [retire]);

  // A language change mid-session needs a fresh recogniser.
  useEffect(() => {
    if (wantedRef.current) launch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  /** Keeps the idle clock from running out while the person is reading a card. */
  const touch = useCallback(() => {
    heardRef.current = Date.now();
  }, []);

  return { supported, state, errorCode, interim, start, stop, toggle, pause, resume, touch, listening: state === 'listening' };
}

/**
 * Reads text out of the speaker, in the chosen language when the device has a
 * voice for it and not at all otherwise. `onDone` always fires, so a mic
 * paused for the reply is never left off.
 */
export function speak(text: string, lang: VoiceLang, onDone?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onDone?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  // Chrome loads the voice list late: the first getVoices() of a session is
  // usually empty, and anything spoken before `voiceschanged` got the default
  // voice (on Windows a US English one, reading Bengali letter by letter).
  const voices = synth.getVoices();
  if (voices.length === 0) {
    let retried = false;
    const retry = () => {
      if (retried) return;
      retried = true;
      synth.removeEventListener('voiceschanged', retry);
      if (synth.getVoices().length === 0) onDone?.();
      else speak(text, lang, onDone);
    };
    synth.addEventListener('voiceschanged', retry);
    // If the list never arrives, do not leave the caller waiting.
    window.setTimeout(retry, 1000);
    return;
  }

  // A voice that actually speaks the language, or silence. Hindi text in an
  // English voice is noise, and the same words are already on the screen.
  const exact = voices.find((voice) => voice.lang.replace('_', '-') === lang);
  const loose = voices.find((voice) => voice.lang.slice(0, 2) === lang.slice(0, 2));
  const chosen = exact ?? loose;
  if (!chosen) {
    onDone?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.05;
  utterance.voice = chosen;

  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    onDone?.();
  };
  utterance.onend = done;
  utterance.onerror = done;
  // Some Android builds drop `onend` when the tab loses focus mid-sentence.
  window.setTimeout(done, Math.min(1500 + text.length * 90, 8000));
  synth.speak(utterance);
}
