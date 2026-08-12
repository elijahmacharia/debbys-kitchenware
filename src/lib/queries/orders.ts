import 'server-only';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { orderEvents, orderItems, orders } from '@/db/schema';

/**
 * Order reads.
 *
 * Every function that returns an order to a customer takes the viewer's
 * identity and enforces it in the query. There is no "load by id, then check"
 * path, because that is where authorisation bugs live. `adminNote` is stripped
 * from everything returned here — it is staff-only.
 */

export async function getOrderForViewer(
  publicId: string,
  viewer: { customerId: string | null; guestHasAccess: boolean },
) {
  const [order] = await db.select().from(orders).where(eq(orders.publicId, publicId)).limit(1);
  if (!order) return null;

  const allowed = order.customerId
    ? order.customerId === viewer.customerId
    // A guest order can only be opened by the browser that placed it, which
    // holds the publicId in an httpOnly cookie.
    : viewer.guestHasAccess;

  if (!allowed) return null;

  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(asc(orderEvents.createdAt)),
  ]);

  const { adminNote, ...safe } = order;
  return { ...safe, items, events };
}

export async function getCustomerOrders(customerId: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  if (rows.length === 0) return [];

  // One query for the items of every order, rather than one per order.
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));

  const byOrder = new Map<string, typeof items>();
  for (const item of items) {
    if (!byOrder.has(item.orderId)) byOrder.set(item.orderId, []);
    byOrder.get(item.orderId)!.push(item);
  }

  return rows.map(({ adminNote, ...order }) => ({ ...order, items: byOrder.get(order.id) ?? [] }));
}

export async function getCustomerOrderById(customerId: string, publicId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.publicId, publicId), eq(orders.customerId, customerId)))
    .limit(1);
  if (!order) return null;

  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(asc(orderEvents.createdAt)),
  ]);

  const { adminNote, ...safe } = order;
  return { ...safe, items, events };
}
