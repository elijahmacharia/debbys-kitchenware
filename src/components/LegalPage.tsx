import type { ReactNode } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Alert } from '@/components/ui/Alert';
import { business, isPlaceholder } from '@/lib/config';

/**
 * Shared shell for the three legal pages.
 *
 * If the owner has written their own version in Admin > Settings, that text is
 * shown. Otherwise we show a clearly-labelled starting draft: it describes how
 * this system actually works (what data is collected, how orders are handled),
 * and marks everything that is a commercial or legal decision as needing the
 * owner's confirmation. Nothing invents a policy the business has not agreed.
 */
export function LegalPage({
  title, description, custom, children, breadcrumb,
}: { title: string; description: string; custom: string; children: ReactNode; breadcrumb: string }) {
  return (
    <div className="container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: breadcrumb }]} />
      <h1 className="mt-3">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>

      {custom ? (
        <div className="prose-page mt-6 whitespace-pre-line">{custom}</div>
      ) : (
        <>
          <Alert tone="warning" className="mt-5" title="Draft — not yet approved by the business">
            This is a starting point written from how the website actually works. {business.name} must
            review it, fill in the bracketed items and have it checked before relying on it. The owner can
            replace this entire page from Admin &gt; Settings.
          </Alert>
          <div className="prose-page mt-6">{children}</div>
        </>
      )}

      <p className="mt-8 text-sm text-muted">
        Questions about this page? <Link href="/contact" className="link">Contact us</Link>.
        {isPlaceholder(business.email) ? null : <> You can also email <a className="link" href={`mailto:${business.email}`}>{business.email}</a>.</>}
      </p>
    </div>
  );
}
