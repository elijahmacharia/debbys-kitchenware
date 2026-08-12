'use client';

import { useEffect, useState } from 'react';
import { RefreshIcon } from '@/components/icons';

/**
 * Registers the service worker and surfaces updates.
 *
 * Two deliberate choices:
 *  - Registration waits for the `load` event so it never competes with the
 *    first render for bandwidth.
 *  - A new version is never activated automatically. Swapping the worker
 *    mid-session can reload the page while someone is filling in checkout, so
 *    the customer is offered an Update button and decides when.
 *
 * The site behaves exactly the same if this component does nothing — the
 * service worker is an enhancement, never a requirement.
 */
export function ServiceWorkerManager() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // A service worker registered in dev would cache the dev bundle and cause
    // very confusing stale-code bugs.
    if (process.env.NODE_ENV !== 'production') return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        if (registration.waiting) setWaitingWorker(registration.waiting);

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            // "installed" with an existing controller means a newer version is
            // ready while the old one is still running the page.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installing);
            }
          });
        });
      } catch (error) {
        console.error('[pwa] service worker registration failed', error);
      }
    };

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  if (!waitingWorker || dismissed) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[65] mx-auto max-w-sm animate-slide-up rounded-card border border-line bg-surface p-3.5 shadow-pop sm:left-auto sm:right-6">
      <p className="text-sm font-semibold text-ink">A new version is available</p>
      <p className="mt-0.5 text-xs text-muted">Update to get the latest products and fixes.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => waitingWorker.postMessage({ type: 'SKIP_WAITING' })} className="btn-primary btn-sm flex-1">
          <RefreshIcon className="h-4 w-4" />
          Update
        </button>
        <button type="button" onClick={() => setDismissed(true)} className="btn-secondary btn-sm">Not now</button>
      </div>
    </div>
  );
}
