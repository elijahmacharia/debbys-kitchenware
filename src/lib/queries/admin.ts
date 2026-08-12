import 'server-only';
import { and, count, desc, eq, gte, or, sql, sum } from 'drizzle-orm';
import { db } from '@/db';
import { categories, contactMessages, customers, orderItems, orders, products } from '@/db/schema';

/** Numbers for the dashboard overview. */
export async function getDashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const [
    totalOrders, pendingOrders, completedOrders, cancelledOrders,
    salesAllTime, salesThisMonth, ordersToday,
    productCount, activeProducts, outOfStock, lowStock,
    customerCount, unreadMessages,
  ] = await Promise.all([
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(orders).where(
      or(eq(orders.status, 'NEW'), eq(orders.status, 'CONFIRMED'), eq(orders.status, 'PROCESSING'),
         eq(orders.status, 'READY_FOR_PICKUP'), eq(orders.status, 'OUT_FOR_DELIVERY')),
    ),
    db.select({ value: count() }).from(orders).where(eq(orders.status, 'DELIVERED')),
    db.select({ value: count() }).from(orders).where(eq(orders.status, 'CANCELLED')),
    // Revenue counts DELIVERED orders only. Counting orders that were never
    // completed would flatter the figure and mislead the owner.
    db.select({ value: sum(orders.totalCents) }).from(orders).where(eq(orders.status, 'DELIVERED')),
    db.select({ value: sum(orders.totalCents) }).from(orders)
      .where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, startOfMonth))),
    db.select({ value: count() }).from(orders).where(gte(orders.createdAt, startOfToday)),
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ value: count() }).from(products).where(and(eq(products.isActive, true), eq(products.stock, 0))),
    db.select({ value: count() }).from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} > 0`, sql`${products.stock} <= ${products.lowStockAt}`)),
    db.select({ value: count() }).from(customers),
    db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.isRead, false)),
  ]);

  return {
    totalOrders: totalOrders[0].value,
    pendingOrders: pendingOrders[0].value,
    completedOrders: completedOrders[0].value,
    cancelledOrders: cancelledOrders[0].value,
    salesAllTimeCents: Number(salesAllTime[0].value ?? 0),
    salesThisMonthCents: Number(salesThisMonth[0].value ?? 0),
    ordersToday: ordersToday[0].value,
    productCount: productCount[0].value,
    activeProducts: activeProducts[0].value,
    outOfStock: outOfStock[0].value,
    lowStock: lowStock[0].value,
    customerCount: customerCount[0].value,
    unreadMessages: unreadMessages[0].value,
  };
}

export async function getPopularProducts(limit = 5) {
  return db
    .select({
      id: products.id, name: products.name, slug: products.slug, sku: products.sku,
      unitsSold: products.unitsSold, viewCount: products.viewCount, stock: products.stock,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.unitsSold), desc(products.viewCount))
    .limit(limit);
}

export async function getRecentOrders(limit = 8) {
  return db
    .select({
      id: orders.id, orderNumber: orders.orderNumber, customerName: orders.customerName,
      customerPhone: orders.customerPhone, status: orders.status, paymentStatus: orders.paymentStatus,
      fulfilment: orders.fulfilment, totalCents: orders.totalCents, createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

/** Products at or below their low-stock threshold, worst first. */
export async function getLowStockProducts(limit = 50) {
  return db
    .select({
      id: products.id, name: products.name, sku: products.sku, slug: products.slug,
      stock: products.stock, lowStockAt: products.lowStockAt, categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), sql`${products.stock} <= ${products.lowStockAt}`))
    .orderBy(products.stock)
    .limit(limit);
}

const escapeLike = (value: string) => `%${value.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;

export async function listAdminOrders(filters: { status?: string; q?: string; page?: number; perPage?: number }) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 25));

  const conditions = [];
  if (filters.status && filters.status !== 'ALL') conditions.push(eq(orders.status, filters.status as never));
  if (filters.q) {
    const like = escapeLike(filters.q);
    conditions.push(
      or(
        sql`${orders.orderNumber} LIKE ${like} ESCAPE '\\'`,
        sql`${orders.customerName} LIKE ${like} ESCAPE '\\'`,
        sql`${orders.customerPhone} LIKE ${like} ESCAPE '\\'`,
      ),
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db.select({ total: sql<number>`count(*)` }).from(orders).where(where);
  const total = Number(countRow?.total ?? 0);

  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return { rows, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getAdminOrder(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { ...order, items };
}

/**
 * Customer list with order counts. Returns only what staff need to serve an
 * order — no password hashes, and no fields the shop has no reason to show.
 */
export async function listCustomers(search?: string) {
  const like = search ? escapeLike(search) : null;
  return db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      createdAt: customers.createdAt,
      lastLoginAt: customers.lastLoginAt,
      orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE orders.customer_id = ${customers.id})`,
      spentCents: sql<number>`(SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE orders.customer_id = ${customers.id} AND orders.status = 'DELIVERED')`,
    })
    .from(customers)
    .where(
      like
        ? or(
            sql`${customers.name} LIKE ${like} ESCAPE '\\'`,
            sql`${customers.phone} LIKE ${like} ESCAPE '\\'`,
            sql`${customers.email} LIKE ${like} ESCAPE '\\'`,
          )
        : undefined,
    )
    .orderBy(desc(customers.createdAt))
    .limit(200);
}

export async function listAdminProducts(search?: string) {
  const like = search ? escapeLike(search) : null;
  return db
    .select({
      id: products.id, name: products.name, slug: products.slug, sku: products.sku,
      priceCents: products.priceCents, salePriceCents: products.salePriceCents,
      stock: products.stock, lowStockAt: products.lowStockAt,
      isActive: products.isActive, isFeatured: products.isFeatured, isNewArrival: products.isNewArrival,
      unitsSold: products.unitsSold, updatedAt: products.updatedAt,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(like ? or(sql`${products.name} LIKE ${like} ESCAPE '\\'`, sql`${products.sku} LIKE ${like} ESCAPE '\\'`) : undefined)
    .orderBy(desc(products.updatedAt))
    .limit(300);
}

export async function getAdminProduct(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product ?? null;
}
