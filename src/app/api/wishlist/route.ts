import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { products, wishlistItems } from '@/db/schema';
import { getCustomerSession } from '@/lib/auth';
import { handle, notFound, ok, readJson, unauthorized, validationFailed } from '@/lib/api';

const schema = z.object({ productId: z.string().min(1).max(40) });

/**
 * A wishlist belongs to an account, so both handlers require a session and
 * scope every query to the session's customer id. There is no path here that
 * can touch another customer's list.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized('Sign in to save items to your wishlist');

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, parsed.data.productId), eq(products.isActive, true)))
      .limit(1);
    if (!product) return notFound('That product is no longer available');

    try {
      await db.insert(wishlistItems).values({ customerId: session.sub, productId: product.id });
    } catch {
      // Unique index hit: it is already saved, which is the desired end state.
    }
    return ok({ saved: true });
  });
}

export async function DELETE(request: Request) {
  return handle(async () => {
    const session = await getCustomerSession();
    if (!session) return unauthorized();

    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return validationFailed(parsed.error);

    await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.customerId, session.sub), eq(wishlistItems.productId, parsed.data.productId)));
    return ok({ saved: false });
  });
}
