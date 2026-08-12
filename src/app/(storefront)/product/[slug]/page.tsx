import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts, incrementProductView } from '@/lib/queries/products';
import { getCustomerSession } from '@/lib/auth';
import { getWishlistProductIds } from '@/lib/queries/wishlist';
import { getActiveDeliveryZones } from '@/lib/queries/content';
import { siteUrl } from '@/lib/config';
import { effectivePriceCents } from '@/lib/money';
import { generalEnquiryMessage, productEnquiryMessage, waLink } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PurchasePanel } from '@/components/product/PurchasePanel';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { SectionHeader } from '@/components/ui/Section';
import { ProductJsonLd } from '@/components/seo/JsonLd';
import { StoreIcon, TruckIcon } from '@/components/icons';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };

  const title = product.metaTitle || product.name;
  const description =
    product.metaDescription ||
    `${product.name}, ${product.description.slice(0, 140).trim()}${product.description.length > 140 ? '…' : ''}`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${siteUrl}/product/${product.slug}`,
      // No `images` here on purpose: opengraph-image.tsx in this folder
      // generates a PNG, and an explicit entry would override it with the
      // product's SVG, which social platforms will not render.
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [session, related, zones] = await Promise.all([
    getCustomerSession(),
    getRelatedProducts(product.id, product.categoryId, 4),
    getActiveDeliveryZones(),
  ]);

  const wishlisted = await getWishlistProductIds(session?.sub ?? null);

  // Popularity counter and analytics. Neither can throw — see implementations.
  await Promise.all([incrementProductView(product.id), track('PRODUCT_VIEW', product.sku)]);

  const unitPrice = effectivePriceCents(product);
  const whatsappHref = waLink(
    productEnquiryMessage({ name: product.name, sku: product.sku, priceCents: unitPrice, url: `${siteUrl}/product/${product.slug}` }),
  );
  const genericWhatsapp = waLink(generalEnquiryMessage());

  const crumbs: Crumb[] = [{ name: 'Home', href: '/' }, { name: 'Shop', href: '/shop' }];
  if (product.parentCategory) crumbs.push({ name: product.parentCategory.name, href: `/category/${product.parentCategory.slug}` });
  crumbs.push({ name: product.categoryName, href: `/category/${product.categorySlug}` });
  crumbs.push({ name: product.name });

  return (
    <div className="container-site py-6">
      <ProductJsonLd product={product} images={product.images.map((i) => i.url)} categoryName={product.categoryName} />

      <Breadcrumbs items={crumbs} />

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <Link href={`/category/${product.categorySlug}`} className="text-xs font-medium uppercase tracking-wide text-brand-700 hover:underline">
            {product.categoryName}
          </Link>

          <h1 className="mt-1.5">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Price product={product} size="lg" />
            <StockBadge stock={product.stock} lowStockAt={product.lowStockAt} />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Price per {product.unit} · SKU <span className="font-mono">{product.sku}</span>
            {product.stock > 0 ? ` · ${product.stock} available` : ''}
          </p>

          {product.stock <= 0 ? (
            <Alert tone="warning" className="mt-4" title="Out of stock">
              {genericWhatsapp ? 'Message us and we will tell you when it is back.' : 'Contact us to check when it is back.'}
            </Alert>
          ) : null}

          <div className="mt-5">
            <PurchasePanel
              productSlug={product.slug}
              isSignedIn={Boolean(session)}
              isWishlisted={wishlisted.has(product.id)}
              whatsappHref={whatsappHref}
              line={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                sku: product.sku,
                imageUrl: product.images[0]?.url ?? null,
                unitPriceCents: unitPrice,
                listPriceCents: product.priceCents,
                stock: product.stock,
                unit: product.unit,
              }}
            />
          </div>

          <section className="mt-7 border-t border-line pt-5" aria-labelledby="product-description">
            <h2 id="product-description" className="text-base font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{product.description}</p>
          </section>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <div className="card flex gap-2.5 p-3">
              <StoreIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold">Collect at the shop</p>
                <p className="text-xs leading-snug text-muted">Free. We will tell you when it is ready.</p>
              </div>
            </div>
            <div className="card flex gap-2.5 p-3">
              <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold">Delivery</p>
                <p className="text-xs leading-snug text-muted">
                  {zones.length > 0
                    ? `${zones.length} area${zones.length === 1 ? '' : 's'}. Fee shown at checkout.`
                    : 'Ask us about your area.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-12" aria-labelledby="related">
          <SectionHeader id="related" title="You might also like" href={`/category/${product.categorySlug}`} linkLabel="See category" />
          <ProductGrid products={related} whatsappHref={genericWhatsapp} isSignedIn={Boolean(session)} wishlistedIds={wishlisted} priorityCount={0} />
        </section>
      ) : null}
    </div>
  );
}
