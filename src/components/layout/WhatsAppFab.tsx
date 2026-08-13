'use client';

import { usePathname } from 'next/navigation';
import { WhatsAppIcon } from '@/components/icons';

/**
 * Floating WhatsApp button.
 *
 * Hidden on the checkout page, where a large green button that navigates away
 * mid-form costs orders. It renders nothing at all if no WhatsApp number is
 * configured, rather than a button that goes nowhere.
 */
export function WhatsAppFab({ href }: { href: string | null }) {
  const pathname = usePathname();
  if (!href) return null;
  if (pathname.startsWith('/checkout')) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        void fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'WHATSAPP_CLICK', label: 'fab' }),
        }).catch(() => undefined);
      }}
      className="fixed bottom-24 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-whatsapp text-white shadow-pop transition active:scale-95 hover:brightness-95 lg:bottom-6 lg:right-6 lg:h-14 lg:w-14"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}
