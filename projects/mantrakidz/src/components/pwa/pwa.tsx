'use client';

/**
 * The "app" side of the dashboard: installing it on a phone or laptop,
 * knowing when the internet is gone, and the thin bar that shows a screen is
 * loading. None of it is specific to one client.
 */
import { Download, Share, SquarePlus, WifiOff } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { BRAND } from '@/config/brand';
import { rich } from '@/i18n/rich';
import { Modal } from '../ui/client';
import { useT } from '../ui/lang';

/** Chrome's "this site can be installed" event; not in the standard types. */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

type Pwa = {
  /** Already opened from the home screen. */
  installed: boolean;
  /** The browser offers a one-tap install (Android, Chrome and Edge on a laptop). */
  canPrompt: boolean;
  /** iPhone and iPad: installing is done by hand from the Share menu. */
  ios: boolean;
  online: boolean;
  install: () => Promise<void>;
};

const PwaContext = createContext<Pwa>({ installed: false, canPrompt: false, ios: false, online: true, install: async () => {} });
export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [online, setOnline] = useState(true);
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    // Only on the real site: in development a service worker serves stale files.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const standalone = window.matchMedia('(display-mode: standalone)');
    const readInstalled = () => setInstalled(standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    readInstalled();
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setOnline(navigator.onLine);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      setEvent(null);
      setInstalled(true);
    };
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    standalone.addEventListener('change', readInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      standalone.removeEventListener('change', readInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice.catch(() => null);
    setEvent(null);
  }, [event]);

  return <PwaContext.Provider value={{ installed, canPrompt: Boolean(event), ios, online, install }}>{children}</PwaContext.Provider>;
}

/**
 * "Install app" for a menu. Shows nothing once the app is installed, or in a
 * browser that cannot install it.
 */
export function InstallApp({ className, iconSize = 17 }: { className?: string; iconSize?: number }) {
  const { installed, canPrompt, ios, install } = usePwa();
  const [help, setHelp] = useState(false);
  const t = useT();
  if (installed || (!canPrompt && !ios)) return null;
  return (
    <>
      <button type="button" className={className} onClick={() => (canPrompt ? void install() : setHelp(true))}>
        <Download size={iconSize} /> {t('Install app')}
      </button>
      <Modal open={help} onClose={() => setHelp(false)} title={t('Put {shortName} on your home screen', { shortName: BRAND.shortName })} size="sm">
        <ol className="space-y-4 text-[15px] text-ink-700">
          <li className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Share size={18} />
            </span>
            <span>
              {rich(t('In Safari, tap the {share} button at the bottom of the screen.'), { share: <strong>Share</strong> })}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <SquarePlus size={18} />
            </span>
            <span>
              {rich(t('Scroll down and tap {first}, then {second}.'), { first: <strong>Add to Home Screen</strong>, second: <strong>Add</strong> })}
            </span>
          </li>
        </ol>
        <p className="mt-4 text-sm text-ink-500">{t('After that, open it from the icon like any other app.')}</p>
      </Modal>
    </>
  );
}

/** A strip under the top bar while the phone has no internet. */
export function OfflineBar() {
  const { online } = usePwa();
  const t = useT();
  if (online) return null;
  return (
    <div role="status" className="no-print flex animate-fade-in items-center justify-center gap-2 bg-ink-900 px-4 py-2 text-sm font-medium text-white">
      <WifiOff size={16} /> {t('No internet. Screens will load again when you are back online.')}
    </div>
  );
}

/**
 * A thin bar across the top while the next screen loads, the way an app shows
 * it is busy. It starts when a link inside the dashboard is tapped and ends
 * when the address has changed.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      window.clearTimeout(timer.current);
      setState('loading');
      // A link that never changes the address (a file, a cancelled move) must not leave the bar up.
      timer.current = window.setTimeout(() => setState('idle'), 12000);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    setState((current) => (current === 'loading' ? 'done' : current));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 350);
    return () => window.clearTimeout(timer.current);
  }, [pathname, search]);

  if (state === 'idle') return null;
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div className={state === 'loading' ? 'route-bar route-bar-loading' : 'route-bar route-bar-done'} />
    </div>
  );
}
