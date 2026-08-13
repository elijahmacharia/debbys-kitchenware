import type { Metadata } from 'next';
import Link from 'next/link';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { getDashboardStats } from '@/lib/queries/admin';
import { StockAdjustForm } from '@/components/admin/StockAdjustForm';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Inventory', robots: { index: false, follow: false } };

export default async function AdminInventoryPage({
  searchParams,
}: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const stats = await getDashboardStats();

  const base = db
    .select({
      id: products.id, name: products.name, sku: products.sku, slug: products.slug,
      stock: products.stock, lowStockAt: products.lowStockAt, isActive: products.isActive,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id));

  const rows =
    filter === 'out'
      ? await base.where(eq(products.stock, 0)).orderBy(asc(products.name))
      : filter === 'low'
        ? await base.where(sql`${products.stock} > 0 AND ${products.stock} <= ${products.lowStockAt}`).orderBy(asc(products.stock))
        : await base.orderBy(asc(products.stock), asc(products.name));

  const tabs = [
    { key: '', label: `All (${stats.productCount})` },
    { key: 'low', label: `Low stock (${stats.lowStock})` },
    { key: 'out', label: `Out of stock (${stats.outOfStock})` },
  ];

  return (
    <div>
      <h1>Inventory</h1>
      <p className="mt-1 text-sm text-muted">
        Type the number you counted on the shelf and press Set. Every change is recorded with a reason,
        so you can trace how a figure got where it is.
      </p>

      <nav className="mt-4 flex flex-wrap gap-1.5" aria-label="Stock filter">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/admin/inventory?filter=${tab.key}` : '/admin/inventory'}
            aria-current={(filter ?? '') === tab.key ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm',
              (filter ?? '') === tab.key ? 'border-clay-600 bg-clay-600 text-white' : 'border-line bg-surface hover:bg-clay-50',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {stats.outOfStock > 0 && filter !== 'out' ? (
        <Alert tone="warning" className="mt-4">
          {stats.outOfStock} product{stats.outOfStock === 1 ? ' is' : 's are'} out of stock. Customers can
          see them but cannot order them.
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Nothing here. 
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">Products and their current stock levels</caption>
            <thead className="bg-canvas text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">Product</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Category</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">In stock</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Warn at</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Set new count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {rows.map((row) => (
                <tr key={row.id} className={row.isActive ? undefined : 'opacity-60'}>
                  <th scope="row" className="px-3 py-2.5 text-left font-medium">
                    <Link href={`/admin/products/${row.id}`} className="text-ink hover:text-clay-700">{row.name}</Link>
                    <span className="block font-mono text-[11px] font-normal text-subtle">{row.sku}</span>
                  </th>
                  <td className="px-3 py-2.5 text-muted">{row.categoryName}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn('font-semibold', row.stock === 0 ? 'text-danger' : row.stock <= row.lowStockAt ? 'text-clay-700' : 'text-ink')}>
                      {row.stock}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{row.lowStockAt}</td>
                  <td className="px-3 py-2.5"><StockAdjustForm productId={row.id} currentStock={row.stock} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
