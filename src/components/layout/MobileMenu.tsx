'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon, MenuIcon, XIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

export interface MenuCategory { name: string; slug: string; children: { name: string; slug: string }[] }

/**
 * Slide-out navigation for phones.
 *
 * The drawer is rendered into document.body through a portal, NOT in place.
 * That is not a stylistic choice — the header it lives in uses `backdrop-blur`,
 * and any element with a backdrop-filter becomes the containing block for its
 * `position: fixed` descendants. Rendered inline, the drawer's `fixed inset-0`
 * would size itself to the header rather than the viewport, collapsing into a
 * stub a couple of hundred pixels tall. The portal moves it out of that
 * containing block so it covers the screen properly.
 *
 * Closes on route change and on Escape, returns focus to the trigger, and
 * locks body scroll while open so the page behind does not move under the
 * customer's finger.
 */
export function MobileMenu({
  categories, isSignedIn, customerName, whatsappHref,
}: {
  categories: MenuCategory[];
  isSignedIn: boolean;
  customerName: string | null;
  whatsappHref: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // document does not exist during server rendering, so the portal can only
  // be created once the component has mounted in the browser.
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const link = 'flex min-h-[46px] items-center rounded-control px-3 text-[15px] font-medium text-ink hover:bg-clay-50';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-control text-ink hover:bg-clay-50 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {open && mounted ? createPortal(
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button type="button" className="absolute inset-0 animate-fade-in bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col bg-surface shadow-pop outline-none"
          >
            <div className="flex items-center justify-between border-b border-line px-3 py-3">
              <span className="text-sm font-semibold text-muted">
                {isSignedIn && customerName ? `Hi, ${customerName.split(' ')[0]} 👋` : 'Menu'}
              </span>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-control hover:bg-canvas" aria-label="Close menu">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2" aria-label="Main">
              <Link href="/" className={link}>Home</Link>
              <Link href="/shop" className={link}>Shop all products</Link>

              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-subtle">Categories</p>
              {categories.map((category) => (
                <div key={category.slug}>
                  <div className="flex items-center">
                    <Link href={`/category/${category.slug}`} className={cn(link, 'flex-1')}>{category.name}</Link>
                    {category.children.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === category.slug ? null : category.slug)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-clay-50"
                        aria-label={`${expanded === category.slug ? 'Hide' : 'Show'} ${category.name} subcategories`}
                        aria-expanded={expanded === category.slug}
                      >
                        <ChevronDownIcon className={cn('h-4 w-4 transition-transform', expanded === category.slug && 'rotate-180')} />
                      </button>
                    ) : null}
                  </div>
                  {expanded === category.slug ? (
                    <div className="ml-3 border-l border-line pl-2">
                      {category.children.map((child) => (
                        <Link key={child.slug} href={`/category/${child.slug}`} className={cn(link, 'text-sm text-muted')}>
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-subtle">Your account</p>
              {isSignedIn ? (
                <>
                  <Link href="/account" className={link}>My account</Link>
                  <Link href="/account/orders" className={link}>My orders</Link>
                  <Link href="/account/wishlist" className={link}>Wishlist</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className={link}>Sign in</Link>
                  <Link href="/register" className={link}>Create an account</Link>
                </>
              )}

              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-subtle">Information</p>
              <Link href="/about" className={link}>About us</Link>
              <Link href="/delivery" className={link}>Delivery &amp; pickup</Link>
              <Link href="/payment" className={link}>How to pay</Link>
              <Link href="/faq" className={link}>FAQ</Link>
              <Link href="/contact" className={link}>Contact us</Link>
            </nav>

            {whatsappHref ? (
              <div className="border-t border-line p-3">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full">Chat on WhatsApp</a>
              </div>
            ) : null}
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
