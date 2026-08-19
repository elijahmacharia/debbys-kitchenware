import type { ReactNode } from 'react';

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
 * `no-tabbar` cancels the bottom padding that globals.css reserves for the
 * mobile tab bar, which is not rendered here.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="no-tabbar flex min-h-screen flex-1 flex-col bg-canvas">{children}</main>;
}
