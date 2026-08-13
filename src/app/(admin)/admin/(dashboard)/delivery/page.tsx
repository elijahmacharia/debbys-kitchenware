import type { Metadata } from 'next';
import { getAllDeliveryZones } from '@/lib/queries/content';
import { DeliveryZoneManager } from '@/components/admin/DeliveryZoneManager';

export const metadata: Metadata = { title: 'Delivery zones', robots: { index: false, follow: false } };

export default async function AdminDeliveryPage() {
  const zones = await getAllDeliveryZones();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl sm:text-3xl">Delivery zones</h1>
      <p className="mt-1 text-sm text-muted">
        The areas you deliver to, what each costs and how long it takes. Customers choose from these at
        checkout, and the fee you set here is what gets added to their total.
      </p>
      <div className="mt-5">
        <DeliveryZoneManager
          zones={zones.map((z) => ({
            id: z.id, name: z.name, county: z.county, feeCents: z.feeCents,
            etaText: z.etaText, note: z.note, isActive: z.isActive, sortOrder: z.sortOrder,
          }))}
        />
      </div>
    </div>
  );
}
