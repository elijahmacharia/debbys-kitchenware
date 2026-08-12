import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { categories, products } from '@/db/schema';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  children: CategoryNode[];
}

/**
 * The whole active category tree with product counts, built from two queries
 * regardless of how many categories exist. Counts roll up: a parent shows the
 * total of its own products plus those of its children, which is what the
 * customer actually sees when they click through.
 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const counts = await db
    .select({ categoryId: products.categoryId, count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, true))
    .groupBy(products.categoryId);

  const countById = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));

  const nodes = new Map<string, CategoryNode>();
  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id, name: row.name, slug: row.slug, description: row.description,
      imageUrl: row.imageUrl, productCount: countById.get(row.id) ?? 0, children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    const parent = row.parentId ? nodes.get(row.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const rollUp = (node: CategoryNode): number => {
    node.productCount += node.children.reduce((sum, child) => sum + rollUp(child), 0);
    return node.productCount;
  };
  roots.forEach(rollUp);

  return roots;
}

export async function getCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);
  if (!category) return null;

  const children = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(and(eq(categories.parentId, category.id), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  let parent: { name: string; slug: string } | null = null;
  if (category.parentId) {
    const [row] = await db
      .select({ name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, category.parentId))
      .limit(1);
    parent = row ?? null;
  }

  return { ...category, children, parent };
}

/** Flat list for admin dropdowns, with children indented under their parent. */
export async function getCategoryOptions() {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  const roots = rows.filter((r) => !r.parentId);
  const options: { id: string; label: string; isActive: boolean }[] = [];
  for (const root of roots) {
    options.push({ id: root.id, label: root.name, isActive: root.isActive });
    for (const child of rows.filter((r) => r.parentId === root.id)) {
      options.push({ id: child.id, label: `   ${child.name}`, isActive: child.isActive });
    }
  }
  return options;
}

/** Top-level categories only, for the homepage tiles and header menu. */
export async function getTopCategories(limit = 6) {
  const tree = await getCategoryTree();
  return tree.filter((c) => c.productCount > 0 || c.children.length > 0).slice(0, limit);
}
