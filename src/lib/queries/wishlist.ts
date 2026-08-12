import 'server-only';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { categories, productImages, products, wishlistItems } from '@/db/schema';

/** The ids only — enough to fill in the heart icons on a product grid. */
export async function getWishlistProductIds(customerId: string | null): Promise<Set<string>> {
  if (!customerId) return new Set();
  const rows = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.customerId, customerId));
  return new Set(rows.map((r) => r.productId));
}

/** Full product detail for the wishlist page. */
export async function getWishlist(customerId: string) {
  const rows = await db
    .select({
      id: products.id, name: products.name, slug: products.slug, sku: products.sku,
      priceCents: products.priceCents, salePriceCents: products.salePriceCents,
      stock: products.stock, lowStockAt: products.lowStockAt, unit: products.unit,
      isFeatured: products.isFeatured, isNewArrival: products.isNewArrival, isActive: products.isActive,
      categoryName: categories.name, categorySlug: categories.slug,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(wishlistItems.customerId, customerId))
    .orderBy(desc(wishlistItems.createdAt));

  if (rows.length === 0) return [];

  const images = await db
    .select({ productId: productImages.productId, url: productImages.url, alt: productImages.alt })
    .from(productImages)
    .where(inArray(productImages.productId, rows.map((r) => r.id)));

  const first = new Map<string, { url: string; alt: string }>();
  for (const image of images) if (!first.has(image.productId)) first.set(image.productId, image);

  return rows.map((row) => ({
    ...row,
    imageUrl: first.get(row.id)?.url ?? null,
    imageAlt: first.get(row.id)?.alt ?? null,
  }));
}
