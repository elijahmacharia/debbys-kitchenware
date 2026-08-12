import type { Metadata } from 'next';
import { OfflineActions } from '@/components/pwa/OfflineActions';
import { WifiOffIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/**
 * Served by the service worker when a page request fails and nothing suitable
 * is cached. It is deliberately plain and honest: it never suggests an order
 * went through, because offline means the server was never reached.
 */
export default function OfflinePage() {
  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-canvas text-subtle">
          <WifiOffIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-5">You&apos;re offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Please reconnect to the internet to browse the latest products and place an order. Anything
          already in your cart is saved on this device and will still be here.
        </p>
        <OfflineActions />
        <p className="mt-6 text-xs text-muted">
          If you were placing an order when the connection dropped, it was not received. Please try again
          once you are back online.
        </p>
      </div>
    </div>
  );
}
