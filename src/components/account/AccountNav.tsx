'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { HeartIcon, HomeIcon, LogOutIcon, MapPinIcon, PackageIcon, SettingsIcon, UserIcon } from '@/components/icons';

const LINKS = [
  { href: '/account', label: 'Overview', Icon: HomeIcon, exact: true },
  { href: '/account/orders', label: 'My orders', Icon: PackageIcon },
  { href: '/account/wishlist', label: 'Wishlist', Icon: HeartIcon },
  { href: '/account/addresses', label: 'Saved addresses', Icon: MapPinIcon },
  { href: '/account/profile', label: 'Profile', Icon: UserIcon },
  { href: '/account/settings', label: 'Settings', Icon: SettingsIcon },
];

/** Sidebar on desktop, a horizontally scrollable strip of tabs on a phone. */
export function AccountNav({ customerName }: { customerName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-24">
      <p className="mb-3 hidden text-sm text-muted lg:block">
        Signed in as <span className="font-semibold text-ink">{customerName}</span>
      </p>

      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {LINKS.map(({ href, label, Icon, exact }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href, exact) ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium',
              isActive(href, exact) ? 'bg-ink text-white' : 'text-ink hover:bg-raise',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-60"
        >
          <LogOutIcon className="h-4 w-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </nav>
  );
}
