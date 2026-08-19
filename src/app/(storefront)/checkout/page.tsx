import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { addresses } from '@/db/schema';
import { getActiveDeliveryZones } from '@/lib/queries/content';
import { getCurrentCustomer } from '@/lib/auth';
import { getPublicSettings } from '@/lib/settings';
import { business, enabledPaymentMethods, isPlaceholder } from '@/lib/config';
import { CheckoutForm } from '@/components/cart/CheckoutForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order, pickup or delivery, with M-Pesa or cash payment options.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [zones, customer, settings] = await Promise.all([
    getActiveDeliveryZones(),
    getCurrentCustomer(),
    getPublicSettings(),
  ]);

  const savedAddresses = customer
    ? await db.select().from(addresses).where(eq(addresses.customerId, customer.id)).orderBy(desc(addresses.isDefault), desc(addresses.createdAt))
    : [];

  return (
    <div className="no-tabbar container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Cart', href: '/cart' }, { name: 'Checkout' }]} />
      <h1 className="mt-3">Checkout</h1>
      <p className="mt-1 text-sm text-muted">No account required.</p>

      <div className="mt-5">
        <CheckoutForm
          zones={zones.map((zone) => ({
            id: zone.id, name: zone.name, county: zone.county,
            feeCents: zone.feeCents, etaText: zone.etaText, note: zone.note,
          }))}
          paymentMethods={enabledPaymentMethods().map((m) => ({
            key: m.key, label: m.label, instructions: m.instructions, appliesTo: m.appliesTo,
          }))}
          savedAddresses={savedAddresses.map((a) => ({
            id: a.id, label: a.label, recipientName: a.recipientName, phone: a.phone,
            county: a.county, town: a.town, area: a.area, estate: a.estate,
            building: a.building, landmark: a.landmark, directions: a.directions, isDefault: a.isDefault,
          }))}
          // Pre-fill only. Name and phone may be blank on an email or Google account,
          // and checkout asks for both regardless, so a blank prefill is fine.
          customer={customer ? { name: customer.name ?? '', phone: customer.phone ?? '', email: customer.email } : null}
          isSignedIn={Boolean(customer)}
          deliveryNotice={settings.deliveryNotice}
          paymentInstructions={settings.paymentInstructions}
          shopAddress={isPlaceholder(business.address) ? null : business.address}
        />
      </div>
    </div>
  );
}
