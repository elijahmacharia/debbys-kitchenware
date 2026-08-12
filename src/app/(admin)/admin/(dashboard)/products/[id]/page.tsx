import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { productImages, stockMovements } from '@/db/schema';
import { getAdminProduct } from '@/lib/queries/admin';
import { getCategoryOptions } from '@/lib/queries/categories';
import { ProductForm } from '@/components/admin/ProductForm';
import { ChevronLeftIcon, EyeIcon } from '@/components/icons';

export const metadata: Metadata = { title: 'Edit product', robots: { index: false, follow: false } };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  const [categoryOptions, images, movements] = await Promise.all([
    getCategoryOptions(),
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder)),
    db.select().from(stockMovements).where(eq(stockMovements.productId, id)).orderBy(stockMovements.createdAt).limit(12),
  ]);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-700">
        <ChevronLeftIcon className="h-4 w-4" /> Back to products
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1>{product.name}</h1>
        <Link href={`/product/${product.slug}`} target="_blank" className="btn-secondary btn-sm">
          <EyeIcon className="h-4 w-4" /> View in the shop
        </Link>
      </div>

      <div className="mt-5">
        <ProductForm
          categoryOptions={categoryOptions}
          product={{
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description,
            keywords: product.keywords,
            categoryId: product.categoryId,
            priceCents: product.priceCents,
            salePriceCents: product.salePriceCents,
            stock: product.stock,
            lowStockAt: product.lowStockAt,
            unit: product.unit,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            isNewArrival: product.isNewArrival,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
            images: images.map((image) => ({ url: image.url, alt: image.alt })),
          }}
        />
      </div>

      {movements.length > 0 ? (
        <section className="card mt-6 overflow-hidden" aria-labelledby="stock-history">
          <h2 id="stock-history" className="border-b border-line px-4 py-3 text-sm font-bold">Stock history</h2>
          <ul className="divide-y divide-line text-sm">
            {movements.map((movement) => (
              <li key={movement.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0">
                  <span className="block text-xs text-muted">
                    {new Date(movement.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className="block truncate">{movement.note ?? movement.reason}</span>
                </span>
                <span className={movement.delta >= 0 ? 'shrink-0 font-semibold text-success' : 'shrink-0 font-semibold text-danger'}>
                  {movement.delta >= 0 ? '+' : ''}{movement.delta}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
