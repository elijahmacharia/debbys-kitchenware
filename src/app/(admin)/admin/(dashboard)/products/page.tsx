import type { Metadata } from 'next';
import Link from 'next/link';
import { listAdminProducts } from '@/lib/queries/admin';
import { formatKsh } from '@/lib/money';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { ProductRowActions } from '@/components/admin/ProductRowActions';
import { PlusIcon, StoreIcon } from '@/components/icons';

export const metadata: Metadata = { title: 'Products', robots: { index: false, follow: false } };

export default async function AdminProductsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await listAdminProducts(q);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1>Products</h1>
          <p className="mt-1 text-sm text-muted">{products.length} product{products.length === 1 ? '' : 's'}{q ? ` matching “${q}”` : ''}</p>
        </div>
        <ButtonLink href="/admin/products/new"><PlusIcon className="h-4 w-4" />Add product</ButtonLink>
      </div>

      <form className="mt-4 flex gap-2" role="search">
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <input id="product-search" name="q" type="search" defaultValue={q ?? ''} placeholder="Search by name or SKU" className="input max-w-sm" />
        <button type="submit" className="btn-secondary">Search</button>
        {q ? <Link href="/admin/products" className="btn-ghost border border-line">Clear</Link> : null}
      </form>

      {products.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<StoreIcon className="h-8 w-8" />}
            title={q ? `No products match “${q}”` : 'No products yet'}
            description={q ? 'Try a different word, or clear the search.' : 'Add your first product to start selling.'}
            action={<ButtonLink href="/admin/products/new">Add a product</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[54rem] text-sm">
            <caption className="sr-only">All products with price, stock and visibility</caption>
            <thead className="bg-canvas text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">Product</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Category</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Price</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Stock</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Shown as</th>
                <th scope="col" className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {products.map((product) => (
                <tr key={product.id} className={product.isActive ? undefined : 'opacity-60'}>
                  <th scope="row" className="px-3 py-2.5 text-left font-medium">
                    <Link href={`/admin/products/${product.id}`} className="text-ink hover:text-clay-700">{product.name}</Link>
                    <span className="block font-mono text-[11px] font-normal text-subtle">{product.sku}</span>
                  </th>
                  <td className="px-3 py-2.5 text-muted">{product.categoryName}</td>
                  <td className="px-3 py-2.5">
                    {product.salePriceCents ? (
                      <>
                        <span className="font-semibold">{formatKsh(product.salePriceCents)}</span>
                        <s className="ml-1.5 text-xs text-subtle">{formatKsh(product.priceCents)}</s>
                      </>
                    ) : (
                      <span className="font-semibold">{formatKsh(product.priceCents)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={product.stock === 0 ? 'font-semibold text-danger' : product.stock <= product.lowStockAt ? 'font-semibold text-clay-700' : ''}>
                      {product.stock}
                    </span>
                    <span className="block text-[11px] text-subtle">{product.unitsSold} sold</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {!product.isActive ? <Badge tone="danger">Hidden</Badge> : null}
                      {product.isFeatured ? <Badge tone="brand">Featured</Badge> : null}
                      {product.isNewArrival ? <Badge tone="neutral">New</Badge> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <ProductRowActions
                      productId={product.id}
                      name={product.name}
                      slug={product.slug}
                      isActive={product.isActive}
                      isFeatured={product.isFeatured}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
