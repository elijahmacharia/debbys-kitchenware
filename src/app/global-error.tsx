'use client';

import { useEffect } from 'react';

/**
 * Last-resort error boundary.
 *
 * `error.tsx` catches errors thrown inside a page. It cannot catch an error
 * thrown by a *layout*, because the boundary lives below the layout in the
 * tree. Without this file Next.js falls back to its own built-in error screen:
 * unstyled, unbranded, and with no landmarks for a screen reader.
 *
 * The realistic way to reach this page is the database being unreachable, since
 * the storefront layout loads the category menu. That is precisely the moment
 * the shop wants to look like it is having a bad day rather than like it has
 * been hacked or abandoned.
 *
 * This component replaces the entire document, so it must render its own <html>
 * and <body> — that is a requirement of global-error.tsx, not a stylistic
 * choice. Styles are inlined for the same reason a parachute is not kept in the
 * hold: whatever failed may well have been the stylesheet.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('[app] fatal error', error);
  }, [error]);

  return (
    <html lang="en-KE">
      <body style={{ margin: 0, background: '#f9f9f8', color: '#111110', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '28rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>The shop is temporarily unavailable</h1>
            <p style={{ marginTop: '0.75rem', fontSize: '0.95rem', lineHeight: 1.6, color: '#6e6e6a' }}>
              Sorry — something on our side is not responding. Nothing you did caused this, and no order
              has been affected. Please try again in a few minutes.
            </p>
            {error.digest ? (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#9a9a95' }}>
                Reference: <code>{error.digest}</code>
              </p>
            ) : null}
            <p style={{ marginTop: '1.5rem' }}>
              <a
                href="/"
                style={{
                  display: 'inline-block', padding: '0.75rem 1.5rem', borderRadius: '999px',
                  background: '#111110', color: '#ffffff', textDecoration: 'none', fontWeight: 600,
                }}
              >
                Try again
              </a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
