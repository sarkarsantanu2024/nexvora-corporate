'use client';

/**
 * "Does this person want less animation?", safe to use while the page is
 * being drawn.
 *
 * The server cannot know the answer, so it always draws the animated
 * starting state. If the browser answered "yes" on its very first draw, the
 * two would disagree and React would throw the page away and redraw it (a
 * hydration error, seen on a Windows machine with animations switched off).
 * So the first draw always says "no", matching the server, and the real
 * answer arrives straight after.
 */
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduce;
}
