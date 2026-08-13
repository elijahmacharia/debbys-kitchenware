'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  { href: '/admin/delivery', label: 'Delivery', Icon: TruckIcon },
  { href: '/admin/settings', label: 'Settings', Icon: SettingsIcon },
];

/**
 * The dashboard frame.
 *
 * Same language as the shop — soft panels, pill controls, near-black for the
 * active state — so the owner is not moving between two different products.
 * The drawer is portalled to document.body for the same reason the shop's is:
 * a `fixed` child of a transformed or blurred ancestor is measured against
 * that ancestor, not the viewport.
 */
export function AdminShell({
  adminName, role, children,
}: { adminName: string; role: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const nav = (
    <nav aria-label="Admin" className="space-y-1">
      {NAV.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
          className={cn('admin-nav-link', isActive(href) && 'admin-nav-link-active')}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-line pt-3">
      <Link href="/" target="_blank" className="admin-nav-link">
        <StoreIcon className="h-4 w-4" /> View the shop
      </Link>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="admin-nav-link w-full text-danger hover:bg-danger/5 hover:text-danger disabled:opacity-60"
      >
        <LogOutIcon className="h-4 w-4" /> {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );

  return (
    /* no-tabbar tells the layout not to reserve space for the shop's tab bar. */
    <div className="no-tabbar flex min-h-screen flex-1 bg-canvas">
      <aside className="hidden w-64 shrink-0 flex-col p-4 lg:flex">
        <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-soft">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">D</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{adminName}</span>
            <span className="block text-xs capitalize text-muted">{role.toLowerCase()}</span>
          </span>
        </Link>
        <div className="mt-4 flex-1 rounded-3xl bg-surface p-3 shadow-soft">
          {nav}
          <div className="mt-3">{footer}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full bg-surface shadow-soft"
            aria-label="Open admin menu"
            aria-expanded={open}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">Debby&apos;s admin</span>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="ml-auto text-sm font-medium text-danger disabled:opacity-60"
          >
            Sign out
          </button>
        </header>

        {open && mounted ? createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 animate-fade-in bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
            <div role="dialog" aria-modal="true" aria-label="Admin menu" className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-surface p-4 shadow-pop">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">{adminName}</span>
                <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-raise" aria-label="Close menu">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{nav}</div>
              <div className="mt-3">{footer}</div>
            </div>
          </div>,
          document.body,
        ) : null}

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-8 lg:pr-8">{children}</div>
      </div>
    </div>
  );
}
