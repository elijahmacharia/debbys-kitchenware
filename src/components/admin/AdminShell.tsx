'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import {
  ChartIcon, GridIcon, LogOutIcon, MenuIcon, PackageIcon, SettingsIcon,
  StoreIcon, TruckIcon, UsersIcon, XIcon,
} from '@/components/icons';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: ChartIcon },
  { href: '/admin/orders', label: 'Orders', Icon: PackageIcon },
  { href: '/admin/products', label: 'Products', Icon: StoreIcon },
  { href: '/admin/categories', label: 'Categories', Icon: GridIcon },
  { href: '/admin/inventory', label: 'Inventory', Icon: PackageIcon },
  { href: '/admin/customers', label: 'Customers', Icon: UsersIcon },
  { href: '/admin/delivery', label: 'Delivery zones', Icon: TruckIcon },
  { href: '/admin/settings', label: 'Settings', Icon: SettingsIcon },
];

export function AdminShell({ adminName, role, children }: { adminName: string; role: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const nav = (
    <nav aria-label="Admin" className="space-y-0.5">
      {NAV.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          aria-current={isActive(href) ? 'page' : undefined}
          className={cn(
            'flex min-h-[42px] items-center gap-2.5 rounded-control px-3 text-sm font-medium',
            isActive(href) ? 'bg-clay-600 text-white' : 'text-ink hover:bg-clay-50',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line p-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-clay-600 text-sm font-bold text-white">D</span>
            <span>
              <span className="block text-sm font-bold leading-tight">Debby&apos;s admin</span>
              <span className="block text-[11px] text-muted">{adminName} · {role.toLowerCase()}</span>
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-2">{nav}</div>
        <div className="border-t border-line p-2">
          <Link href="/" target="_blank" className="flex min-h-[40px] items-center gap-2.5 rounded-control px-3 text-sm text-muted hover:bg-canvas">
            <StoreIcon className="h-4 w-4" /> View the shop
          </Link>
          <button type="button" onClick={signOut} disabled={signingOut} className="flex min-h-[40px] w-full items-center gap-2.5 rounded-control px-3 text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-60">
            <LogOutIcon className="h-4 w-4" /> {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface px-3 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-control hover:bg-canvas" aria-label="Open admin menu">
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold">Debby&apos;s admin</span>
          <button type="button" onClick={signOut} disabled={signingOut} className="ml-auto text-sm font-medium text-danger disabled:opacity-60">Sign out</button>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
            <div role="dialog" aria-modal="true" aria-label="Admin menu" className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-surface p-3 shadow-pop">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold">{adminName}</span>
                <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-control hover:bg-canvas" aria-label="Close menu">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              {nav}
              <Link href="/" target="_blank" className="mt-2 flex min-h-[40px] items-center gap-2.5 rounded-control px-3 text-sm text-muted hover:bg-canvas">
                <StoreIcon className="h-4 w-4" /> View the shop
              </Link>
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
