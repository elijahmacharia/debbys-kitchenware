/**
 * Sort vocabulary shared by the server query builder and the client <select>.
 *
 * It lives in its own module because the query file is marked `server-only`,
 * and a client component importing that would drag the database driver into
 * the browser bundle (and fail the build, which is the point of the marker).
 */
export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'name';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'popular', label: 'Most popular' },
  { value: 'name', label: 'Name A–Z' },
];

export const VALID_SORTS: SortKey[] = SORT_OPTIONS.map((o) => o.value);
