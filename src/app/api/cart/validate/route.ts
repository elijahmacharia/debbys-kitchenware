import { inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { productImages, products } from '@/db/schema';
import { handle, ok, readJson, validationFailed } from '@/lib/api';

const schema = z.object({ productIds: z.array(z.string().min(1).max(40)).max(60) });

/**
 * Returns the current truth about the items in a cart: live price, live stock,
 * whether the product still exists. The client uses it to refresh the cart and
 * warn the customer about anything that changed while they were shopping.
 *
 * Safe to expose publicly — it only reveals data already on the product page,
 * and only for ids the caller already has.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);
    if (parsed.data.productIds.length === 0) return ok({ products: [] });

    const rows = await db
      .select({
        id: products.id, name: products.name, slug: products.slug, sku: products.sku,
        priceCents: products.priceCents, salePriceCents: products.salePriceCents,
        stock: products.stock, isActive: products.isActive, unit: products.unit,
      })
      .from(products)
      .where(inArray(products.id, parsed.data.productIds));

    const images = rows.length
      ? await db
          .select({ productId: productImages.productId, url: productImages.url, sortOrder: productImages.sortOrder })
          .from(productImages)
          .where(inArray(productImages.productId, rows.map((r) => r.id)))
      : [];

    const firstImage = new Map<string, string>();
    for (const image of [...images].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!firstImage.has(image.productId)) firstImage.set(image.productId, image.url);
    }

    return ok({
      products: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        isActive: row.isActive,
        stock: row.stock,
        unit: row.unit,
        listPriceCents: row.priceCents,
        unitPriceCents:
          row.salePriceCents !== null && row.salePriceCents < row.priceCents ? row.salePriceCents : row.priceCents,
        imageUrl: firstImage.get(row.id) ?? null,
      })),
    });
  });
}
