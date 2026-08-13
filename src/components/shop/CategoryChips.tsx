'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * The horizontally scrollable pill rail under the search box.
 *
 * Real links rather than buttons, so a filtered view can be shared, the back
 * button behaves, and it works before JavaScript loads. The rail scrolls
 * rather than wrapping, which keeps the page height stable as filters change.
 */
export function CategoryChips({
  categories, activeSlug,
}: { categories: { name: string; slug: string }[]; activeSlug?: string }) {
  const params = useSearchParams();
  const pathname = usePathname();

  const withCategory = (slug?: string) => {
    const next = new URLSearchParams(params.toString());
    if (slug) next.set('category', slug);
    else next.delete('category');
    next.delete('page');
    const q = next.toString();
    return q ? `/shop?${q}` : '/shop';
  };

  const current = activeSlug ?? params.get('category') ?? '';
  const onSale = params.get('sale') === '1';
  const isNew = params.get('new') === '1';

  const toggle = (key: 'sale' | 'new') => {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === '1') next.delete(key);
    else next.set(key, '1');
    next.delete('page');
    const q = next.toString();
    return q ? `${pathname}?${q}` : pathname;
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 pb-1">
        {!activeSlug ? (
          <Link href={withCategory()} className={cn('chip', !current && !onSale && !isNew && 'chip-active')}>
            All
          </Link>
        ) : null}
        <Link href={toggle('new')} className={cn('chip', isNew && 'chip-active')}>New in</Link>
        <Link href={toggle('sale')} className={cn('chip', onSale && 'chip-active')}>Offers</Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={withCategory(category.slug)}
            className={cn('chip', current === category.slug && 'chip-active')}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
