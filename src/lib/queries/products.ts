import 'server-only';
import { and, asc, desc, eq, gte, inArray, isNotNull, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { categories, productImages, products } from '@/db/schema';
import { SORT_OPTIONS, type SortKey } from '@/lib/productSort';

/**
 * Catalogue reads. Everything the shop, search, category and product pages need
 * lives here, so the filtering rules exist in exactly one place — a filter that
 * behaves differently on /shop than on /category/x is a class of bug this
 * avoids entirely.
 */

export type { SortKey };
export { SORT_OPTIONS };

/** The price a customer pays, as SQL, so sorting and filtering agree with the UI. */
const effectivePrice = sql<number>`COALESCE(${products.salePriceCents}, ${products.priceCents})`;

export interface ProductFilters {
  q?: string;
  categorySlug?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  newArrivalsOnly?: boolean;
  featuredOnly?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  priceCents: number;
  salePriceCents: number | null;
  stock: number;
  lowStockAt: number;
  unit: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
  imageAlt: string | null;
}

const PER_PAGE_DEFAULT = 24;
const PER_PAGE_MAX = 60;

/**
 * Every descendant of a category, so browsing "Kitchenware" also shows the
 * products filed under "Plates & Bowls". The loop copes with deeper nesting
 * than the two levels the seed data uses.
 */
async function categoryIdsFor(slug: string): Promise<string[] | null> {
  const [root] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);
  if (!root) return null;

  const ids = [root.id];
  let frontier = [root.id];
  for (let depth = 0; depth < 4 && frontier.length > 0; depth += 1) {
    const children = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(inArray(categories.parentId, frontier), eq(categories.isActive, true)));
    frontier = children.map((c) => c.id);
    ids.push(...frontier);
  }
  return ids;
}

/**
 * Builds the search predicate.
 *
 * Every word must appear somewhere in the name, keywords, SKU or description —
 * searching "plastic bucket" should not return every plastic item in the shop.
 * Values are passed as bound parameters, never concatenated into SQL, and %
 * and _ in the customer's text are escaped so they are treated as literal
 * characters rather than wildcards.
 */
function searchCondition(term: string): SQL | undefined {
  const cleaned = term.trim();
  if (!cleaned) return undefined;
  const words = cleaned.split(/\s+/).slice(0, 6);
  const perWord = words.map((word) => {
    const like = `%${word.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    return or(
      sql`${products.name} LIKE ${like} ESCAPE '\\'`,
      sql`${products.keywords} LIKE ${like} ESCAPE '\\'`,
      sql`${products.sku} LIKE ${like} ESCAPE '\\'`,
      sql`${products.description} LIKE ${like} ESCAPE '\\'`,
    );
  });
  return and(...perWord);
}

function orderBy(sort: SortKey, hasQuery: boolean) {
  switch (sort) {
    case 'newest': return [desc(products.createdAt)];
    case 'price-asc': return [asc(effectivePrice)];
    case 'price-desc': return [desc(effectivePrice)];
    case 'popular': return [desc(products.unitsSold), desc(products.viewCount)];
    case 'name': return [asc(products.name)];
    case 'featured':
    default:
      // With a search term, relevance-ish ordering (in stock, then popular)
      // beats "featured", which would bury the thing the customer typed.
      return hasQuery
        ? [desc(sql`CASE WHEN ${products.stock} > 0 THEN 1 ELSE 0 END`), desc(products.unitsSold), asc(products.name)]
        : [desc(products.isFeatured), desc(sql`CASE WHEN ${products.stock} > 0 THEN 1 ELSE 0 END`), desc(products.createdAt)];
  }
}

export async function listProducts(filters: ProductFilters): Promise<{
  items: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}> {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const perPage = Math.min(PER_PAGE_MAX, Math.max(1, Math.floor(filters.perPage ?? PER_PAGE_DEFAULT)));

  const conditions: SQL[] = [eq(products.isActive, true) as SQL];

  if (filters.categorySlug) {
    const ids = await categoryIdsFor(filters.categorySlug);
    // An unknown or inactive category must return nothing, not everything.
    if (!ids) return { items: [], total: 0, page, perPage, totalPages: 0 };
    conditions.push(inArray(products.categoryId, ids) as SQL);
  }
  const search = filters.q ? searchCondition(filters.q) : undefined;
  if (search) conditions.push(search);
  if (filters.minPriceCents !== undefined) conditions.push(gte(effectivePrice, filters.minPriceCents) as SQL);
  if (filters.maxPriceCents !== undefined) conditions.push(lte(effectivePrice, filters.maxPriceCents) as SQL);
  if (filters.inStockOnly) conditions.push(sql`${products.stock} > 0`);
  if (filters.onSaleOnly) {
    conditions.push(and(isNotNull(products.salePriceCents), sql`${products.salePriceCents} < ${products.priceCents}`) as SQL);
  }
  if (filters.newArrivalsOnly) conditions.push(eq(products.isNewArrival, true) as SQL);
  if (filters.featuredOnly) conditions.push(eq(products.isFeatured, true) as SQL);

  const where = and(...conditions);

  const [countRow] = await db.select({ total: sql<number>`count(*)` }).from(products).where(where);
  const total = Number(countRow?.total ?? 0);

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      priceCents: products.priceCents,
      salePriceCents: products.salePriceCents,
      stock: products.stock,
      lowStockAt: products.lowStockAt,
      unit: products.unit,
      isFeatured: products.isFeatured,
      isNewArrival: products.isNewArrival,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(...orderBy(filters.sort ?? 'featured', Boolean(filters.q)))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const items = await attachPrimaryImages(rows);
  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

/**
 * One extra query for all images rather than one per product. With 24 products
 * on a page that is the difference between 2 queries and 25.
 */
async function attachPrimaryImages(rows: Omit<ProductListItem, 'imageUrl' | 'imageAlt'>[]): Promise<ProductListItem[]> {
  if (rows.length === 0) return [];
  const images = await db
    .select({ productId: productImages.productId, url: productImages.url, alt: productImages.alt })
    .from(productImages)
    .where(inArray(productImages.productId, rows.map((r) => r.id)))
    .orderBy(asc(productImages.sortOrder));

  const first = new Map<string, { url: string; alt: string }>();
  for (const image of images) {
    if (!first.has(image.productId)) first.set(image.productId, { url: image.url, alt: image.alt });
  }

  return rows.map((row) => ({
    ...row,
    imageUrl: first.get(row.id)?.url ?? null,
    imageAlt: first.get(row.id)?.alt ?? null,
  }));
}

export async function getProductBySlug(slug: string) {
  const [row] = await db
    .select({
      product: products,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryParentId: categories.parentId,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);
  if (!row) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.product.id))
    .orderBy(asc(productImages.sortOrder));

  let parentCategory: { name: string; slug: string } | null = null;
  if (row.categoryParentId) {
    const [parent] = await db
      .select({ name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, row.categoryParentId))
      .limit(1);
    parentCategory = parent ?? null;
  }

  return { ...row.product, categoryName: row.categoryName, categorySlug: row.categorySlug, parentCategory, images };
}

/** Fire-and-forget view counter. Never allowed to fail a page render. */
export async function incrementProductView(productId: string) {
  try {
    await db.update(products).set({ viewCount: sql`${products.viewCount} + 1` }).where(eq(products.id, productId));
  } catch (error) {
    console.error('[products] view count failed', error);
  }
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const rows = await db
    .select({
      id: products.id, name: products.name, slug: products.slug, sku: products.sku,
      priceCents: products.priceCents, salePriceCents: products.salePriceCents,
      stock: products.stock, lowStockAt: products.lowStockAt, unit: products.unit,
      isFeatured: products.isFeatured, isNewArrival: products.isNewArrival,
      categoryName: categories.name, categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), eq(products.categoryId, categoryId), ne(products.id, productId)))
    .orderBy(desc(sql`CASE WHEN ${products.stock} > 0 THEN 1 ELSE 0 END`), desc(products.unitsSold))
    .limit(limit);
  return attachPrimaryImages(rows);
}

export const getFeaturedProducts = (limit = 8) =>
  listProducts({ featuredOnly: true, sort: 'featured', perPage: limit }).then((r) => r.items);

export const getNewArrivals = (limit = 8) =>
  listProducts({ newArrivalsOnly: true, sort: 'newest', perPage: limit }).then((r) => r.items);

export const getSaleProducts = (limit = 8) =>
  listProducts({ onSaleOnly: true, sort: 'featured', perPage: limit }).then((r) => r.items);

/** Typeahead results for the header search box. */
export async function searchSuggestions(term: string, limit = 6) {
  const condition = searchCondition(term);
  if (!condition) return [];
  return db
    .select({
      name: products.name, slug: products.slug, sku: products.sku,
      priceCents: products.priceCents, salePriceCents: products.salePriceCents,
      stock: products.stock, categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), condition))
    .orderBy(desc(sql`CASE WHEN ${products.stock} > 0 THEN 1 ELSE 0 END`), desc(products.unitsSold))
    .limit(limit);
}

/** The highest price in the catalogue, used to bound the price filter. */
export async function getPriceCeiling(): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`COALESCE(MAX(${effectivePrice}), 0)` })
    .from(products)
    .where(eq(products.isActive, true));
  return Number(row?.max ?? 0);
}
