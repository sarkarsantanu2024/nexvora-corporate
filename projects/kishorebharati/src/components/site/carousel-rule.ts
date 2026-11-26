/**
 * When the home banner moves on, as a pure rule (tested in tests/site-school.test.ts):
 * a photo moves on when its time is up; a video moves on only when it ends,
 * never while it plays. (The visitor can always press next or swipe.)
 */
export type SlideKind = 'image' | 'youtube' | 'mp4';

export function advanceOn(kind: SlideKind, event: 'timer' | 'ended'): boolean {
  return kind === 'image' ? event === 'timer' : event === 'ended';
}
