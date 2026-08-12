'use client';

import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { CartIcon } from '@/components/icons';

/**
 * The badge only renders after the cart has hydrated from localStorage.
 * Rendering a count during SSR would produce different HTML on the server and
 * the client, which React reports as a hydration error.
 */
export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-control text-ink hover:bg-brand-50"
      aria-label={ready && count > 0 ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'}
    >
      <CartIcon className="h-5 w-5" />
      {ready && count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
