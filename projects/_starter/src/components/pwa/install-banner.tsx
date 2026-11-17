'use client';

/**
 * The "install this app" bar that drops down from the top of the screen, and
 * "send the app link on WhatsApp" for getting the app onto a phone.
 *
 * The bar is black with the logo on the left and Install on the right. It
 * shows to anyone who has not installed the app, on the login screen and in
 * the dashboards: it stays a few seconds, goes away, and comes back about
 * every 30 minutes until the person presses the cross.
 */
import { Download, MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { BRAND } from '@/config/brand';
import type { Role } from '@/db/schema';
import { waLink, waPhone } from '@/lib/wa';
import { Modal } from '../ui/client';
import { Button, Field, Input } from '../ui/core';
import { useT } from '../ui/lang';
import { usePwa } from './pwa';

/** How long the bar stays down before it goes away by itself. */
const STAY_MS = 15000;
/** About every 30 minutes, a little different each time so it does not feel like a clock. */
const nextGap = () => (25 + Math.random() * 10) * 60000;

/**
 * Whose app link a person may send, by their role. In the starter everyone
 * sends only their own: admin and staff both get 'self', and so does anybody
 * who is not logged in.
 *
 * A project with more kinds of user adds them here. Say it gets a customer
 * login: add 'customer' to Audience, list it for the roles that may send it
 * (admin: ['self', 'customer']), and give it a title, a line of text and a
 * message in CHOICES and MESSAGES below. The sheet then shows a "Which app"
 * list by itself. Add the new sentences to src/i18n/ui-hi.ts and ui-bn.ts.
 *
 * It is one app with one login screen; the role of the login decides which
 * side opens. So a "link" here is the login address plus the right words on
 * how to log in. The address is public: this rule is about not confusing
 * people with choices that are not theirs, not about secrecy.
 */
type Audience = 'self';
const AUDIENCES: Record<Role, Audience[]> = {
  admin: ['self'],
  staff: ['self'],
};

const appLink = (audience: Audience) => `${window.location.origin}/login?source=wa-${audience}`;

/**
 * Opens WhatsApp with a message to the number typed in, holding the app's
 * link. The person opens that chat on the phone, taps the link and installs
 * from there. Nothing is sent by the server and the number is not saved.
 */
export function SendToWhatsApp({ open, onClose, role }: { open: boolean; onClose: () => void; role?: Role }) {
  const t = useT();
  const audiences: Audience[] = role ? AUDIENCES[role] : ['self'];
  const [audience, setAudience] = useState<Audience>('self');
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');

  const CHOICES: Record<Audience, { title: string; text: string }> = {
    self: { title: t('My own phone'), text: t('Put the app on the phone you carry.') },
  };
  const MESSAGES: Record<Audience, string> = {
    self: t('{name} app. Open this link on your phone, log in, then tap Install:', { name: BRAND.name }),
  };

  const send = () => {
    if (!waPhone(number)) {
      setError(t('Enter a 10 digit mobile number'));
      return;
    }
    window.open(waLink(number, `${MESSAGES[audience]}\n${appLink(audience)}`), '_blank', 'noopener');
    setNumber('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={audiences.length > 1 ? t('Send the app link on WhatsApp') : t('Get the app on your phone')}
      description={t('WhatsApp opens with the app link, addressed to the number you type. The person opens that chat on the phone and taps the link.')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button variant="success" onClick={send}>
            <MessageCircle size={17} /> {t('Send on WhatsApp')}
          </Button>
        </>
      }
    >
      {audiences.length > 1 ? (
        <fieldset className="mb-4">
          <legend className="mb-1.5 text-sm font-semibold text-ink-800">{t('Which app')}</legend>
          <ul className="overflow-hidden rounded-xl border border-ink-200">
            {audiences.map((option) => {
              const checked = audience === option;
              return (
                <li key={option} className="border-b border-ink-100 last:border-b-0">
                  <label className={checked ? 'flex cursor-pointer items-start gap-3 bg-brand-50 px-3.5 py-3' : 'flex cursor-pointer items-start gap-3 px-3.5 py-3 active:bg-ink-50'}>
                    <input type="radio" name="app-audience" className="mt-1 h-4 w-4 accent-brand-700" checked={checked} onChange={() => setAudience(option)} />
                    <span>
                      <span className="block text-[15px] font-semibold text-ink-900">{CHOICES[option].title}</span>
                      <span className="block text-sm text-ink-500">{CHOICES[option].text}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}
      <Field label={audience === 'self' ? t('Your WhatsApp number') : t('Their WhatsApp number')} error={error}>
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete={audience === 'self' ? 'tel' : 'off'}
          placeholder="98300 12345"
          value={number}
          invalid={Boolean(error)}
          onChange={(event) => {
            setNumber(event.target.value);
            setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send();
          }}
        />
      </Field>
    </Modal>
  );
}

export function InstallBanner() {
  const { installed, canPrompt, ios, install } = usePwa();
  const t = useT();
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);

  // Down a moment after every load of the app, away by itself after a short
  // stay, and down again about every 30 minutes, until the app is installed
  // or the person presses the cross. Nothing is remembered between loads for
  // now: the bar shows again the next time the app is opened.
  const closed = useRef(false);
  useEffect(() => {
    if (installed) return;
    let timer: number;
    const plan = (wait: number) => {
      timer = window.setTimeout(() => {
        if (closed.current) return;
        setShow(true);
        timer = window.setTimeout(() => {
          setShow(false);
          plan(nextGap());
        }, STAY_MS);
      }, wait);
    };
    plan(1200);
    return () => window.clearTimeout(timer);
  }, [installed]);

  /** The cross: gone until the app is opened again. */
  const close = () => {
    closed.current = true;
    setShow(false);
  };
  /** Pushed up out of the way: gone for now, back at the next turn. */
  const tuck = () => setShow(false);

  const canInstall = canPrompt || ios;

  return (
    <>
      <AnimatePresence>
        {show && !installed ? (
          <motion.div
            role="region"
            aria-label={t('Install app')}
            className="no-print fixed inset-x-0 top-0 z-[65] px-2 pt-[calc(0.5rem+env(safe-area-inset-top))]"
            initial={{ y: '-120%' }}
            animate={{ y: 0 }}
            exit={{ y: '-120%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0.1 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -30) tuck();
            }}
          >
            <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl bg-black py-2.5 pl-3 pr-2 text-white shadow-lift">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white p-0.5">
                <Image src={BRAND.mark} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight">{BRAND.name}</p>
                <p className="truncate text-xs leading-tight text-white/70">{canInstall ? t('Install the app. It opens faster.') : t('Get the app on your phone')}</p>
              </div>
              <button
                type="button"
                aria-label={t('Send the link to my WhatsApp')}
                title={t('Send the link to my WhatsApp')}
                onClick={() => setWhatsapp(true)}
                className={canInstall ? 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 transition active:scale-90 hover:bg-white/25' : 'flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-bold text-black transition active:scale-95'}
              >
                <MessageCircle size={17} />
                {canInstall ? null : 'WhatsApp'}
              </button>
              {canInstall ? (
                <button
                  type="button"
                  onClick={() => {
                    if (canPrompt) void install().then(() => setShow(false));
                    else setIosHelp(true);
                  }}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-bold text-black transition active:scale-95"
                >
                  <Download size={16} /> {t('Install')}
                </button>
              ) : null}
              <button type="button" aria-label={t('Close')} onClick={close} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 transition active:scale-90 hover:bg-white/15 hover:text-white">
                <X size={17} />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <SendToWhatsApp open={whatsapp} onClose={() => setWhatsapp(false)} />

      <Modal open={iosHelp} onClose={() => setIosHelp(false)} size="sm" title={t('Install on iPhone')}>
        <ol className="list-decimal space-y-2 pl-5 text-[15px] text-ink-700">
          <li>{t('In Safari, tap the Share button at the bottom of the screen.')}</li>
          <li>{t('Scroll down and tap Add to Home Screen, then Add.')}</li>
        </ol>
      </Modal>
    </>
  );
}
