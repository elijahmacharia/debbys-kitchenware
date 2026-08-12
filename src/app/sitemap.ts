import type { MetadataRoute } from 'next';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { siteUrl } from '@/lib/config';

/**
 * Sitemap generated from the live catalogue, so a product added in the admin
 * dashboard is discoverable without anyone editing a file. Only active
 * products and categories are listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
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

  const [categoryRows, productRows] = await Promise.all([
    db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder)),
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true)),
  ]);

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
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
}
