'use client';

import { useEffect } from 'react';

/**
 * Root error boundary.
 *
 * The customer is shown a plain apology and a way forward. The real error is
 * logged to the console for the operator — a stack trace is never rendered,
 * because it can expose file paths and internal structure.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] unhandled error', error);
  }, [error]);

  return (
    <div className="container-site flex min-h-[70vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <h1>Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Sorry, that did not work. It is our problem, not yours. Try again, and if it keeps happening
          please let us know.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-subtle">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn-primary">Try again</button>
          <a href="/" className="btn-secondary">Go to the homepage</a>
          <a href="/contact" className="btn-ghost border border-line">Contact us</a>
        </div>
      </div>
    </div>
  );
}
