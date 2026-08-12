'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserIcon } from '@/components/icons';

/**
 * Account control in the header. Signed out it is a plain link to /login so
 * there is no menu to open for nothing; signed in it becomes a small dropdown
 * greeting the customer by first name.
 */
export function AccountMenu({ name }: { name: string | null }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!name) {
    return (
      <Link href="/login" className="inline-flex h-11 items-center gap-1.5 rounded-control px-2 text-sm font-medium text-ink hover:bg-brand-50 sm:px-3">
        <UserIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const firstName = name.split(' ')[0];

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false);
    // refresh() re-runs the server components so the header and any
    // personalised data reflect the signed-out state immediately.
    router.push('/');
    router.refresh();
  };

  const item = 'block w-full px-3 py-2.5 text-left text-sm text-ink hover:bg-canvas';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 max-w-[9rem] items-center gap-1.5 rounded-control px-2 text-sm font-medium text-ink hover:bg-brand-50 sm:px-3"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserIcon className="h-5 w-5 shrink-0" />
        <span className="hidden truncate sm:inline">Hi, {firstName}</span>
      </button>

      {open ? (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-card border border-line bg-surface py-1 shadow-pop">
          <p className="truncate border-b border-line px-3 pb-2 pt-1 text-xs text-muted">Signed in as {name}</p>
          <Link href="/account" role="menuitem" className={item} onClick={() => setOpen(false)}>My account</Link>
          <Link href="/account/orders" role="menuitem" className={item} onClick={() => setOpen(false)}>My orders</Link>
          <Link href="/account/wishlist" role="menuitem" className={item} onClick={() => setOpen(false)}>Wishlist</Link>
          <Link href="/account/addresses" role="menuitem" className={item} onClick={() => setOpen(false)}>Saved addresses</Link>
          <Link href="/account/profile" role="menuitem" className={item} onClick={() => setOpen(false)}>Profile</Link>
          <button type="button" role="menuitem" onClick={signOut} disabled={signingOut} className={`${item} border-t border-line text-danger disabled:opacity-60`}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
