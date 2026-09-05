import type { ReactNode } from 'react';
import { CartProvider } from '@/components/cart/CartProvider';
import { getCustomerSession } from '@/lib/auth';

/**
 * Layout for signing in, registering and resetting a password.
 *
 * Deliberately bare: no header, no footer, no bottom tab bar. Someone on this
 * screen has one job, and every other link on the page is an invitation to
 * abandon it. The shop is still one tap away through the mark at the top of
 * the card and the "continue as a guest" link at the bottom, so nobody is
 * trapped here.
 *
 * These pages live in their own route group rather than under (storefront)
 * because a nested layout cannot remove chrome that a parent layout renders.
 * The group name is in brackets, so the URLs are unchanged: /login, /register,
 * /forgot-password, /reset-password.
 *
 * CartProvider is here for one specific reason, and removing it breaks sign-in
 * outright. LoginForm calls useCart() to merge the cart saved on the account
 * into whatever the browser is holding. When these pages moved out of the
 * (storefront) group they lost the provider that layout supplies, and every
 * visit to /login threw "useCart must be used inside <CartProvider>" — a crash,
 * not a warning. The provider renders nothing on its own, so the page stays as
 * bare as it looks.
 *
 * `no-tabbar` cancels the bottom padding globals.css reserves for the mobile
 * tab bar, which is not rendered here.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getCustomerSession();

  return (
    <CartProvider isSignedIn={Boolean(session)}>
      <main className="no-tabbar flex min-h-screen flex-1 flex-col bg-canvas">{children}</main>
    </CartProvider>
  );
}
