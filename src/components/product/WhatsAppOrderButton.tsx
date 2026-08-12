'use client';

import { WhatsAppIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

/** Records the click, then follows the link normally. */
export function WhatsAppOrderButton({
  href, label = 'Order on WhatsApp', size = 'md', fullWidth, className, source,
}: {
  href: string | null;
  label?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
  source: string;
}) {
  // No number configured means no button, rather than a link that goes nowhere.
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        void fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'WHATSAPP_CLICK', label: source }),
        }).catch(() => undefined);
      }}
      className={cn('btn-whatsapp', size === 'sm' && 'btn-sm', fullWidth && 'w-full', className)}
    >
      <WhatsAppIcon className="h-4 w-4" />
      {label}
    </a>
  );
}
