import type { Metadata } from 'next';
import Link from 'next/link';
import { getActiveDeliveryZones } from '@/lib/queries/content';
import { getPublicSettings } from '@/lib/settings';
import { business, isPlaceholder } from '@/lib/config';
import { formatKsh } from '@/lib/money';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Alert } from '@/components/ui/Alert';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import { WhatsAppOrderButton } from '@/components/product/WhatsAppOrderButton';

export const metadata: Metadata = {
  title: 'Delivery & pickup',
  description: 'How delivery and shop pickup work, the areas we deliver to, and what it costs.',
  alternates: { canonical: '/delivery' },
};

export default async function DeliveryPage() {
  const [zones, settings] = await Promise.all([getActiveDeliveryZones(), getPublicSettings()]);
  const whatsappHref = waLink(generalEnquiryMessage());

  return (
    <div className="container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Delivery & pickup' }]} />
      <h1 className="mt-3">Delivery &amp; pickup</h1>

      <div className="prose-page mt-5">
        <h2>Collect at the shop</h2>
        <p>
          Pickup is free. Place your order, and we will let you know as soon as it is packed and ready.
          Bring your order number.
        </p>
        {!isPlaceholder(business.address) ? <p><strong className="text-ink">Where:</strong> {business.address}</p> : null}
        {!isPlaceholder(business.hours) ? <p><strong className="text-ink">When:</strong> {business.hours}</p> : null}

        <h2>Delivery</h2>
        {settings.deliveryNotice ? <p>{settings.deliveryNotice}</p> : null}
        <p>
          Choose delivery at checkout and pick your area. The fee for that area is added to your total
          before you confirm, so there are no surprises.
        </p>
      </div>

      {zones.length === 0 ? (
        <Alert tone="warning" className="mt-5" title="Delivery areas are not set up yet">
          No delivery zones have been switched on. For now, please choose shop pickup at checkout, or ask
          us about delivery to your area and we will arrange it directly.
        </Alert>
      ) : (
        <div className="mt-5 overflow-hidden rounded-card border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">Delivery areas, fees and estimated times</caption>
            <thead className="bg-canvas text-left">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">Area</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">County</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Fee</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Estimated time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink">{zone.name}</th>
                  <td className="px-4 py-2.5 text-muted">{zone.county}</td>
                  <td className="px-4 py-2.5">
                    {zone.feeCents === 0
                      ? <span className="text-muted">Confirmed with you</span>
                      : <span className="font-semibold">{formatKsh(zone.feeCents)}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{zone.etaText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="prose-page mt-8">
        <h2>What we need from you</h2>
        <p>
          Most homes here are found by landmark rather than street number, so at checkout we ask for your
          county, town and area, then the estate, building and nearest landmark. Anything else that helps
          the rider find you quickly — a shop opposite, the colour of a gate — goes in the directions box.
        </p>

        <h2>Not in a listed area?</h2>
        <p>
          Choose the closest option, or the &ldquo;other areas&rdquo; option if it is available, and we
          will confirm whether we can reach you and what it will cost before dispatching. You can also
          just ask us first.
        </p>

        <h2>Questions</h2>
        <p>
          See the <Link href="/faq">FAQ</Link>, or <Link href="/contact">contact us</Link>.
        </p>
      </div>

      {whatsappHref ? (
        <div className="mt-6">
          <WhatsAppOrderButton href={whatsappHref} label="Ask about delivery to my area" source="delivery-page" />
        </div>
      ) : null}
    </div>
  );
}
