/**
 * Debby's Kitchenware — database schema (Drizzle ORM, SQLite dialect).
 *
 * Conventions used throughout:
 *  - Money is stored as an INTEGER number of CENTS. Never floats: 0.1 + 0.2
 *    does not equal 0.3 in binary floating point, and an invoice cannot be
 *    "nearly" right.
 *  - Timestamps are unix epoch integers, surfaced as JS Dates.
 *  - Primary keys are 24-character random strings, not sequential integers, so
 *    nothing in a URL can be guessed or enumerated.
 *  - Order rows snapshot the product name, SKU and price at the time of sale,
 *    so editing or deleting a product later never rewrites order history.
 *
 * Moving to PostgreSQL: swap `drizzle-orm/sqlite-core` for `drizzle-orm/pg-core`
 * and change the driver in src/db/index.ts. See docs/TECHNICAL.md.
 */
import { relations, sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createId } from '../lib/id';

const id = () => text('id').primaryKey().$defaultFn(() => createId());
const createdAt = () => integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`);
const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date());
/** SQLite has no native boolean; 0/1 with a typed wrapper keeps TS honest. */
const bool = (name: string, fallback = false) => integer(name, { mode: 'boolean' }).notNull().default(fallback);

// --- Staff -------------------------------------------------------------------

export const adminUsers = sqliteTable('admin_users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['OWNER', 'STAFF'] }).notNull().default('OWNER'),
  isActive: bool('is_active', true),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// --- Customers ---------------------------------------------------------------

export const customers = sqliteTable('customers', {
  id: id(),
  name: text('name').notNull(),
  /** Stored normalised as +254XXXXXXXXX. The primary login identifier. */
  phone: text('phone').notNull(),
  email: text('email'),
  passwordHash: text('password_hash').notNull(),
  isActive: bool('is_active', true),
  marketingOptIn: bool('marketing_opt_in', false),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  phoneIdx: uniqueIndex('customers_phone_key').on(t.phone),
  emailIdx: uniqueIndex('customers_email_key').on(t.email),
  createdIdx: index('customers_created_idx').on(t.createdAt),
}));

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: id(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  /** SHA-256 of the token. The raw value only ever exists in the reset link. */
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: createdAt(),
}, (t) => ({ customerIdx: index('reset_customer_idx').on(t.customerId) }));

export const addresses = sqliteTable('addresses', {
  id: id(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  label: text('label').notNull().default('Home'),
  recipientName: text('recipient_name').notNull(),
  phone: text('phone').notNull(),
  county: text('county').notNull(),
  town: text('town').notNull(),
  area: text('area').notNull(),
  estate: text('estate'),
  building: text('building'),
  landmark: text('landmark'),
  directions: text('directions'),
  isDefault: bool('is_default', false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({ customerIdx: index('addresses_customer_idx').on(t.customerId) }));

// --- Catalogue ---------------------------------------------------------------

export const categories = sqliteTable('categories', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  /** Self-reference: top-level categories have a null parent. */
  parentId: text('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: bool('is_active', true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  parentIdx: index('categories_parent_idx').on(t.parentId),
  sortIdx: index('categories_sort_idx').on(t.sortOrder),
}));

export const products = sqliteTable('products', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  description: text('description').notNull(),
  /** Extra search terms, comma separated. e.g. "ndoo, pail, water container" */
  keywords: text('keywords').notNull().default(''),
  categoryId: text('category_id').notNull().references(() => categories.id),

  priceCents: integer('price_cents').notNull(),
  /** Null means not on sale. Validation keeps it below the normal price. */
  salePriceCents: integer('sale_price_cents'),

  stock: integer('stock').notNull().default(0),
  lowStockAt: integer('low_stock_at').notNull().default(5),

  isActive: bool('is_active', true),
  isFeatured: bool('is_featured', false),
  isNewArrival: bool('is_new_arrival', false),
  unit: text('unit').notNull().default('each'),

  viewCount: integer('view_count').notNull().default(0),
  unitsSold: integer('units_sold').notNull().default(0),

  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),

  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  categoryIdx: index('products_category_idx').on(t.categoryId),
  featuredIdx: index('products_featured_idx').on(t.isActive, t.isFeatured),
  newIdx: index('products_new_idx').on(t.isActive, t.isNewArrival),
  listIdx: index('products_list_idx').on(t.isActive, t.createdAt),
  priceIdx: index('products_price_idx').on(t.priceCents),
}));

export const productImages = sqliteTable('product_images', {
  id: id(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  /** Required, not optional: alt text is both accessibility and image SEO. */
  alt: text('alt').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => ({ productIdx: index('product_images_product_idx').on(t.productId, t.sortOrder) }));

/** Every stock change, with a reason, so a wrong number can be traced. */
export const stockMovements = sqliteTable('stock_movements', {
  id: id(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  /** Negative for sales and shrinkage, positive for restocks. */
  delta: integer('delta').notNull(),
  reason: text('reason', { enum: ['ORDER', 'RESTOCK', 'ADJUSTMENT', 'CANCELLED_ORDER', 'DAMAGE', 'INITIAL'] }).notNull(),
  note: text('note'),
  orderId: text('order_id'),
  createdAt: createdAt(),
}, (t) => ({ productIdx: index('stock_movements_product_idx').on(t.productId, t.createdAt) }));

// --- Cart & wishlist ---------------------------------------------------------

export const cartItems = sqliteTable('cart_items', {
  id: id(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  updatedAt: updatedAt(),
}, (t) => ({ uniq: uniqueIndex('cart_items_customer_product_key').on(t.customerId, t.productId) }));

export const wishlistItems = sqliteTable('wishlist_items', {
  id: id(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
}, (t) => ({ uniq: uniqueIndex('wishlist_customer_product_key').on(t.customerId, t.productId) }));

// --- Delivery ----------------------------------------------------------------

export const deliveryZones = sqliteTable('delivery_zones', {
  id: id(),
  name: text('name').notNull().unique(),
  county: text('county').notNull().default('Nairobi'),
  /** Fee in cents. 0 is a valid, deliberate "confirm with customer" value. */
  feeCents: integer('fee_cents').notNull(),
  etaText: text('eta_text').notNull().default('1-2 days'),
  note: text('note'),
  isActive: bool('is_active', true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({ activeIdx: index('delivery_zones_active_idx').on(t.isActive, t.sortOrder) }));

// --- Orders ------------------------------------------------------------------

export const orders = sqliteTable('orders', {
  id: id(),
  /** Shown to the customer: DK-2608-0042. Short enough to read over a call. */
  orderNumber: text('order_number').notNull().unique(),
  /** Random id used in URLs so guest orders cannot be enumerated. */
  publicId: text('public_id').notNull().unique().$defaultFn(() => createId()),

  /** Null for guest orders — guests still get a complete order record. */
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),

  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),

  fulfilment: text('fulfilment', { enum: ['DELIVERY', 'PICKUP'] }).notNull(),
  status: text('status', {
    enum: ['NEW', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  }).notNull().default('NEW'),

  paymentMethod: text('payment_method').notNull(),
  /**
   * Always starts PENDING. Only a human marking the M-Pesa message as received
   * moves it to PAID — the site never claims a payment succeeded.
   */
  paymentStatus: text('payment_status', { enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'] }).notNull().default('PENDING'),
  paymentReference: text('payment_reference'),

  // Address snapshot, frozen at order time.
  deliveryZoneId: text('delivery_zone_id').references(() => deliveryZones.id, { onDelete: 'set null' }),
  deliveryZoneName: text('delivery_zone_name'),
  county: text('county'),
  town: text('town'),
  area: text('area'),
  estate: text('estate'),
  building: text('building'),
  landmark: text('landmark'),
  directions: text('directions'),
  mapUrl: text('map_url'),

  subtotalCents: integer('subtotal_cents').notNull(),
  deliveryFeeCents: integer('delivery_fee_cents').notNull().default(0),
  discountCents: integer('discount_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull(),

  customerNote: text('customer_note'),
  /** Staff-only. Never returned by any customer-facing query. */
  adminNote: text('admin_note'),
  channel: text('channel', { enum: ['WEB', 'WHATSAPP'] }).notNull().default('WEB'),

  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  customerIdx: index('orders_customer_idx').on(t.customerId, t.createdAt),
  statusIdx: index('orders_status_idx').on(t.status, t.createdAt),
  createdIdx: index('orders_created_idx').on(t.createdAt),
  phoneIdx: index('orders_phone_idx').on(t.customerPhone),
}));

export const orderItems = sqliteTable('order_items', {
  id: id(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  /** Nullable on purpose: deleting a product must not destroy sales history. */
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  slug: text('slug'),
  imageUrl: text('image_url'),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotalCents: integer('line_total_cents').notNull(),
}, (t) => ({ orderIdx: index('order_items_order_idx').on(t.orderId) }));

/** Status history. Drives the customer-facing tracking timeline. */
export const orderEvents = sqliteTable('order_events', {
  id: id(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  note: text('note'),
  actorAdminId: text('actor_admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (t) => ({ orderIdx: index('order_events_order_idx').on(t.orderId, t.createdAt) }));

// --- Site content ------------------------------------------------------------

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: updatedAt(),
});

export const testimonials = sqliteTable('testimonials', {
  id: id(),
  authorName: text('author_name').notNull(),
  location: text('location'),
  body: text('body').notNull(),
  rating: integer('rating').notNull().default(5),
  /** Hidden until the owner publishes it. Nothing is invented on their behalf. */
  isPublished: bool('is_published', false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
});

export const contactMessages = sqliteTable('contact_messages', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  isRead: bool('is_read', false),
  createdAt: createdAt(),
}, (t) => ({ readIdx: index('contact_read_idx').on(t.isRead, t.createdAt) }));

/** Cookieless, first-party event counts. No personal data is recorded. */
export const analyticsEvents = sqliteTable('analytics_events', {
  id: id(),
  type: text('type').notNull(),
  label: text('label'),
  valueCents: integer('value_cents'),
  createdAt: createdAt(),
}, (t) => ({ typeIdx: index('analytics_type_idx').on(t.type, t.createdAt) }));

// --- Relations ---------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: 'tree' }),
  children: many(categories, { relationName: 'tree' }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  stockMovements: many(stockMovements),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  deliveryZone: one(deliveryZones, { fields: [orders.deliveryZoneId], references: [deliveryZones.id] }),
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

// --- Inferred types ----------------------------------------------------------

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
