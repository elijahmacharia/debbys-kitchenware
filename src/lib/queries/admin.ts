import 'server-only';
import { and, desc, eq, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { categories, customers, orderItems, orders, products } from '@/db/schema';

/**
 * Numbers for the dashboard overview, in a single statement.
 *
 * This used to be thirteen separate queries in a Promise.all, which read
 * nicely and was the wrong shape entirely. Against a local SQLite file it was
 * free. Against Supabase's transaction pooler it was thirteen queries fighting
 * over a pool of four connections, and it failed in production with Postgres
 * error 57014 — "canceling statement due to statement timeout" — after 49
 * milliseconds. Not a slow query: a query that never got to run.
 *
 * Thirteen scalar subqueries in one statement return exactly the same figures
 * for one round trip and one connection. It is also simply faster: the old
 * version paid the network latency thirteen times, and from a serverless
 * function that is the dominant cost.
 *
 * Written as raw SQL rather than the query builder because the builder has no
 * way to express "several unrelated aggregates in one statement" — each
 * db.select() is its own query by construction. The trade is that these column
 * names are no longer checked against the schema by TypeScript, so a rename in
 * schema.ts will not break this at compile time. scripts/pg-dialect-check.mjs
 * executes this exact statement against a Postgres engine to cover that gap.
 */
export async function getDashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  // Revenue counts DELIVERED orders only. Counting orders that were never
  // completed would flatter the figure and mislead the owner.
  const rows = (await db.execute(sql`
    select
      (select count(*) from orders) as total_orders,
      (select count(*) from orders
        where status in ('NEW', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY')) as pending_orders,
      (select count(*) from orders where status = 'DELIVERED') as completed_orders,
      (select count(*) from orders where status = 'CANCELLED') as cancelled_orders,
      (select coalesce(sum(total_cents), 0) from orders
        where status = 'DELIVERED') as sales_all_time_cents,
      (select coalesce(sum(total_cents), 0) from orders
        where status = 'DELIVERED' and created_at >= ${startOfMonth}) as sales_this_month_cents,
      (select count(*) from orders where created_at >= ${startOfToday}) as orders_today,
      (select count(*) from products) as product_count,
      (select count(*) from products where is_active) as active_products,
      (select count(*) from products where is_active and stock = 0) as out_of_stock,
      (select count(*) from products
        where is_active and stock > 0 and stock <= low_stock_at) as low_stock,
      (select count(*) from customers) as customer_count,
      (select count(*) from contact_messages where is_read = false) as unread_messages
  `)) as unknown as Array<Record<string, string | number | null>>;

  // Postgres returns count() and sum() as bigint and numeric, both of which
  // arrive in JavaScript as strings. Every figure goes through Number().
  const row = rows[0] ?? {};
  const value = (key: string) => Number(row[key] ?? 0);

  return {
    totalOrders: value('total_orders'),
    pendingOrders: value('pending_orders'),
    completedOrders: value('completed_orders'),
    cancelledOrders: value('cancelled_orders'),
    salesAllTimeCents: value('sales_all_time_cents'),
    salesThisMonthCents: value('sales_this_month_cents'),
    ordersToday: value('orders_today'),
    productCount: value('product_count'),
    activeProducts: value('active_products'),
    outOfStock: value('out_of_stock'),
    lowStock: value('low_stock'),
    customerCount: value('customer_count'),
    unreadMessages: value('unread_messages'),
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

export async function listAdminOrders(filters: {
  status?: string; q?: string; payment?: string; page?: number; perPage?: number;
}) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 25));

  const conditions = [];
  if (filters.status && filters.status !== 'ALL') conditions.push(eq(orders.status, filters.status as never));
  // "UNPAID" is a convenience rather than a stored value: it means anything
  // that is not settled yet, which is the list the owner works through when
  // reconciling cash and M-Pesa takings.
  if (filters.payment === 'UNPAID') conditions.push(ne(orders.paymentStatus, 'PAID'));
  else if (filters.payment && filters.payment !== 'ALL') {
    conditions.push(eq(orders.paymentStatus, filters.payment as never));
  }
  if (filters.q) {
    const like = escapeLike(filters.q);
    conditions.push(
      or(
        sql`${orders.orderNumber} ILIKE ${like} ESCAPE '\\'`,
        sql`${orders.customerName} ILIKE ${like} ESCAPE '\\'`,
        sql`${orders.customerPhone} ILIKE ${like} ESCAPE '\\'`,
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
            sql`${customers.name} ILIKE ${like} ESCAPE '\\'`,
            sql`${customers.phone} ILIKE ${like} ESCAPE '\\'`,
            sql`${customers.email} ILIKE ${like} ESCAPE '\\'`,
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
    .where(like ? or(sql`${products.name} ILIKE ${like} ESCAPE '\\'`, sql`${products.sku} ILIKE ${like} ESCAPE '\\'`) : undefined)
    .orderBy(desc(products.updatedAt))
    .limit(300);
}

export async function getAdminProduct(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product ?? null;
}
