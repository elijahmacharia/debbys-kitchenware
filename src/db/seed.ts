/**
 * Seeds the database with the demo catalogue, delivery zones, editable
 * settings and the first admin account.
 *
 * Safe to re-run: it clears the tables it owns first. It refuses to touch a
 * database that already contains orders unless you pass --force, so a mistyped
 * command cannot wipe a live shop.
 *
 *   npm run db:seed
 *   npm run db:seed -- --force
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db } from './index';
import {
  adminUsers, addresses, analyticsEvents, cartItems, categories, contactMessages,
  customers, deliveryZones, orderEvents, orderItems, orders, passwordResetTokens,
  productImages, products, settings, stockMovements, testimonials, wishlistItems,
} from './schema';
import { SEED_CATEGORIES, SEED_DELIVERY_ZONES, SEED_PRODUCTS } from './seed-data';
import { placeholderSvg } from './placeholder-image';
import { slugify } from '../lib/slug';

const force = process.argv.includes('--force');
const IMAGE_DIR = path.join(process.cwd(), 'public', 'demo-images');

async function main() {
  const existingOrders = await db.select({ id: orders.id }).from(orders).limit(1);
  if (existingOrders.length > 0 && !force) {
    console.error(
      '\nRefusing to seed: this database already contains orders.\n' +
      'Seeding deletes the catalogue and all order history.\n' +
      'If you are certain, run:  npm run db:seed -- --force\n',
    );
    process.exit(1);
  }

  console.log('Clearing existing data...');
  // Children before parents so foreign keys stay satisfied.
  await db.delete(orderEvents);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(cartItems);
  await db.delete(wishlistItems);
  await db.delete(passwordResetTokens);
  await db.delete(addresses);
  await db.delete(customers);
  await db.delete(stockMovements);
  await db.delete(productImages);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(deliveryZones);
  await db.delete(testimonials);
  await db.delete(contactMessages);
  await db.delete(analyticsEvents);
  await db.delete(settings);
  await db.delete(adminUsers);

  // --- Admin account ---------------------------------------------------------
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'owner@debbyskitchenware.co.ke').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (!adminPassword || adminPassword.startsWith('[') || adminPassword.length < 8) {
    console.error(
      '\nSEED_ADMIN_PASSWORD is missing, too short, or still a placeholder.\n' +
      'Set it in .env (at least 8 characters) before seeding.\n',
    );
    process.exit(1);
  }
  await db.insert(adminUsers).values({
    email: adminEmail,
    name: process.env.SEED_ADMIN_NAME ?? 'Debby',
    passwordHash: await bcrypt.hash(adminPassword, 12),
    role: 'OWNER',
  });
  console.log(`Admin account created for ${adminEmail}`);

  // --- Categories ------------------------------------------------------------
  const categoryIdByName = new Map<string, string>();
  let sort = 0;
  for (const parent of SEED_CATEGORIES) {
    sort += 10;
    const [row] = await db.insert(categories).values({
      name: parent.name, slug: slugify(parent.name), description: parent.description, sortOrder: sort,
    }).returning({ id: categories.id });
    categoryIdByName.set(parent.name, row.id);

    let childSort = 0;
    for (const child of parent.children ?? []) {
      childSort += 10;
      const [childRow] = await db.insert(categories).values({
        name: child.name, slug: slugify(child.name), description: child.description,
        parentId: row.id, sortOrder: childSort,
      }).returning({ id: categories.id });
      categoryIdByName.set(child.name, childRow.id);
    }
  }
  console.log(`${categoryIdByName.size} categories created`);

  // --- Products --------------------------------------------------------------
  mkdirSync(IMAGE_DIR, { recursive: true });
  let created = 0;
  for (const item of SEED_PRODUCTS) {
    const categoryId = categoryIdByName.get(item.category);
    if (!categoryId) {
      console.warn(`Skipping ${item.sku}: unknown category "${item.category}"`);
      continue;
    }

    const [product] = await db.insert(products).values({
      name: item.name,
      slug: slugify(item.name),
      sku: item.sku,
      description: item.description,
      keywords: item.keywords,
      categoryId,
      priceCents: item.price * 100,
      salePriceCents: item.salePrice ? item.salePrice * 100 : null,
      stock: item.stock,
      lowStockAt: 5,
      unit: item.unit ?? 'each',
      isFeatured: Boolean(item.featured),
      isNewArrival: Boolean(item.newArrival),
      // A little variation so the "Popular" sort has something to order by.
      viewCount: Math.floor(item.stock * 1.7),
      unitsSold: Math.max(0, Math.floor(item.stock / 4)),
    }).returning({ id: products.id });

    const fileName = `${item.sku.toLowerCase()}.svg`;
    writeFileSync(path.join(IMAGE_DIR, fileName), placeholderSvg(item.shape, item.name, item.sku), 'utf8');

    await db.insert(productImages).values({
      productId: product.id,
      url: `/demo-images/${fileName}`,
      alt: `${item.name} — ${item.category} at Debby's Kitchenware`,
      sortOrder: 0,
    });

    await db.insert(stockMovements).values({
      productId: product.id, delta: item.stock, reason: 'INITIAL', note: 'Demo seed data',
    });

    created += 1;
  }
  console.log(`${created} demo products created with placeholder images`);

  // --- Delivery zones --------------------------------------------------------
  for (const zone of SEED_DELIVERY_ZONES) {
    await db.insert(deliveryZones).values({
      name: zone.name,
      county: zone.county,
      feeCents: 0,
      etaText: zone.etaText,
      // Off by default: a real fee has to be set by the owner first.
      isActive: false,
      sortOrder: zone.sortOrder,
      note: 'Set your real delivery fee and switch this zone on before going live.',
    });
  }
  console.log(`${SEED_DELIVERY_ZONES.length} delivery zones created (inactive until you set real fees)`);

  // --- Settings --------------------------------------------------------------
  await db.insert(settings).values([
    {
      key: 'shop.announcement',
      value: 'Demo catalogue — products, prices and delivery fees are placeholders and are not yet the real ones.',
    },
    {
      key: 'delivery.notice',
      value: 'Delivery fees depend on your area. If your area is not listed, choose "Other areas" and we will confirm the fee with you on WhatsApp before dispatch.',
    },
    {
      key: 'payment.instructions',
      value: 'After placing your order we will confirm it on WhatsApp and share payment details. Please do not send money to any number that we have not confirmed with you directly.',
    },
    { key: 'policy.returns', value: '' },
    { key: 'policy.privacy', value: '' },
    { key: 'policy.terms', value: '' },
    { key: 'about.extra', value: '' },
  ]);

  console.log('\nSeed complete.');
  console.log('Sign in at /admin/login with the SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from your .env');
  console.log('Change that password straight away after your first sign-in.\n');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
