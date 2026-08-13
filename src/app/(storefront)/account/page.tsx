import type { Metadata } from 'next';
import Link from 'next/link';
import { count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { addresses, wishlistItems } from '@/db/schema';
import { getCurrentCustomer } from '@/lib/auth';
import { getCustomerOrders } from '@/lib/queries/orders';
import { formatKsh } from '@/lib/money';
import { STATUS_META, isTerminal } from '@/lib/orders';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { HeartIcon, MapPinIcon, PackageIcon } from '@/components/icons';

export const metadata: Metadata = { title: 'My account', robots: { index: false, follow: false } };

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null; // the layout has already redirected

  const [allOrders, wishlistCount, addressCount] = await Promise.all([
    getCustomerOrders(customer.id),
    db.select({ value: count() }).from(wishlistItems).where(eq(wishlistItems.customerId, customer.id)),
    db.select({ value: count() }).from(addresses).where(eq(addresses.customerId, customer.id)),
  ]);

  const active = allOrders.find((order) => !isTerminal(order.status));
  const recent = allOrders.slice(0, 3);
  const totalSpent = allOrders.filter((o) => o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1>Hello, {customer.name.split(' ')[0]} 👋</h1>
        
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total orders" value={String(allOrders.length)} href="/account/orders" />
        <Stat label="Completed" value={String(allOrders.filter((o) => o.status === 'DELIVERED').length)} />
        <Stat label="Saved addresses" value={String(addressCount[0].value)} href="/account/addresses" />
        <Stat label="Wishlist items" value={String(wishlistCount[0].value)} href="/account/wishlist" />
      </div>

      {active ? (
        <section className="card p-4" aria-labelledby="active-order">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="active-order" className="text-base font-bold">Your current order</h2>
              <p className="mt-0.5 text-sm text-muted">
                <span className="font-mono">{active.orderNumber}</span> ·{' '}
                {new Date(active.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })} · {formatKsh(active.totalCents)}
              </p>
            </div>
            <Badge tone="brand">{STATUS_META[active.status as keyof typeof STATUS_META]?.label ?? active.status}</Badge>
          </div>
          <div className="mt-4">
            <OrderTimeline status={active.status} fulfilment={active.fulfilment} events={[]} />
          </div>
          <ButtonLink href={`/account/orders/${active.publicId}`} variant="secondary" size="sm" className="mt-4">
            View order details
          </ButtonLink>
        </section>
      ) : null}

      <section aria-labelledby="recent-orders">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-orders" className="text-base font-bold">Recent orders</h2>
          {allOrders.length > 3 ? <Link href="/account/orders" className="text-sm font-semibold text-ink hover:underline">View all</Link> : null}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<PackageIcon className="h-8 w-8" />}
            title="You have not placed any orders yet"
            description="Your orders will show here."
            action={<ButtonLink href="/shop">Start shopping</ButtonLink>}
          />
        ) : (
          <ul className="space-y-2">
            {recent.map((order) => (
              <li key={order.id}>
                <Link href={`/account/orders/${order.publicId}`} className="card flex flex-wrap items-center justify-between gap-3 p-3 hover:border-ink">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-ink">{order.orderNumber}</p>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })} ·{' '}
                      {order.items.length} item{order.items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{formatKsh(order.totalCents)}</span>
                    <Badge tone={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'brand'}>
                      {STATUS_META[order.status as keyof typeof STATUS_META]?.label ?? order.status}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/account/addresses" className="card flex items-center gap-3 p-4 hover:border-ink">
          <MapPinIcon className="h-5 w-5 shrink-0 text-clay-600" />
          <span>
            <span className="block text-sm font-semibold">Saved addresses</span>
            <span className="block text-xs text-muted">Make repeat orders faster</span>
          </span>
        </Link>
        <Link href="/account/wishlist" className="card flex items-center gap-3 p-4 hover:border-ink">
          <HeartIcon className="h-5 w-5 shrink-0 text-clay-600" />
          <span>
            <span className="block text-sm font-semibold">Wishlist</span>
            <span className="block text-xs text-muted">Items you saved for later</span>
          </span>
        </Link>
      </div>

      {totalSpent > 0 ? (
        <p className="text-center text-xs text-muted">
          Total on completed orders: <span className="font-semibold text-ink">{formatKsh(totalSpent)}</span>
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </>
  );
  return href ? <Link href={href} className="card p-3 hover:border-ink">{body}</Link> : <div className="card p-3">{body}</div>;
}
