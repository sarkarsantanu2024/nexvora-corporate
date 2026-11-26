'use client';

/**
 * Shared plumbing for the site's 3D pieces: should we draw at all, how much,
 * and when to stop.
 *
 *  - WebGL missing, or the browser refuses a context: the static picture stays.
 *  - Small screen or few CPU cores: fewer particles and a lower pixel ratio.
 *  - Off screen or tab hidden: no frames are drawn (the scene keeps its state).
 *  - Reduced motion: the scene still runs, only calmer. The owner reads a
 *    scene that stops as a broken page.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

let webgl: boolean | null = null;
export function hasWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const canvas = document.createElement('canvas');
    webgl = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webgl = false;
  }
  return webgl;
}

/** True on a small screen or a device with four cores or fewer. */
export function isLightDevice(): boolean {
  const cores = navigator.hardwareConcurrency || 4;
  return window.innerWidth < 768 || cores <= 4;
}

/** True while the element is (nearly) on screen and the tab is visible. */
export function useActive(ref: RefObject<HTMLElement | null>, margin = '120px'): boolean {
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    const onVis = () => setVisible(!document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [ref, margin]);
  return seen && visible;
}

/** The phone or computer asked for less motion. Read live, so changing the setting applies at once. */
export function useCalm(): boolean {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setCalm(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return calm;
}

/** Decided once in the browser: may this device draw the scene, and should it be the light version? */
export function useCapability() {
  const [state, setState] = useState<{ ok: boolean; light: boolean } | null>(null);
  useEffect(() => {
    setState({ ok: hasWebGL(), light: isLightDevice() });
  }, []);
  return state;
}

/** Pointer position over an element, -1..1, written to a ref (no re-render per move). Mouse and touch both count. */
export function usePointer(ref: RefObject<HTMLElement | null>) {
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      pointer.current.x = Math.max(-1, Math.min(1, ((e.clientX - box.left) / box.width) * 2 - 1));
      pointer.current.y = Math.max(-1, Math.min(1, ((e.clientY - box.top) / box.height) * 2 - 1));
    };
    const onLeave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref]);
  return pointer;
}

/** How far an element has moved up past the top of the window, 0 (in place) to 1 (gone), in a ref. */
export function useScrollOut(ref: RefObject<HTMLElement | null>) {
  const out = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      out.current = Math.max(0, Math.min(1, -box.top / Math.max(1, box.height)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref]);
  return out;
}

/** Progress of the window through a tall element: 0 when its top reaches the top of the window, 1 when its bottom reaches the bottom. */
export function useScrollThrough(ref: RefObject<HTMLElement | null>) {
  const progress = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const room = Math.max(1, box.height - window.innerHeight);
      progress.current = Math.max(0, Math.min(1, -box.top / room));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);
  return progress;
}
