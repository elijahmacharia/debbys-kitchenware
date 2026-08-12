'use client';

import { useEffect, useState } from 'react';
import { DownloadIcon, ShareIcon, XIcon } from '@/components/icons';
import { business } from '@/lib/config';

/**
 * OPTIONAL app installation.
 *
 * Rules this component follows, deliberately:
 *  - It never blocks the page. It is a small dismissible card, never a modal
 *    or an interstitial, and the website is fully usable if it is ignored.
 *  - It appears only after the customer has had a chance to look around, never
 *    on the first paint.
 *  - "Maybe later" is remembered for 30 days.
 *  - If the app is already installed, or the browser cannot install it, the
 *    card is not rendered at all — no dead buttons.
 *  - iOS Safari exposes no install API, so those users get the actual
 *    Share > Add to Home Screen instructions instead of a button that would do
 *    nothing.
 */

const DISMISS_KEY = 'dk.pwa.dismissedUntil';
const DISMISS_DAYS = 30;
const SHOW_AFTER_MS = 25_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // Safari's own flag for a home-screen launch.
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

function dismissedRecently(): boolean {
  try {
    const until = window.localStorage.getItem(DISMISS_KEY);
    return Boolean(until && Number(until) > Date.now());
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    const onBeforeInstall = (event: Event) => {
      // Stop Chrome showing its own mini-infobar so we control the timing.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PWA_INSTALL' }),
      }).catch(() => undefined);
    };
    window.addEventListener('appinstalled', onInstalled);

    // iOS gets manual instructions, since there is no install event there.
    const iosTimer = isIos() ? window.setTimeout(() => { setShowIosHelp(true); setVisible(true); }, SHOW_AFTER_MS) : undefined;

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  useEffect(() => {
    if (!deferred) return;
    const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [deferred]);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
    } catch {
      /* private mode — it simply reappears next visit */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (outcome === 'dismissed') dismiss();
  };

  if (!visible) return null;

  return (
    <div
      role="complementary"
      aria-label="Install app"
      className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-md animate-slide-up rounded-card border border-line bg-surface p-4 shadow-pop sm:bottom-24 sm:left-auto sm:right-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-base font-bold text-white" aria-hidden="true">D</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Shop faster with {business.name}</p>
          {showIosHelp ? (
            <ol className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted">
              <li className="flex items-center gap-1.5">1. Tap <ShareIcon className="inline h-3.5 w-3.5" /> Share in Safari</li>
              <li>2. Choose <span className="font-medium text-ink">Add to Home Screen</span></li>
              <li>3. Tap <span className="font-medium text-ink">Add</span></li>
            </ol>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Install our app for quick access to products, orders and offers. You can keep using the
              website as normal.
            </p>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="-mr-1 -mt-1 rounded p-1.5 text-subtle hover:bg-canvas hover:text-ink">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        {!showIosHelp ? (
          <button type="button" onClick={install} className="btn-primary btn-sm flex-1">
            <DownloadIcon className="h-4 w-4" />
            Install app
          </button>
        ) : null}
        <button type="button" onClick={dismiss} className={showIosHelp ? 'btn-secondary btn-sm w-full' : 'btn-secondary btn-sm'}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
