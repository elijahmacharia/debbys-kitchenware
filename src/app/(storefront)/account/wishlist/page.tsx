import type { Metadata } from 'next';
import { getCurrentCustomer } from '@/lib/auth';
import { getWishlist } from '@/lib/queries/wishlist';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import { ProductGrid } from '@/components/product/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { HeartIcon } from '@/components/icons';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false, follow: false } };

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const items = await getWishlist(customer.id);
  // A saved item can be withdrawn from sale later; show it separately rather
  // than silently dropping something the customer chose to save.
  const available = items.filter((item) => item.isActive);
  const withdrawn = items.filter((item) => !item.isActive);

  const whatsappHref = waLink(generalEnquiryMessage());
  const wishlistedIds = new Set(items.map((item) => item.id));

  return (
    <div>
      <h1>Wishlist</h1>
      <p className="mt-1 text-sm text-muted">
        {items.length === 0 ? 'Items you save will appear here.' : `${items.length} saved item${items.length === 1 ? '' : 's'}.`}
      </p>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<HeartIcon className="h-8 w-8" />}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here."
            action={<ButtonLink href="/shop">Find something you like</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {available.length > 0 ? (
            <ProductGrid
              products={available.map((item) => ({
                id: item.id, name: item.name, slug: item.slug, sku: item.sku,
                priceCents: item.priceCents, salePriceCents: item.salePriceCents,
                stock: item.stock, lowStockAt: item.lowStockAt, unit: item.unit,
                isFeatured: item.isFeatured, isNewArrival: item.isNewArrival,
                categoryName: item.categoryName, categorySlug: item.categorySlug,
                imageUrl: item.imageUrl, imageAlt: item.imageAlt,
              }))}
              whatsappHref={whatsappHref}
              isSignedIn
              wishlistedIds={wishlistedIds}
            />
          ) : null}

          {withdrawn.length > 0 ? (
            <Alert tone="warning" title="No longer available">
              <ul className="mt-1 list-disc pl-4">
                {withdrawn.map((item) => <li key={item.id}>{item.name}</li>)}
              </ul>
              <p className="mt-1.5 text-xs">Withdrawn from sale. Ask us about something similar.</p>
            </Alert>
          ) : null}
        </div>
      )}
    </div>
  );
}
