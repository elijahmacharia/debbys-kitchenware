'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  categories, deliveryZones, orderEvents, orderItems, orders, productImages, products, stockMovements,
} from '@/db/schema';
import { getCurrentAdmin } from '@/lib/auth';
import { uniqueSlug } from '@/lib/slug';
import { parseShillingsToCents } from '@/lib/money';
import { allowedNextStatuses } from '@/lib/orders';
import { paymentMethodLabel } from '@/lib/config';
import {
  categorySchema, deliveryZoneSchema, fieldErrors, orderStatusSchema, paymentUpdateSchema,
  productSchema, stockAdjustSchema,
} from '@/lib/validation';
import { saveSettings } from '@/lib/settings';

/**
 * ADMIN SERVER ACTIONS
 *
 * Every action starts with requireAdmin(). A server action is a real HTTP
 * endpoint with a generated name — it is NOT protected by the fact that the
 * page calling it sits behind a layout check. Someone who knows the action id
 * can invoke it directly, so authorisation lives here, in the action itself.
 */

export interface ActionResult {
  ok: boolean;
  message?: string;
  fields?: Record<string, string>;
}

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('UNAUTHORISED');
  return admin;
}

/** Turns an unexpected throw into a message the dashboard can display. */
async function guard(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORISED') {
      return { ok: false, message: 'Your session has expired. Please sign in again.' };
    }
    console.error('[admin-action]', error);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}

const bool = (form: FormData, key: string) => form.get(key) === 'on' || form.get(key) === 'true';
const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

// ---------------------------------------------------------------- Products

export async function saveProductAction(productId: string | null, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();

    const priceCents = parseShillingsToCents(str(form, 'price'));
    const saleRaw = str(form, 'salePrice');
    const salePriceCents = saleRaw ? parseShillingsToCents(saleRaw) : null;

    if (priceCents === null) return { ok: false, fields: { priceCents: 'Enter a valid price, e.g. 450 or 450.50' } };
    if (saleRaw && salePriceCents === null) return { ok: false, fields: { salePriceCents: 'Enter a valid sale price' } };

    const imageUrls = form.getAll('imageUrl').map(String).filter((url) => url.trim().length > 0);
    const imageAlts = form.getAll('imageAlt').map(String);

    const parsed = productSchema.safeParse({
      name: str(form, 'name'),
      sku: str(form, 'sku'),
      description: str(form, 'description'),
      keywords: str(form, 'keywords'),
      categoryId: str(form, 'categoryId'),
      priceCents,
      salePriceCents,
      stock: str(form, 'stock'),
      lowStockAt: str(form, 'lowStockAt') || 5,
      unit: str(form, 'unit') || 'each',
      isActive: bool(form, 'isActive'),
      isFeatured: bool(form, 'isFeatured'),
      isNewArrival: bool(form, 'isNewArrival'),
      metaTitle: str(form, 'metaTitle') || undefined,
      metaDescription: str(form, 'metaDescription') || undefined,
      images: imageUrls.map((url, index) => ({
        url: url.trim(),
        alt: (imageAlts[index] ?? '').trim() || str(form, 'name'),
      })),
    });

    if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
    const data = parsed.data;

    // SKU is the owner's own identifier for the item and must stay unique.
    const skuClash = await db
      .select({ id: products.id })
      .from(products)
      .where(productId ? and(eq(products.sku, data.sku), ne(products.id, productId)) : eq(products.sku, data.sku))
      .limit(1);
    if (skuClash.length > 0) return { ok: false, fields: { sku: 'Another product already uses this SKU' } };

    if (productId) {
      const [existing] = await db
        .select({ slug: products.slug, name: products.name, stock: products.stock })
        .from(products).where(eq(products.id, productId)).limit(1);
      if (!existing) return { ok: false, message: 'That product no longer exists.' };

      // The slug only changes when the name changes, so existing links and any
      // search ranking a product has built up are not thrown away on an edit.
      const slug = existing.name === data.name
        ? existing.slug
        : await uniqueSlug(data.name, async (candidate) => {
            const rows = await db.select({ id: products.id }).from(products)
              .where(and(eq(products.slug, candidate), ne(products.id, productId))).limit(1);
            return rows.length > 0;
          });

      const stockDelta = data.stock - existing.stock;

      await db.transaction(async (tx) => {
        await tx.update(products).set({
          name: data.name, slug, sku: data.sku, description: data.description, keywords: data.keywords ?? '',
          categoryId: data.categoryId, priceCents: data.priceCents,
          salePriceCents: data.salePriceCents || null,
          stock: data.stock, lowStockAt: data.lowStockAt, unit: data.unit,
          isActive: data.isActive, isFeatured: data.isFeatured, isNewArrival: data.isNewArrival,
          metaTitle: data.metaTitle ?? null, metaDescription: data.metaDescription ?? null,
        }).where(eq(products.id, productId));

        // Images are replaced wholesale; the form always posts the full set.
        await tx.delete(productImages).where(eq(productImages.productId, productId));
        for (const [index, image] of data.images.entries()) {
          await tx.insert(productImages).values({ productId, url: image.url, alt: image.alt, sortOrder: index });
        }

        if (stockDelta !== 0) {
          await tx.insert(stockMovements).values({
            productId, delta: stockDelta, reason: 'ADJUSTMENT', note: 'Edited in the product form',
          });
        }
      });
    } else {
      const slug = await uniqueSlug(data.name, async (candidate) => {
        const rows = await db.select({ id: products.id }).from(products).where(eq(products.slug, candidate)).limit(1);
        return rows.length > 0;
      });

      await db.transaction(async (tx) => {
        const [created] = await tx.insert(products).values({
          name: data.name, slug, sku: data.sku, description: data.description, keywords: data.keywords ?? '',
          categoryId: data.categoryId, priceCents: data.priceCents,
          salePriceCents: data.salePriceCents || null,
          stock: data.stock, lowStockAt: data.lowStockAt, unit: data.unit,
          isActive: data.isActive, isFeatured: data.isFeatured, isNewArrival: data.isNewArrival,
          metaTitle: data.metaTitle ?? null, metaDescription: data.metaDescription ?? null,
        }).returning({ id: products.id });

        for (const [index, image] of data.images.entries()) {
          await tx.insert(productImages).values({ productId: created.id, url: image.url, alt: image.alt, sortOrder: index });
        }

        if (data.stock > 0) {
          await tx.insert(stockMovements).values({
            productId: created.id, delta: data.stock, reason: 'INITIAL', note: 'Opening stock',
          });
        }
      });
    }

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/');
    return { ok: true, message: productId ? 'Product updated' : 'Product created' };
  });
}

/**
 * Products are DEACTIVATED rather than deleted when they have order history:
 * deleting would break the record of what was sold. A product nobody has ever
 * ordered is removed properly.
 */
export async function deleteProductAction(productId: string): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();

    const sold = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.productId, productId)).limit(1);

    if (sold.length > 0) {
      await db.update(products).set({ isActive: false, isFeatured: false, isNewArrival: false }).where(eq(products.id, productId));
      revalidatePath('/admin/products');
      revalidatePath('/shop');
      return {
        ok: true,
        message: 'This product has been sold before, so it was hidden from the shop instead of deleted. Your order history stays intact.',
      };
    }

    await db.delete(products).where(eq(products.id, productId));
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    return { ok: true, message: 'Product deleted' };
  });
}

export async function toggleProductFlagAction(
  productId: string,
  flag: 'isActive' | 'isFeatured' | 'isNewArrival',
  value: boolean,
): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();
    // `flag` is a narrow union, so this cannot be used to write another column.
    await db.update(products).set({ [flag]: value }).where(eq(products.id, productId));
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/');
    return { ok: true };
  });
}

// -------------------------------------------------------------- Inventory

export async function adjustStockAction(form: FormData): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();

    const parsed = stockAdjustSchema.safeParse({
      productId: str(form, 'productId'),
      newStock: str(form, 'newStock'),
      note: str(form, 'note') || undefined,
    });
    if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };

    const [current] = await db.select({ stock: products.stock, name: products.name })
      .from(products).where(eq(products.id, parsed.data.productId)).limit(1);
    if (!current) return { ok: false, message: 'That product no longer exists.' };

    const delta = parsed.data.newStock - current.stock;
    if (delta === 0) return { ok: true, message: 'Stock is already at that figure.' };

    await db.transaction(async (tx) => {
      await tx.update(products).set({ stock: parsed.data.newStock }).where(eq(products.id, parsed.data.productId));
      await tx.insert(stockMovements).values({
        productId: parsed.data.productId,
        delta,
        reason: delta > 0 ? 'RESTOCK' : 'ADJUSTMENT',
        note: parsed.data.note ?? 'Stock count adjustment',
      });
    });

    revalidatePath('/admin/inventory');
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    return { ok: true, message: `${current.name}: stock set to ${parsed.data.newStock}` };
  });
}

// ------------------------------------------------------------- Categories

export async function saveCategoryAction(categoryId: string | null, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();

    const parentRaw = str(form, 'parentId');
    const parsed = categorySchema.safeParse({
      name: str(form, 'name'),
      description: str(form, 'description') || undefined,
      imageUrl: str(form, 'imageUrl') || undefined,
      parentId: parentRaw || null,
      sortOrder: str(form, 'sortOrder') || 0,
      isActive: bool(form, 'isActive'),
    });
    if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };
    const data = parsed.data;

    // A category cannot be its own parent — that would create a cycle the tree
    // builder would never finish walking.
    if (categoryId && data.parentId === categoryId) {
      return { ok: false, fields: { parentId: 'A category cannot be inside itself' } };
    }

    if (categoryId) {
      const [existing] = await db.select({ name: categories.name, slug: categories.slug })
        .from(categories).where(eq(categories.id, categoryId)).limit(1);
      if (!existing) return { ok: false, message: 'That category no longer exists.' };

      const slug = existing.name === data.name
        ? existing.slug
        : await uniqueSlug(data.name, async (candidate) => {
            const rows = await db.select({ id: categories.id }).from(categories)
              .where(and(eq(categories.slug, candidate), ne(categories.id, categoryId))).limit(1);
            return rows.length > 0;
          });

      await db.update(categories).set({
        name: data.name, slug, description: data.description ?? null,
        imageUrl: data.imageUrl ?? null, parentId: data.parentId ?? null,
        sortOrder: data.sortOrder, isActive: data.isActive,
      }).where(eq(categories.id, categoryId));
    } else {
      const slug = await uniqueSlug(data.name, async (candidate) => {
        const rows = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, candidate)).limit(1);
        return rows.length > 0;
      });
      await db.insert(categories).values({
        name: data.name, slug, description: data.description ?? null,
        imageUrl: data.imageUrl ?? null, parentId: data.parentId ?? null,
        sortOrder: data.sortOrder, isActive: data.isActive,
      });
    }

    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    revalidatePath('/');
    return { ok: true, message: categoryId ? 'Category updated' : 'Category created' };
  });
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();

    // Refuse rather than orphan products or subcategories, and tell the owner
    // exactly what to move first.
    const [productCount] = await db.select({ value: sql<number>`count(*)` })
      .from(products).where(eq(products.categoryId, categoryId));
    if (Number(productCount.value) > 0) {
      return {
        ok: false,
        message: `This category still holds ${productCount.value} product(s). Move them to another category first, or set the category to inactive to hide it.`,
      };
    }

    const [childCount] = await db.select({ value: sql<number>`count(*)` })
      .from(categories).where(eq(categories.parentId, categoryId));
    if (Number(childCount.value) > 0) {
      return { ok: false, message: 'This category has subcategories. Delete or move those first.' };
    }

    await db.delete(categories).where(eq(categories.id, categoryId));
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    return { ok: true, message: 'Category deleted' };
  });
}

export async function reorderCategoryAction(categoryId: string, direction: 'up' | 'down'): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();
    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!category) return { ok: false, message: 'That category no longer exists.' };

    await db.update(categories)
      .set({ sortOrder: Math.max(0, category.sortOrder + (direction === 'up' ? -15 : 15)) })
      .where(eq(categories.id, categoryId));

    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    return { ok: true };
  });
}

// ----------------------------------------------------------------- Orders

export async function updateOrderStatusAction(orderId: string, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdmin();

    const parsed = orderStatusSchema.safeParse({
      status: str(form, 'status'),
      note: str(form, 'note') || undefined,
    });
    if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return { ok: false, message: 'That order no longer exists.' };

    // Enforce a sensible progression: an order cannot go from Delivered back
    // to Processing, and a pickup order cannot become "out for delivery".
    const allowed = allowedNextStatuses(order.status, order.fulfilment) as string[];
    if (!allowed.includes(parsed.data.status)) {
      return { ok: false, message: `An order that is "${order.status}" cannot move to "${parsed.data.status}".` };
    }

    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({
        orderId, status: parsed.data.status, note: parsed.data.note ?? null, actorAdminId: admin.id,
      });

      // Cancelling returns the stock to the shelf, and records why.
      if (parsed.data.status === 'CANCELLED') {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        for (const item of items) {
          if (!item.productId) continue;
          await tx.update(products).set({
            stock: sql`${products.stock} + ${item.quantity}`,
            unitsSold: sql`MAX(0, ${products.unitsSold} - ${item.quantity})`,
          }).where(eq(products.id, item.productId));
          await tx.insert(stockMovements).values({
            productId: item.productId,
            delta: item.quantity,
            reason: 'CANCELLED_ORDER',
            note: `Order ${order.orderNumber} cancelled`,
            orderId,
          });
        }
      }
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/dashboard');
    return { ok: true, message: `Order marked as ${parsed.data.status.replace(/_/g, ' ').toLowerCase()}` };
  });
}

export async function updateOrderPaymentAction(orderId: string, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();

    const parsed = paymentUpdateSchema.safeParse({
      paymentStatus: str(form, 'paymentStatus'),
      paymentReference: str(form, 'paymentReference') || undefined,
    });
    if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };

    await db.update(orders).set({
      paymentStatus: parsed.data.paymentStatus,
      paymentReference: parsed.data.paymentReference ?? null,
    }).where(eq(orders.id, orderId));

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return { ok: true, message: 'Payment status updated' };
  });
}

/**
 * One click to record that an order has been paid for.
 *
 * This exists because almost every payment this shop takes is cash on delivery
 * or an M-Pesa transfer that lands outside the website. The owner is not
 * changing a status so much as ticking a box after money arrives, and that
 * should not require opening an order, finding a dropdown and pressing save.
 *
 * An M-Pesa transaction code can be passed as the reference so there is
 * something to check a statement against later. Cash has no code, so the note
 * simply records that it was cash.
 *
 * Already-paid orders are left alone rather than treated as an error: a double
 * click, or two people marking the same order, should be harmless.
 */
export async function markOrderPaidAction(orderId: string, reference?: string): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdmin();

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return { ok: false, message: 'That order no longer exists.' };
    if (order.paymentStatus === 'PAID') return { ok: true, message: 'That order was already marked paid.' };

    const trimmed = reference?.trim().slice(0, 60) || null;

    await db.transaction(async (tx) => {
      await tx.update(orders)
        .set({ paymentStatus: 'PAID', paymentReference: trimmed ?? order.paymentReference })
        .where(eq(orders.id, orderId));

      // Recorded against the order so there is an audit trail of who confirmed
      // the money and when, which matters when takings are reconciled.
      await tx.insert(orderEvents).values({
        orderId,
        status: order.status,
        note: trimmed
          ? `Payment received (${paymentMethodLabel(order.paymentMethod)}), ref ${trimmed}`
          : `Payment received (${paymentMethodLabel(order.paymentMethod)})`,
        actorAdminId: admin.id,
      });
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/dashboard');
    return { ok: true, message: 'Marked as paid' };
  });
}

export async function saveOrderNoteAction(orderId: string, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();
    const note = str(form, 'adminNote').slice(0, 1000);
    await db.update(orders).set({ adminNote: note || null }).where(eq(orders.id, orderId));
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, message: 'Note saved' };
  });
}

// --------------------------------------------------------- Delivery zones

export async function saveDeliveryZoneAction(zoneId: string | null, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();

    const feeCents = parseShillingsToCents(str(form, 'fee') || '0');
    if (feeCents === null) return { ok: false, fields: { feeCents: 'Enter a valid fee, e.g. 150' } };

    const parsed = deliveryZoneSchema.safeParse({
      name: str(form, 'name'),
      county: str(form, 'county') || 'Nairobi',
      feeCents,
      etaText: str(form, 'etaText') || '1-2 days',
      note: str(form, 'note') || undefined,
      isActive: bool(form, 'isActive'),
      sortOrder: str(form, 'sortOrder') || 0,
    });
    if (!parsed.success) return { ok: false, fields: fieldErrors(parsed.error) };

    const clash = await db.select({ id: deliveryZones.id }).from(deliveryZones)
      .where(zoneId ? and(eq(deliveryZones.name, parsed.data.name), ne(deliveryZones.id, zoneId)) : eq(deliveryZones.name, parsed.data.name))
      .limit(1);
    if (clash.length > 0) return { ok: false, fields: { name: 'A zone with this name already exists' } };

    if (zoneId) await db.update(deliveryZones).set(parsed.data).where(eq(deliveryZones.id, zoneId));
    else await db.insert(deliveryZones).values(parsed.data);

    revalidatePath('/admin/delivery');
    revalidatePath('/delivery');
    revalidatePath('/checkout');
    return { ok: true, message: zoneId ? 'Delivery zone updated' : 'Delivery zone created' };
  });
}

export async function deleteDeliveryZoneAction(zoneId: string): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();
    // Orders keep a snapshot of the zone name, so removing the row does not
    // damage history; the foreign key is set to null.
    await db.delete(deliveryZones).where(eq(deliveryZones.id, zoneId));
    revalidatePath('/admin/delivery');
    revalidatePath('/delivery');
    return { ok: true, message: 'Delivery zone deleted' };
  });
}

// --------------------------------------------------------------- Settings

export async function saveSettingsAction(form: FormData): Promise<ActionResult> {
  return guard(async () => {
    await requireAdmin();
    const values: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') values[key] = value;
    }
    // saveSettings ignores any key that is not in its allow-list.
    await saveSettings(values);
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Settings saved' };
  });
}
