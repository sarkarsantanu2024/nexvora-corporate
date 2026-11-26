/**
 * The dark cover the intro starts on, written into the very first bytes of
 * the page (root layout), so a first-time visitor to the home page never
 * sees the website before the Headmaster's portrait. The intro itself
 * (intro-loader.tsx) takes it away the moment its own overlay is up.
 *
 * A tiny inline script switches it off at once everywhere else: any page that
 * is not the home page, a visitor who has already seen the intro this session
 * (unless the address has ?intro=1), and the dashboards. It does this with a
 * class on <html> (the root layout's <html> carries suppressHydrationWarning),
 * never by removing the element, so React's hydration is not disturbed. If
 * scripts do not run at all, CSS fades the cover out after a few seconds.
 *
 * Server component; no client JavaScript beyond the inline script.
 */
export const INTRO_KEY = 'kb-intro-seen';
export const INTRO_COVER_ID = 'kb-intro-cover';
/** On <html>: the cover is not wanted (not the home page, seen already, or the intro has taken over). */
const OFF = 'kb-intro-off';
/** On <html> while the cover or the intro is up: the page underneath must not scroll. */
const LOCK = 'kb-intro-lock';

const SCRIPT = `try{var h=document.documentElement;var p=location.pathname.replace(/\\/$/,'')||'/';var home=p==='/'||p==='/en';var seen=sessionStorage.getItem('${INTRO_KEY}')==='1'&&location.search.indexOf('intro=')<0;h.classList.add(!home||seen?'${OFF}':'${LOCK}')}catch(e){document.documentElement.classList.add('${OFF}')}`;

/** Above everything on the site, including the sticky header and the floating buttons. */
export const INTRO_Z = 2147483000;

export function IntroCover() {
  return (
    <>
      <style>{`.${OFF} #${INTRO_COVER_ID}{display:none}.${LOCK}{overflow:hidden}@keyframes kb-cover-out{to{opacity:0;visibility:hidden}}.kb-dotfield::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(circle,rgba(248,240,217,.8) 1.1px,transparent 1.8px);background-size:13px 13px;-webkit-mask-image:radial-gradient(ellipse 24% 34% at 50% 42%,#000 12%,transparent 72%);mask-image:radial-gradient(ellipse 24% 34% at 50% 42%,#000 12%,transparent 72%);animation:kb-dots 2.4s ease-in-out infinite;transition:opacity .8s}.kb-dotfield::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 42%,rgba(255,214,102,.12) 50%,transparent 58%);background-size:260% 100%;animation:kb-sheen 2.6s linear infinite;transition:opacity .8s}[data-scene=on].kb-dotfield::before,[data-scene=on].kb-dotfield::after{opacity:0}@keyframes kb-dots{0%,100%{opacity:.3;transform:scale(.98)}50%{opacity:.95;transform:scale(1.02)}}@keyframes kb-sheen{from{background-position:130% 0}to{background-position:-130% 0}}`}</style>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
      <div
        id={INTRO_COVER_ID}
        aria-hidden
        // kb-dotfield: a breathing field of dots, pure CSS, so the screen moves from the very first moment.
        className="kb-dotfield fixed inset-0 overflow-hidden bg-[#0b0f24]"
        // Safety net: if the intro never takes over (scripts blocked), get out of the way.
        style={{ zIndex: INTRO_Z, animation: 'kb-cover-out .5s ease 20s forwards' }}
      />
    </>
  );
}

/** The intro's own overlay is up (or it decided not to play): the first cover can go. */
export function removeIntroCover() {
  document.documentElement.classList.add(OFF);
}

/** The intro has finished: let the page scroll again. */
export function unlockIntroScroll() {
  document.documentElement.classList.remove(LOCK);
}
