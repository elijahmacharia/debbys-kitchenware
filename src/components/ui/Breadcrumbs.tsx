import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';
import { siteUrl } from '@/lib/config';

export interface Crumb { name: string; href?: string }

/**
 * Renders the visible trail and emits matching BreadcrumbList JSON-LD, so
 * Google can show the same path in the search result.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted sm:text-sm">
          {items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <ChevronRightIcon className="h-3.5 w-3.5 text-subtle" /> : null}
              {item.href && index < items.length - 1 ? (
                <Link href={item.href} className="hover:text-brand-700 hover:underline">{item.name}</Link>
              ) : (
                <span
                  className={index === items.length - 1 ? 'font-medium text-ink' : undefined}
                  aria-current={index === items.length - 1 ? 'page' : undefined}
                >
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
