import Link from 'next/link';
import type { Metadata } from 'next';
import { SearchIcon } from '@/components/icons';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: false } };

/**
 * Root 404. Because it sits outside the (storefront) group it renders without
 * the shop header, so the links below are the way back.
 */
export default function NotFound() {
  return (
    <div className="container-site flex min-h-[70vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <p className="text-5xl font-bold text-brand-600">404</p>
        <h1 className="mt-3">We cannot find that page</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The link may be old, or the product may have been withdrawn from sale. Try searching for what
          you need, or browse the categories.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/shop" className="btn-primary"><SearchIcon className="h-4 w-4" />Browse the shop</Link>
          <Link href="/" className="btn-secondary">Go to the homepage</Link>
          <Link href="/contact" className="btn-ghost border border-line">Contact us</Link>
        </div>
      </div>
    </div>
  );
}
