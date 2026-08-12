import type { MetadataRoute } from 'next';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { siteUrl } from '@/lib/config';

/**
 * Sitemap, generated from the live catalogue so a product added in the admin
 * dashboard becomes discoverable without anyone editing a file.
 *
 * Regenerated at most once an hour rather than frozen at build time — a shop
 * that adds products daily would otherwise ship a sitemap that is weeks stale.
 */
export const revalidate = 3600;

/** The pages that exist regardless of what is in the database. */
function staticRoutes(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/shop', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/categories', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/delivery', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/payment', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/returns', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/privacy-policy', priority: 0.2, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
  ];
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /*
   * The database is deliberately optional here.
   *
   * This is the only route Next renders during `next build`, so an unreachable
   * or not-yet-migrated database would otherwise fail the entire deployment —
   * which is exactly what happens on a first deploy to a host where the
   * database is provisioned separately. A sitemap missing its product URLs for
   * an hour is a small problem; a build that will not ship is a large one.
   */
  try {
    const [categoryRows, productRows] = await Promise.all([
      db.select({ slug: categories.slug, updatedAt: categories.updatedAt })
        .from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder)),
      db.select({ slug: products.slug, updatedAt: products.updatedAt })
        .from(products).where(eq(products.isActive, true)),
    ]);

    return [
      ...staticRoutes(),
      ...categoryRows.map((row) => ({
        url: `${siteUrl}/category/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...productRows.map((row) => ({
        url: `${siteUrl}/product/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error(
      '[sitemap] Could not read the catalogue, falling back to static pages only. ' +
      'If you see this in a deployment build, DATABASE_URL is not set or the schema has not been pushed yet.',
      error,
    );
    return staticRoutes();
  }
}
