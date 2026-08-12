import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getCategoryTree } from '@/lib/queries/categories';
import { getPriceCeiling, listProducts } from '@/lib/queries/products';
import { getCustomerSession } from '@/lib/auth';
import { getWishlistProductIds } from '@/lib/queries/wishlist';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import { buildPageHref, parseProductSearchParams, type RawSearchParams } from '@/lib/searchParams';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ShopFilters } from '@/components/shop/ShopFilters';
import { SortSelect } from '@/components/shop/SortSelect';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { PackageIcon } from '@/components/icons';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category not found' };

  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name.toLowerCase()} at affordable prices. Pickup or local delivery, and ordering on WhatsApp.`,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { title: category.name, description: category.description ?? undefined },
  };
}

export default async function CategoryPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> }) {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  // A missing or deactivated category is a genuine 404, not an empty shop page.
  if (!category) notFound();

  const filters = parseProductSearchParams(rawParams);
  const [result, tree, session, priceCeiling] = await Promise.all([
    listProducts({ ...filters, categorySlug: slug }),
    getCategoryTree(),
    getCustomerSession(),
    getPriceCeiling(),
  ]);

  const wishlisted = await getWishlistProductIds(session?.sub ?? null);
  const whatsappHref = waLink(generalEnquiryMessage());

  const crumbs: Crumb[] = [{ name: 'Home', href: '/' }, { name: 'Categories', href: '/categories' }];
  if (category.parent) crumbs.push({ name: category.parent.name, href: `/category/${category.parent.slug}` });
  crumbs.push({ name: category.name });

  const categories = tree.map((c) => ({
    name: c.name, slug: c.slug, productCount: c.productCount,
    children: c.children.map((child) => ({ name: child.name, slug: child.slug, productCount: child.productCount })),
  }));

  return (
    <div className="container-site py-6">
      <Breadcrumbs items={crumbs} />

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1>{category.name}</h1>
          {category.description ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{category.description}</p> : null}
          <p className="mt-1 text-sm text-muted">
            {result.total} product{result.total === 1 ? '' : 's'}
            {result.totalPages > 1 ? ` · page ${result.page} of ${result.totalPages}` : ''}
          </p>
        </div>
        <SortSelect />
      </div>

      {category.children.length > 0 ? (
        <nav aria-label="Subcategories" className="mt-4 flex flex-wrap gap-1.5">
          {category.children.map((child) => (
            <Link key={child.id} href={`/category/${child.slug}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-brand-300 hover:bg-brand-50">
              {child.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
        <ShopFilters categories={categories} priceCeilingCents={priceCeiling} lockedCategorySlug={slug} resultCount={result.total} />

        <div className="min-w-0">
          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageIcon className="h-8 w-8" />}
              title={`Nothing in ${category.name} right now`}
              description="Nothing here matches, or the category is empty. Try clearing the filters."
              action={
                <>
                  <ButtonLink href={`/category/${slug}`} variant="secondary">Clear filters</ButtonLink>
                  <ButtonLink href="/shop">Browse all products</ButtonLink>
                </>
              }
            />
          ) : (
            <>
              <ProductGrid products={result.items} whatsappHref={whatsappHref} isSignedIn={Boolean(session)} wishlistedIds={wishlisted} />
              <Pagination page={result.page} totalPages={result.totalPages} buildHref={(page) => buildPageHref(`/category/${slug}`, rawParams, page)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
