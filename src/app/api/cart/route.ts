import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { cartItems, products } from '@/db/schema';
import { getCustomerSession } from '@/lib/auth';
import { handle, ok, readJson, unauthorized, validationFailed } from '@/lib/api';

const schema = z.object({
  items: z.array(z.object({ productId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(999) })).max(60),
});

/** The signed-in customer's saved cart, so it follows them between devices. */
export async function GET() {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();
    const rows = await db
      .select({ productId: cartItems.productId, quantity: cartItems.quantity })
      .from(cartItems)
      .where(eq(cartItems.customerId, session.sub));
    return ok({ items: rows });
  });
}

/**
 * Mirrors the browser cart to the database. The browser stays the source of
 * truth while shopping; this is a backup copy, so a full replace is both
 * correct and simpler than diffing.
 */
export async function PUT(request: Request) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);
    const { items } = parsed.data;

    // Drop ids that no longer exist so the cart table cannot accumulate
    // references to deleted products.
    const valid = items.length
      ? new Set(
          (await db.select({ id: products.id }).from(products).where(inArray(products.id, items.map((i) => i.productId))))
            .map((r) => r.id),
        )
      : new Set<string>();

    await db.transaction(async (tx) => {
      await tx.delete(cartItems).where(eq(cartItems.customerId, session.sub));
      for (const item of items) {
        if (!valid.has(item.productId)) continue;
        await tx.insert(cartItems).values({ customerId: session.sub, productId: item.productId, quantity: item.quantity });
      }
    });

    return ok({ saved: true });
  });
}
