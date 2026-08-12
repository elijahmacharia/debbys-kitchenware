import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getActiveDeliveryZones } from '@/lib/queries/content';

export const metadata: Metadata = {
  title: 'Your cart',
  description: 'Review the items in your cart before checking out.',
  // A personal page has no business in search results.
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const zones = await getActiveDeliveryZones();

  return (
    <div className="container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Cart' }]} />
      <h1 className="mt-3">Your cart</h1>
      <div className="mt-5">
        <CartView deliveryAvailable={zones.length > 0} />
      </div>
    </div>
  );
}
