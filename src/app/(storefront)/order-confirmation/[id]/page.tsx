import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerSession, hasGuestOrderAccess } from '@/lib/auth';
import { getOrderForViewer } from '@/lib/queries/orders';
import { enabledPaymentMethods } from '@/lib/config';
import { orderMessage, waLink } from '@/lib/whatsapp';
import { OrderSummaryCard } from '@/components/order/OrderSummaryCard';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/Button';
import { WhatsAppOrderButton } from '@/components/product/WhatsAppOrderButton';
import { CheckIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Order confirmation',
  // Never indexable: it contains a customer's name, phone and address.
  robots: { index: false, follow: false, nocache: true },
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCustomerSession();

  const order = await getOrderForViewer(id, {
    customerId: session?.sub ?? null,
    guestHasAccess: await hasGuestOrderAccess(id),
  });

  // A wrong id and someone else's order look identical from outside: 404 both.
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
      note: order.customerNote ?? undefined,
    }),
  );

  return (
    <div className="container-site max-w-3xl py-8">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-700">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-4">Thank you, we have your order</h1>
        <p className="mt-1.5 text-sm text-muted">
          Your order number is <strong className="font-mono text-base text-ink">{order.orderNumber}</strong>. Please keep it for reference.
        </p>
      </div>

      {/*
        Deliberately worded so it never claims money has been received.
        Payment status stays "awaiting payment" until a person confirms it.
      */}
      <Alert tone="info" className="mt-5" title="What happens next">
        We have received your order but it is <strong>not paid or confirmed yet</strong>. We will contact
        you on <strong>{order.customerPhone}</strong> to confirm availability and, if you chose delivery,
        the delivery fee for your area.
      </Alert>

      {paymentMethod ? (
        <section className="card mt-4 p-4" aria-labelledby="how-to-pay">
          <h2 id="how-to-pay" className="text-sm font-bold">How to pay — {paymentMethod.label}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{paymentMethod.instructions}</p>
          <p className="mt-2 text-xs text-muted">Please do not send money to any number we have not confirmed with you directly.</p>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <WhatsAppOrderButton href={whatsappHref} label="Send this order on WhatsApp" source="order-confirmation" />
        <ButtonLink href="/contact" variant="secondary">Contact us</ButtonLink>
        <ButtonLink href="/shop" variant="ghost" className="border border-line">Continue shopping</ButtonLink>
      </div>

      <section className="card mt-6 p-4" aria-labelledby="tracking">
        <h2 id="tracking" className="mb-3 text-sm font-bold">Order status</h2>
        <OrderTimeline status={order.status} fulfilment={order.fulfilment} events={order.events} />
      </section>

      <div className="mt-4"><OrderSummaryCard order={order} /></div>

      {!session ? (
        <div className="card mt-6 bg-brand-50 p-4 text-center">
          <p className="text-sm font-semibold text-brand-900">Want to track future orders more easily?</p>
          <p className="mt-1 text-sm text-brand-800/80">
            Create an account to keep your order history, saved addresses and wishlist in one place. It is
            completely optional — you can keep checking out as a guest.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/register" size="sm">Create an account</ButtonLink>
            <ButtonLink href="/shop" size="sm" variant="secondary">No thanks, keep shopping</ButtonLink>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-muted">
          You can follow this order any time from <Link href="/account/orders" className="link">My orders</Link>.
        </p>
      )}
    </div>
  );
}
