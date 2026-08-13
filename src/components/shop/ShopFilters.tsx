'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FilterIcon, XIcon } from '@/components/icons';
import { centsToInput, parseShillingsToCents } from '@/lib/money';
import { cn } from '@/lib/cn';

export interface FilterCategory {
  name: string; slug: string; productCount: number;
  children: { name: string; slug: string; productCount: number }[];
}

/**
 * Filters and sorting.
 *
 * Every control writes to the URL rather than to local state. That means a
 * filtered view can be bookmarked, shared or reloaded, the back button
 * behaves, and the server does the filtering — so the results are always the
 * real ones from the database rather than a client-side approximation.
 *
 * On mobile the same panel opens as a bottom sheet, because a sidebar would
 * take the whole screen anyway.
 */
export function ShopFilters({
  categories, priceCeilingCents, lockedCategorySlug, resultCount,
}: {
  categories: FilterCategory[];
  priceCeilingCents: number;
  /** Set on /category/[slug], where the category is fixed by the route. */
  lockedCategorySlug?: string;
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  useEffect(() => {
    setMinInput(params.get('min') ? centsToInput(Number(params.get('min'))) : '');
    setMaxInput(params.get('max') ? centsToInput(Number(params.get('max'))) : '');
  }, [params]);

  const activeCategory = lockedCategorySlug ?? params.get('category') ?? '';
  const inStock = params.get('stock') === '1';
  const onSale = params.get('sale') === '1';
  const newOnly = params.get('new') === '1';

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    // Any filter change invalidates the current page number.
    next.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
      setOpen(false);
    });
  };

  const applyPrice = (event: React.FormEvent) => {
    event.preventDefault();
    const min = minInput.trim() ? parseShillingsToCents(minInput) : null;
    const max = maxInput.trim() ? parseShillingsToCents(maxInput) : null;
    // Silently swap a reversed range instead of returning zero results.
    const [lo, hi] = min !== null && max !== null && min > max ? [max, min] : [min, max];
    update({ min: lo === null ? null : String(lo), max: hi === null ? null : String(hi) });
  };

  const allCategories = categories.flatMap((c) => [c, ...c.children]);
  const activeFilters = [
    activeCategory && !lockedCategorySlug
      ? { key: 'category', label: allCategories.find((c) => c.slug === activeCategory)?.name ?? activeCategory }
      : null,
    params.get('q') ? { key: 'q', label: `“${params.get('q')}”` } : null,
    params.get('min') ? { key: 'min', label: `From KSh ${centsToInput(Number(params.get('min')))}` } : null,
    params.get('max') ? { key: 'max', label: `Up to KSh ${centsToInput(Number(params.get('max')))}` } : null,
    inStock ? { key: 'stock', label: 'In stock' } : null,
    onSale ? { key: 'sale', label: 'On sale' } : null,
    newOnly ? { key: 'new', label: 'New arrivals' } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const checkbox = 'flex min-h-[40px] cursor-pointer items-center gap-2.5 text-sm text-ink';

  const panel = (
    <div className={cn('space-y-6', isPending && 'opacity-60 transition-opacity')}>
      {!lockedCategorySlug ? (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Category</legend>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => update({ category: null })}
              className={cn('block w-full rounded px-2 py-1.5 text-left text-sm', !activeCategory ? 'bg-clay-50 font-semibold text-olive-800' : 'text-muted hover:bg-canvas')}
            >
              All categories
            </button>
            {categories.map((category) => (
              <div key={category.slug}>
                <button
                  type="button"
                  onClick={() => update({ category: category.slug })}
                  className={cn('flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm', activeCategory === category.slug ? 'bg-clay-50 font-semibold text-olive-800' : 'text-ink hover:bg-canvas')}
                >
                  <span>{category.name}</span>
                  <span className="text-xs text-subtle">{category.productCount}</span>
                </button>
                {category.children.length > 0 ? (
                  <div className="ml-2 border-l border-line pl-2">
                    {category.children.map((child) => (
                      <button
                        key={child.slug}
                        type="button"
                        onClick={() => update({ category: child.slug })}
                        className={cn('flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[13px]', activeCategory === child.slug ? 'bg-clay-50 font-semibold text-olive-800' : 'text-muted hover:bg-canvas')}
                      >
                        <span>{child.name}</span>
                        <span className="text-xs text-subtle">{child.productCount}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      <form onSubmit={applyPrice}>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Price (KSh)</legend>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="filter-min">Minimum price</label>
            <input id="filter-min" type="number" inputMode="numeric" min={0} placeholder="Min" value={minInput} onChange={(e) => setMinInput(e.target.value)} className="input h-11 text-sm" />
            <span className="text-subtle" aria-hidden="true">–</span>
            <label className="sr-only" htmlFor="filter-max">Maximum price</label>
            <input id="filter-max" type="number" inputMode="numeric" min={0} placeholder={priceCeilingCents ? centsToInput(priceCeilingCents) : 'Max'} value={maxInput} onChange={(e) => setMaxInput(e.target.value)} className="input h-11 text-sm" />
          </div>
          <button type="submit" className="btn-secondary btn-sm mt-2 w-full">Apply price</button>
        </fieldset>
      </form>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Show only</legend>
        <div className="space-y-1">
          <label className={checkbox}>
            <input type="checkbox" checked={inStock} onChange={(e) => update({ stock: e.target.checked ? '1' : null })} className="h-5 w-5 rounded border-line text-clay-600 focus:ring-clay-600" />
            In stock
          </label>
          <label className={checkbox}>
            <input type="checkbox" checked={onSale} onChange={(e) => update({ sale: e.target.checked ? '1' : null })} className="h-5 w-5 rounded border-line text-clay-600 focus:ring-clay-600" />
            On sale
          </label>
          <label className={checkbox}>
            <input type="checkbox" checked={newOnly} onChange={(e) => update({ new: e.target.checked ? '1' : null })} className="h-5 w-5 rounded border-line text-clay-600 focus:ring-clay-600" />
            New arrivals
          </label>
        </div>
      </fieldset>

      {activeFilters.length > 0 ? (
        <Link href={lockedCategorySlug ? pathname : '/shop'} className="btn-ghost btn-sm w-full border border-line">Clear all filters</Link>
      ) : null}
    </div>
  );

  return (
    /*
     * MUST be a single element, not a fragment. The parent page places this in
     * a `lg:grid-cols-[16rem_1fr]` grid and expects it to occupy exactly one
     * cell. A fragment spills its children into the grid as separate cells,
     * which pushes the product list into the narrow sidebar column.
     */
    <div className="lg:sticky lg:top-24">
      <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary btn-sm">
          <FilterIcon className="h-4 w-4" />
          Filters
          {activeFilters.length > 0 ? (
            <span className="ml-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-clay-600 px-1 text-[11px] text-white">
              {activeFilters.length}
            </span>
          ) : null}
        </button>
        <span className="text-sm text-muted">{resultCount} product{resultCount === 1 ? '' : 's'}</span>
      </div>

      {activeFilters.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-1.5 lg:mb-3">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => update({ [filter.key]: null })}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:border-clay-300"
            >
              {filter.label}
              <XIcon className="h-3 w-3" />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
        </div>
      ) : null}

      <aside className="hidden lg:block" aria-label="Product filters">{panel}</aside>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Filters" className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-pop">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Filters</h2>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-control hover:bg-canvas" aria-label="Close filters">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            {panel}
            <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-5 w-full">
              Show {resultCount} product{resultCount === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
