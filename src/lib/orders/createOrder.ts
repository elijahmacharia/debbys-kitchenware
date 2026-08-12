import 'server-only';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  cartItems, deliveryZones, orderEvents, orderItems, orders, productImages, products, stockMovements,
} from '@/db/schema';
import { buildOrderNumber } from '@/lib/orders';
import type { CheckoutInput } from '@/lib/validation';

/**
 * ORDER CREATION — the one place money and stock actually change.
 *
 * Design rules, each of which exists because the alternative is a real bug:
 *
 *  1. PRICES ARE READ FROM THE DATABASE, NEVER FROM THE REQUEST. The browser
 *     sends product ids and quantities and nothing else that affects the total.
 *     A tampered payload cannot buy a cooking pot for one shilling.
 *
 *  2. THE DELIVERY FEE COMES FROM THE ZONE ROW, and only an active zone is
 *     accepted — not from anything the client sent.
 *
 *  3. EVERYTHING HAPPENS IN ONE TRANSACTION. Stock decrement, order rows and
 *     the audit trail either all commit or none do, so a failure halfway
 *     cannot leave stock reduced with no order to show for it.
 *
 *  4. STOCK IS DECREMENTED CONDITIONALLY (`WHERE stock >= quantity`) and the
 *     affected row count is checked. Two customers buying the last bucket at
 *     the same instant cannot both succeed.
 *
 *  5. PAYMENT IS NEVER MARKED PAID HERE. Every order starts PENDING. Only a
 *     person confirming the M-Pesa message moves it to PAID.
 */

export interface UnavailableItem { productId: string; name: string; available: number }

/**
 * Thrown inside the transaction to abort it. Any throw rolls the transaction
 * back, and carrying the detail on the error lets the caller tell the customer
 * exactly which item is the problem.
 */
class OrderFailure extends Error {
  constructor(message: string, readonly unavailable?: UnavailableItem[]) {
    super(message);
    this.name = 'OrderFailure';
  }
}

export type CreateOrderResult =
  | { ok: true; order: { id: string; publicId: string; orderNumber: string; totalCents: number } }
  | { ok: false; error: string; unavailable?: UnavailableItem[] };

export async function createOrder(
  input: CheckoutInput,
  customerId: string | null,
  channel: 'WEB' | 'WHATSAPP' = 'WEB',
): Promise<CreateOrderResult> {
  try {
    const created = await db.transaction(async (tx) => {
      const requestedIds = input.items.map((item) => item.productId);
      const rows = await tx
        .select({
          id: products.id, name: products.name, slug: products.slug, sku: products.sku,
          priceCents: products.priceCents, salePriceCents: products.salePriceCents,
          stock: products.stock, isActive: products.isActive,
        })
        .from(products)
        .where(inArray(products.id, requestedIds));

      const byId = new Map(rows.map((row) => [row.id, row]));

      // --- Validate the basket against live data ---------------------------
      const unavailable: UnavailableItem[] = [];
      const confirmed: {
        product: (typeof rows)[number];
        quantity: number;
        unitPriceCents: number;
        lineTotalCents: number;
      }[] = [];

      for (const item of input.items) {
        const product = byId.get(item.productId);
        if (!product || !product.isActive) {
          unavailable.push({ productId: item.productId, name: product?.name ?? 'An item in your cart', available: 0 });
          continue;
        }
        if (product.stock < item.quantity) {
          unavailable.push({ productId: item.productId, name: product.name, available: product.stock });
          continue;
        }
        const unitPriceCents =
          product.salePriceCents !== null && product.salePriceCents < product.priceCents
            ? product.salePriceCents
            : product.priceCents;
        confirmed.push({ product, quantity: item.quantity, unitPriceCents, lineTotalCents: unitPriceCents * item.quantity });
      }

      if (unavailable.length > 0) {
        throw new OrderFailure('Some items in your cart are no longer available', unavailable);
      }

      const subtotalCents = confirmed.reduce((sum, line) => sum + line.lineTotalCents, 0);

      // --- Delivery fee, taken from the zone record ------------------------
      let deliveryFeeCents = 0;
      let zoneName: string | null = null;
      let zoneId: string | null = null;

      if (input.fulfilment === 'DELIVERY') {
        const [zone] = await tx
          .select()
          .from(deliveryZones)
          .where(and(eq(deliveryZones.id, input.deliveryZoneId ?? ''), eq(deliveryZones.isActive, true)))
          .limit(1);
        if (!zone) throw new OrderFailure('That delivery area is not available. Please choose another.');
        deliveryFeeCents = zone.feeCents;
        zoneName = zone.name;
        zoneId = zone.id;
      }

      const totalCents = subtotalCents + deliveryFeeCents;

      // --- Order number: DK-YYMM-NNNN, sequence resets each month ----------
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [monthCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.createdAt, monthStart));
      const orderNumber = buildOrderNumber(now, Number(monthCount?.count ?? 0) + 1);

      const isDelivery = input.fulfilment === 'DELIVERY';

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail ?? null,
          fulfilment: input.fulfilment,
          status: 'NEW',
          paymentMethod: input.paymentMethod,
          paymentStatus: 'PENDING',
          deliveryZoneId: zoneId,
          deliveryZoneName: zoneName,
          county: isDelivery ? input.county ?? null : null,
          town: isDelivery ? input.town ?? null : null,
          area: isDelivery ? input.area ?? null : null,
          estate: isDelivery ? input.estate ?? null : null,
          building: isDelivery ? input.building ?? null : null,
          landmark: isDelivery ? input.landmark ?? null : null,
          directions: isDelivery ? input.directions ?? null : null,
          mapUrl: isDelivery ? input.mapUrl ?? null : null,
          subtotalCents,
          deliveryFeeCents,
          totalCents,
          customerNote: input.customerNote ?? null,
          channel,
        })
        .returning({ id: orders.id, publicId: orders.publicId, orderNumber: orders.orderNumber });

      for (const line of confirmed) {
        const [image] = await tx
          .select({ url: productImages.url })
          .from(productImages)
          .where(eq(productImages.productId, line.product.id))
          .orderBy(productImages.sortOrder)
          .limit(1);

        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: line.product.id,
          name: line.product.name,
          sku: line.product.sku,
          slug: line.product.slug,
          imageUrl: image?.url ?? null,
          unitPriceCents: line.unitPriceCents,
          quantity: line.quantity,
          lineTotalCents: line.lineTotalCents,
        });

        // Conditional decrement. If another order consumed the stock between
        // our read and this write, no row matches and we abort everything.
        const updated = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${line.quantity}`,
            unitsSold: sql`${products.unitsSold} + ${line.quantity}`,
          })
          .where(and(eq(products.id, line.product.id), gte(products.stock, line.quantity)))
          .returning({ id: products.id });

        if (updated.length === 0) {
          throw new OrderFailure(
            'Someone bought the last of an item while you were checking out. Please review your cart.',
            [{ productId: line.product.id, name: line.product.name, available: 0 }],
          );
        }

        await tx.insert(stockMovements).values({
          productId: line.product.id,
          delta: -line.quantity,
          reason: 'ORDER',
          note: `Order ${orderNumber}`,
          orderId: order.id,
        });
      }

      await tx.insert(orderEvents).values({
        orderId: order.id,
        status: 'NEW',
        note: channel === 'WHATSAPP' ? 'Order started on WhatsApp' : 'Order placed on the website',
      });

      // Emptying the saved cart is part of the same transaction: the customer
      // must never return to a cart still holding what they just bought.
      if (customerId) {
        await tx.delete(cartItems).where(eq(cartItems.customerId, customerId));
      }

      return { id: order.id, publicId: order.publicId, orderNumber: order.orderNumber, totalCents };
    });

    return { ok: true, order: created };
  } catch (error) {
    if (error instanceof OrderFailure) {
      return { ok: false, error: error.message, unavailable: error.unavailable };
    }
    // Anything else is a genuine fault. Log it for the operator and give the
    // customer a plain message — never a stack trace.
    console.error('[createOrder]', error);
    return { ok: false, error: 'We could not place your order. Please try again in a moment.' };
  }
}
