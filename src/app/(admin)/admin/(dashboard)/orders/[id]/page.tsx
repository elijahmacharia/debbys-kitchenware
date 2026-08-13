import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { orderEvents } from '@/db/schema';
import { getAdminOrder } from '@/lib/queries/admin';
import { formatKsh } from '@/lib/money';
import { allowedNextStatuses, FULFILMENT_LABEL, PAYMENT_STATUS_LABEL, STATUS_META } from '@/lib/orders';
import { paymentMethodLabel } from '@/lib/config';
import { Badge } from '@/components/ui/Badge';
import { OrderControls } from '@/components/admin/OrderControls';
import { ChevronLeftIcon, ImageIcon, WhatsAppIcon } from '@/components/icons';
import { whatsappNumber } from '@/lib/config';

export const metadata: Metadata = { title: 'Order', robots: { index: false, follow: false } };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(asc(orderEvents.createdAt));

  // A direct chat link to this customer, prefilled with their order number.
  const customerDigits = order.customerPhone.replace(/\D/g, '');
  const customerWhatsapp = customerDigits.length >= 9 && whatsappNumber()
    ? `https://wa.me/${customerDigits}?text=${encodeURIComponent(`Hello ${order.customerName}, about your order ${order.orderNumber}:`)}`
    : null;

  const addressLines = [
    order.deliveryZoneName && `Zone: ${order.deliveryZoneName}`,
    order.county && `County: ${order.county}`,
    order.town && `Town: ${order.town}`,
    order.area && `Area: ${order.area}`,
    order.estate && `Estate: ${order.estate}`,
    order.building && `Building: ${order.building}`,
    order.landmark && `Landmark: ${order.landmark}`,
  ].filter(Boolean) as string[];

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-clay-700">
        <ChevronLeftIcon className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl sm:text-2xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">
            {new Date(order.createdAt).toLocaleString('en-KE', { dateStyle: 'long', timeStyle: 'short' })}
            {order.channel === 'WHATSAPP' ? ' · started on WhatsApp' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'brand'}>
            {STATUS_META[order.status as keyof typeof STATUS_META]?.label ?? order.status}
          </Badge>
          {customerWhatsapp ? (
            <a href={customerWhatsapp} target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-sm">
              <WhatsAppIcon className="h-4 w-4" /> Message customer
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-4">
          <section className="card overflow-hidden" aria-labelledby="items">
            <h2 id="items" className="border-b border-line px-4 py-3 text-sm font-bold">
              {order.items.length} item{order.items.length === 1 ? '' : 's'}
            </h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 p-3">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-line bg-canvas">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-contain p-0.5" />
                    ) : (
                      <span className="grid h-full place-items-center text-subtle"><ImageIcon className="h-4 w-4" /></span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{item.name}</span>
                    <span className="block font-mono text-[11px] text-subtle">{item.sku}</span>
                  </span>
                  <span className="shrink-0 text-right text-sm">
                    <span className="block">{item.quantity} × {formatKsh(item.unitPriceCents)}</span>
                    <span className="block font-semibold">{formatKsh(item.lineTotalCents)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line bg-canvas p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatKsh(order.subtotalCents)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-muted">{FULFILMENT_LABEL[order.fulfilment]}</dt>
                <dd>{order.fulfilment === 'PICKUP' ? 'Free' : order.deliveryFeeCents === 0 ? 'To be confirmed' : formatKsh(order.deliveryFeeCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5 text-base font-bold">
                <dt>Total</dt><dd>{formatKsh(order.totalCents)}</dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="card p-4" aria-labelledby="customer">
              <h2 id="customer" className="text-sm font-bold">Customer</h2>
              <div className="mt-2 space-y-1 text-sm text-muted">
                <p className="font-medium text-ink">{order.customerName}</p>
                <p><a href={`tel:${order.customerPhone}`} className="link">{order.customerPhone}</a></p>
                {order.customerEmail ? <p className="break-all">{order.customerEmail}</p> : null}
                <p className="pt-1 text-xs">{order.customerId ? 'Has an account' : 'Guest checkout'}</p>
              </div>
            </section>

            <section className="card p-4" aria-labelledby="fulfil">
              <h2 id="fulfil" className="text-sm font-bold">{FULFILMENT_LABEL[order.fulfilment]}</h2>
              {order.fulfilment === 'DELIVERY' ? (
                <div className="mt-2 space-y-0.5 text-sm text-muted">
                  {addressLines.map((line) => <p key={line}>{line}</p>)}
                  {order.directions ? <p className="mt-1 italic">“{order.directions}”</p> : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Collecting at the shop.</p>
              )}
            </section>

            <section className="card p-4 sm:col-span-2" aria-labelledby="payment">
              <h2 id="payment" className="text-sm font-bold">Payment</h2>
              <p className="mt-1 text-sm text-muted">
                {paymentMethodLabel(order.paymentMethod)} ·{' '}
                <span className={order.paymentStatus === 'PAID' ? 'font-semibold text-success' : 'font-semibold text-clay-700'}>
                  {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                </span>
                {order.paymentReference ? <> · code <span className="font-mono">{order.paymentReference}</span></> : null}
              </p>
              {order.customerNote ? (
                <>
                  <h3 className="mt-3 text-sm font-bold">Customer&apos;s note</h3>
                  <p className="mt-0.5 text-sm text-muted">{order.customerNote}</p>
                </>
              ) : null}
            </section>
          </div>

          <section className="card overflow-hidden" aria-labelledby="history">
            <h2 id="history" className="border-b border-line px-4 py-3 text-sm font-bold">History</h2>
            <ul className="divide-y divide-line text-sm">
              {events.map((event) => (
                <li key={event.id} className="px-4 py-2.5">
                  <p className="font-medium">{STATUS_META[event.status as keyof typeof STATUS_META]?.label ?? event.status}</p>
                  <p className="text-xs text-muted">
                    {new Date(event.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {event.note ? <p className="mt-0.5 text-xs text-muted">{event.note}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <OrderControls
          orderId={order.id}
          currentStatus={order.status}
          allowedStatuses={allowedNextStatuses(order.status, order.fulfilment)}
          paymentStatus={order.paymentStatus}
          paymentReference={order.paymentReference}
          adminNote={order.adminNote}
        />
      </div>
    </div>
  );
}
