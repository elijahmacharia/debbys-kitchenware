import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentCustomer } from '@/lib/auth';
import { getCustomerOrders } from '@/lib/queries/orders';
import { formatKsh } from '@/lib/money';
import { FULFILMENT_LABEL, PAYMENT_STATUS_LABEL, STATUS_META } from '@/lib/orders';
import { paymentMethodLabel } from '@/lib/config';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { ImageIcon, PackageIcon } from '@/components/icons';

export const metadata: Metadata = { title: 'My orders', robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await getCustomerOrders(customer.id);

  return (
    <div>
      <h1>My orders</h1>
      <p className="mt-1 text-sm text-muted">Newest first.</p>

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<PackageIcon className="h-8 w-8" />}
            title="You haven't placed any orders yet"
            description="Your orders and their progress will show here."
            action={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3">
                <div>
                  <p className="font-mono text-sm font-bold">{order.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <Badge tone={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'brand'}>
                  {STATUS_META[order.status as keyof typeof STATUS_META]?.label ?? order.status}
                </Badge>
              </div>

              <ul className="divide-y divide-line">
                {order.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-line bg-canvas">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt="" fill sizes="40px" className="object-contain p-0.5" />
                      ) : (
                        <span className="grid h-full place-items-center text-subtle"><ImageIcon className="h-4 w-4" /></span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                    <span className="shrink-0 text-xs text-muted">× {item.quantity}</span>
                  </li>
                ))}
                {order.items.length > 3 ? (
                  <li className="px-4 py-2 text-xs text-muted">
                    and {order.items.length - 3} more item{order.items.length - 3 === 1 ? '' : 's'}
                  </li>
                ) : null}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
                <div className="text-xs text-muted">
                  <p>{FULFILMENT_LABEL[order.fulfilment]} · {paymentMethodLabel(order.paymentMethod)}</p>
                  <p>{PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold">{formatKsh(order.totalCents)}</span>
                  <Link href={`/account/orders/${order.publicId}`} className="btn-secondary btn-sm">View details</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
