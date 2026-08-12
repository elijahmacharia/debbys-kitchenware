import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { addresses } from '@/db/schema';
import { getCurrentCustomer } from '@/lib/auth';
import { AddressManager } from '@/components/account/AddressManager';

export const metadata: Metadata = { title: 'Saved addresses', robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.customerId, customer.id))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

  return (
    <div className="max-w-2xl">
      <h1>Saved addresses</h1>
      <p className="mt-1 text-sm text-muted">Save the places we deliver to so repeat orders take seconds.</p>
      <div className="mt-5">
        <AddressManager
          addresses={rows.map((a) => ({
            id: a.id, label: a.label, recipientName: a.recipientName, phone: a.phone,
            county: a.county, town: a.town, area: a.area, estate: a.estate,
            building: a.building, landmark: a.landmark, directions: a.directions, isDefault: a.isDefault,
          }))}
        />
      </div>
    </div>
  );
}
