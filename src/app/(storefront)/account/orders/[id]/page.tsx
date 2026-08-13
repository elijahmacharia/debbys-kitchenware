import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import { getCustomerOrderById } from '@/lib/queries/orders';
import { enabledPaymentMethods } from '@/lib/config';
import { orderMessage, waLink } from '@/lib/whatsapp';
import { OrderSummaryCard } from '@/components/order/OrderSummaryCard';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { WhatsAppOrderButton } from '@/components/product/WhatsAppOrderButton';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { STATUS_META } from '@/lib/orders';
import { ChevronLeftIcon } from '@/components/icons';

export const metadata: Metadata = { title: 'Order details', robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const { id } = await params;
  // Scoped to this customer inside the query — another customer's order id
  // simply does not match and produces a 404.
  const order = await getCustomerOrderById(customer.id, id);
  if (!order) notFound();

  const paymentMethod = enabledPaymentMethods().find((m) => m.key === order.paymentMethod);

  const whatsappHref = waLink(
    orderMessage({
      orderNumber: order.orderNumber,
      lines: order.items.map((item) => ({ name: item.name, quantity: item.quantity, unitPriceCents: item.unitPriceCents })),
      subtotalCents: order.subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      totalCents: order.totalCents,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      fulfilment: order.fulfilment as 'DELIVERY' | 'PICKUP',
      county: order.county ?? undefined,
      town: order.town ?? undefined,
      area: order.area ?? undefined,
      estate: order.estate ?? undefined,
      landmark: order.landmark ?? undefined,
      directions: order.directions ?? undefined,
    }),
  );

  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeftIcon className="h-4 w-4" />
        Back to my orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl sm:text-2xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">
            Placed {new Date(order.createdAt).toLocaleString('en-KE', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <Badge tone={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'brand'}>
          {STATUS_META[order.status as keyof typeof STATUS_META]?.label ?? order.status}
        </Badge>
      </div>

      <section className="card mt-5 p-4" aria-labelledby="progress">
        <h2 id="progress" className="mb-3 text-sm font-bold">Progress</h2>
        <OrderTimeline status={order.status} fulfilment={order.fulfilment} events={order.events} />
      </section>

      {order.paymentStatus === 'PENDING' && paymentMethod && order.status !== 'CANCELLED' ? (
        <section className="card mt-4 border-clay-200 bg-clay-50/60 p-4" aria-labelledby="pay">
          <h2 id="pay" className="text-sm font-bold text-clay-700">Payment still outstanding</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink">{paymentMethod.instructions}</p>
        </section>
      ) : null}

      <div className="mt-4"><OrderSummaryCard order={order} /></div>

      <div className="mt-5 flex flex-wrap gap-2">
        <WhatsAppOrderButton href={whatsappHref} label="Ask about this order" source="order-detail" />
        <ButtonLink href="/contact" variant="secondary">Contact us</ButtonLink>
        <ButtonLink href="/shop" variant="ghost" className="border border-line">Shop again</ButtonLink>
      </div>
    </div>
  );
}
