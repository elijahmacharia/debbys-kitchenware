import type { Metadata } from 'next';
import Link from 'next/link';
import { getPriceCeiling, listProducts } from '@/lib/queries/products';
import { getCategoryTree } from '@/lib/queries/categories';
import { getCustomerSession } from '@/lib/auth';
import { getWishlistProductIds } from '@/lib/queries/wishlist';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import { buildPageHref, parseProductSearchParams, type RawSearchParams } from '@/lib/searchParams';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ShopFilters } from '@/components/shop/ShopFilters';
import { CategoryChips } from '@/components/shop/CategoryChips';
import { SortSelect } from '@/components/shop/SortSelect';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { SearchIcon } from '@/components/icons';
import { trackSearch } from '@/lib/serverTrack';

export const metadata: Metadata = {
  title: 'Shop all products',
  description:
    'Browse the full range of kitchenware, household goods, plastic products, storage and cleaning items. Filter by category, price and availability.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const rawParams = await searchParams;
  const filters = parseProductSearchParams(rawParams);

  const [result, tree, session, priceCeiling] = await Promise.all([
    listProducts(filters),
    getCategoryTree(),
    getCustomerSession(),
    getPriceCeiling(),
  ]);

  const wishlisted = await getWishlistProductIds(session?.sub ?? null);
  const whatsappHref = waLink(generalEnquiryMessage());

  if (filters.q) await trackSearch(filters.q, result.total);

  const categories = tree.map((c) => ({
    name: c.name, slug: c.slug, productCount: c.productCount,
    children: c.children.map((child) => ({ name: child.name, slug: child.slug, productCount: child.productCount })),
  }));

  return (
    <div className="container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Shop' }]} />

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>{filters.q ? `Search results for “${filters.q}”` : 'All products'}</h1>
          <p className="mt-1 text-sm text-muted">
            {result.total === 0
              ? 'No products match your filters'
              : `${result.total} product${result.total === 1 ? '' : 's'}${result.totalPages > 1 ? ` · page ${result.page} of ${result.totalPages}` : ''}`}
          </p>
        </div>
        <SortSelect />
      </div>

      <div className="mt-5">
        <CategoryChips categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
        <ShopFilters categories={categories} priceCeilingCents={priceCeiling} resultCount={result.total} />

        <div className="min-w-0">
          {result.items.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="h-8 w-8" />}
              title={filters.q ? `No products match “${filters.q}”` : 'No products match these filters'}
              description={
                filters.q
                  ? 'Try a shorter word or check the spelling. We may still have it in the shop, ask us.'
                  : 'Try widening the price range or clearing a filter.'
              }
              action={
                <>
                  <ButtonLink href="/shop" variant="secondary">Clear filters</ButtonLink>
                  <ButtonLink href="/categories">Browse categories</ButtonLink>
                </>
              }
            />
          ) : (
            <>
              <ProductGrid products={result.items} whatsappHref={whatsappHref} isSignedIn={Boolean(session)} wishlistedIds={wishlisted} />
              <Pagination page={result.page} totalPages={result.totalPages} buildHref={(page) => buildPageHref('/shop', rawParams, page)} />
            </>
          )}

          {result.items.length > 0 && result.totalPages <= 1 ? (
            <p className="mt-8 text-center text-sm text-muted">
              Looking for something else? <Link href="/contact" className="link">Ask us</Link>.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
