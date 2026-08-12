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
      className="fixed bottom-4 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-whatsapp pl-4 pr-5 font-semibold text-white shadow-pop transition hover:brightness-95 sm:bottom-6 sm:right-6"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden text-sm sm:inline">WhatsApp</span>
    </a>
  );
}
