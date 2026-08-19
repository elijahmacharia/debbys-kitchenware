import type { Metadata } from 'next';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { CategoryManager, type AdminCategory } from '@/components/admin/CategoryManager';

export const metadata: Metadata = { title: 'Categories', robots: { index: false, follow: false } };

export default async function AdminCategoriesPage(
  { searchParams }: { searchParams: Promise<{ new?: string }> },
) {
  // ?new=1 opens the create form immediately, so the shortcuts on the
  // dashboard and the products page land somewhere useful.
  const openNew = (await searchParams).new === '1';
  // Includes inactive categories, unlike the public tree — staff need to see
  // and edit the ones they have hidden.
  const [rows, counts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ categoryId: products.categoryId, count: sql<number>`count(*)` }).from(products).groupBy(products.categoryId),
  ]);

  const countById = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));

  const nodes = new Map<string, AdminCategory>();
  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id, name: row.name, slug: row.slug, description: row.description, imageUrl: row.imageUrl,
      parentId: row.parentId, sortOrder: row.sortOrder, isActive: row.isActive,
      productCount: countById.get(row.id) ?? 0, children: [],
    });
  }

  const roots: AdminCategory[] = [];
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    const parent = row.parentId ? nodes.get(row.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const flatOptions = rows.filter((r) => !r.parentId).map((r) => ({ id: r.id, label: r.name }));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl sm:text-3xl">Categories</h1>
      <p className="mt-1 text-sm text-muted">
        Group your products into departments. A category with products in it cannot be deleted until
        those products are moved.
      </p>
      <div className="mt-5">
        <CategoryManager categories={roots} flatOptions={flatOptions} startCreating={openNew} />
      </div>
    </div>
  );
}
