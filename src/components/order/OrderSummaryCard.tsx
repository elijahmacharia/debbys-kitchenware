import Image from 'next/image';
import Link from 'next/link';
import { formatKsh } from '@/lib/money';
import { ImageIcon } from '@/components/icons';
import { FULFILMENT_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/orders';
import { paymentMethodLabel } from '@/lib/config';

interface OrderLike {
  fulfilment: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryZoneName: string | null;
  county: string | null;
  town: string | null;
  area: string | null;
  estate: string | null;
  building: string | null;
  landmark: string | null;
  directions: string | null;
  customerNote: string | null;
  items: {
    id: string; name: string; sku: string; slug: string | null; imageUrl: string | null;
    unitPriceCents: number; quantity: number; lineTotalCents: number;
  }[];
}

/** Shared by the confirmation page and the customer's order detail page. */
export function OrderSummaryCard({ order }: { order: OrderLike }) {
  const addressLines = [
    order.deliveryZoneName && `Delivery area: ${order.deliveryZoneName}`,
    order.county && `County: ${order.county}`,
    order.town && `Town: ${order.town}`,
    order.area && `Area: ${order.area}`,
    order.estate && `Estate: ${order.estate}`,
    order.building && `Building: ${order.building}`,
    order.landmark && `Landmark: ${order.landmark}`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden" aria-label="Items ordered">
        <h2 className="border-b border-line px-4 py-3 text-sm font-bold">
          {order.items.length} item{order.items.length === 1 ? '' : 's'}
        </h2>
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 p-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-line bg-canvas">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />
                ) : (
                  <span className="grid h-full place-items-center text-subtle"><ImageIcon className="h-5 w-5" /></span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                {item.slug ? (
                  <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium text-ink hover:text-ink">{item.name}</Link>
                ) : (
                  <span className="line-clamp-2 text-sm font-medium text-ink">{item.name}</span>
                )}
                <span className="block text-xs text-muted">{item.quantity} × {formatKsh(item.unitPriceCents)} · {item.sku}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold">{formatKsh(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t border-line bg-canvas p-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatKsh(order.subtotalCents)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-muted">{order.fulfilment === 'PICKUP' ? 'Pickup' : 'Delivery'}</dt>
            <dd>
              {order.fulfilment === 'PICKUP'
                ? 'Free'
                : order.deliveryFeeCents === 0
                  ? <span className="text-xs text-muted">To be confirmed</span>
                  : formatKsh(order.deliveryFeeCents)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-1.5 text-base font-bold">
            <dt>Total</dt><dd>{formatKsh(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-4" aria-label="Your details">
          <h2 className="text-sm font-bold">Your details</h2>
          <div className="mt-2 space-y-1 text-sm text-muted">
            <p className="text-ink">{order.customerName}</p>
            <p>{order.customerPhone}</p>
            {order.customerEmail ? <p className="break-all">{order.customerEmail}</p> : null}
          </div>
        </section>

        <section className="card p-4" aria-label="Fulfilment">
          <h2 className="text-sm font-bold">{FULFILMENT_LABEL[order.fulfilment] ?? order.fulfilment}</h2>
          {order.fulfilment === 'DELIVERY' ? (
            <div className="mt-2 space-y-0.5 text-sm text-muted">
              {addressLines.map((line) => <p key={line}>{line}</p>)}
              {order.directions ? <p className="mt-1 italic">“{order.directions}”</p> : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">We will let you know as soon as your order is packed and ready to collect.</p>
          )}
        </section>

        <section className="card p-4 sm:col-span-2" aria-label="Payment">
          <h2 className="text-sm font-bold">Payment</h2>
          <p className="mt-1 text-sm text-muted">
            {paymentMethodLabel(order.paymentMethod)} ·{' '}
            <span className={order.paymentStatus === 'PAID' ? 'font-semibold text-success' : 'font-semibold text-clay-700'}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
            </span>
          </p>
          {order.customerNote ? (
            <>
              <h3 className="mt-3 text-sm font-bold">Your note</h3>
              <p className="mt-0.5 text-sm text-muted">{order.customerNote}</p>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
