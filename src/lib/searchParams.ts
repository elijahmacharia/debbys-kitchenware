import { VALID_SORTS, type SortKey } from '@/lib/productSort';

export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Turns raw URL parameters into validated filter values.
 *
 * Everything here is untrusted input: `?page=-5`, `?min=abc` and `?sort=drop`
 * all arrive from the address bar. Each value is coerced and bounded so a
 * hand-edited URL can only ever produce a valid query, never an error page or
 * an expensive scan.
 */
export function parseProductSearchParams(params: RawSearchParams) {
  const q = first(params.q)?.trim().slice(0, 80) || undefined;

  const toCents = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return Math.min(Math.round(parsed), 100_000_000);
  };

  let minPriceCents = toCents(first(params.min));
  let maxPriceCents = toCents(first(params.max));
  if (minPriceCents !== undefined && maxPriceCents !== undefined && minPriceCents > maxPriceCents) {
    [minPriceCents, maxPriceCents] = [maxPriceCents, minPriceCents];
  }

  const sortRaw = first(params.sort) as SortKey | undefined;
  const sort: SortKey = sortRaw && VALID_SORTS.includes(sortRaw) ? sortRaw : 'featured';

  const pageRaw = Number(first(params.page));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.min(Math.floor(pageRaw), 5000) : 1;

  return {
    q,
    categorySlug: first(params.category)?.trim().slice(0, 80) || undefined,
    minPriceCents,
    maxPriceCents,
    inStockOnly: first(params.stock) === '1',
    onSaleOnly: first(params.sale) === '1',
    newArrivalsOnly: first(params.new) === '1',
    sort,
    page,
  };
}

/** Rebuilds the query string for a pagination link, keeping every filter. */
export function buildPageHref(base: string, params: RawSearchParams, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const single = first(value);
    if (single && key !== 'page') next.set(key, single);
  }
  if (page > 1) next.set('page', String(page));
  const query = next.toString();
  return query ? `${base}?${query}` : base;
}
