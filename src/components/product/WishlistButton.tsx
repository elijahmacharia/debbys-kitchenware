'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HeartFilledIcon, HeartIcon } from '@/components/icons';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

/**
 * Wishlist toggle.
 *
 * A wishlist has to persist, which means it has to belong to an account — a
 * signed-out customer is sent to sign in with a `next` parameter so they come
 * straight back to the product they were looking at.
 *
 * The heart flips immediately and rolls back if the request fails, so the
 * button feels instant without ever lying about what was saved.
 */
export function WishlistButton({
  productId, productName, isSignedIn, initiallySaved = false, variant = 'icon', returnTo,
}: {
  productId: string;
  productName: string;
  isSignedIn: boolean;
  initiallySaved?: boolean;
  variant?: 'icon' | 'full';
  returnTo?: string;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setSaved(initiallySaved), [initiallySaved]);

  const toggle = async () => {
    if (!isSignedIn) {
      const next = returnTo ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
      router.push(`/login?next=${encodeURIComponent(next)}&reason=wishlist`);
      return;
    }
    const optimistic = !saved;
    setSaved(optimistic);
    setBusy(true);
    try {
      const response = await fetch('/api/wishlist', {
        method: optimistic ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error('request failed');
      push(optimistic ? `${productName} saved to your wishlist` : `${productName} removed from wishlist`);
      /*
       * Only the wishlist page itself needs re-rendering, because removing an
       * item there must make the card disappear. Everywhere else the heart has
       * already flipped locally, and refreshing would re-run every query on the
       * page for no visible gain — which made tapping a heart on a product grid
       * feel sluggish.
       */
      if (pathname.startsWith('/account/wishlist')) router.refresh();
    } catch {
      setSaved(!optimistic);
      push('We could not update your wishlist. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const Icon = saved ? HeartFilledIcon : HeartIcon;
  const label = saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`;

  if (variant === 'full') {
    return (
      <button type="button" onClick={toggle} disabled={busy} className={cn('btn-secondary', saved && 'border-clay-300 bg-clay-50 text-ink')} aria-pressed={saved}>
        <Icon className="h-4 w-4" />
        {saved ? 'Saved to wishlist' : 'Save to wishlist'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full border bg-surface/95 backdrop-blur transition',
        saved ? 'border-clay-300 text-clay-700' : 'border-line text-muted hover:text-clay-700',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
