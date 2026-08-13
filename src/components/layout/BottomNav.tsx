'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { CartIcon, HeartIcon, HomeIcon, SearchIcon, UserIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

/**
 * Mobile tab bar.
 *
 * Phones are most of this shop's traffic, and a thumb-reachable bar beats a
 * hamburger for the five things people actually do. The cart sits in the
 * middle as a raised button because it is the destination that earns money.
 *
 * Hidden on large screens, where the header nav takes over, and hidden inside
 * checkout so nothing competes with completing the order.
 */
const TABS = [
  { href: '/', label: 'Home', Icon: HomeIcon, exact: true },
  { href: '/shop', label: 'Shop', Icon: SearchIcon },
  { href: '/account/wishlist', label: 'Saved', Icon: HeartIcon },
  { href: '/account', label: 'Account', Icon: UserIcon, exact: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count, ready } = useCart();

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-1.5 pt-2">
        {TABS.slice(0, 2).map((tab) => <Tab key={tab.href} {...tab} active={isActive(tab.href, tab.exact)} />)}

        {/* Raised centre button: the cart. */}
        <div className="flex justify-center">
          <Link
            href="/cart"
            aria-label={ready && count > 0 ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'}
            className="relative -mt-7 grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-pop transition active:scale-95"
          >
            <CartIcon className="h-5.5 w-5.5" />
            {ready && count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-clay-600 px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </Link>
        </div>

        {TABS.slice(2).map((tab) => <Tab key={tab.href} {...tab} active={isActive(tab.href, tab.exact)} />)}
      </div>
    </nav>
  );
}

function Tab({
  href, label, Icon, active,
}: { href: string; label: string; Icon: typeof HomeIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn('flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition-colors',
        active ? 'text-ink' : 'text-subtle')}
    >
      <Icon className={cn('h-5 w-5', active && 'stroke-[2.2]')} />
      {label}
    </Link>
  );
}
