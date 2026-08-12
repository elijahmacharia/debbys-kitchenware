import type { Metadata } from 'next';
import Link from 'next/link';
import { getDashboardStats, getLowStockProducts, getPopularProducts, getRecentOrders } from '@/lib/queries/admin';
import { formatKsh } from '@/lib/money';
import { STATUS_META } from '@/lib/orders';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  const [stats, recent, popular, lowStock] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(8),
    getPopularProducts(5),
    getLowStockProducts(6),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="mt-1 text-sm text-muted">How the shop is doing right now.</p>
      </div>

      {stats.pendingOrders > 0 ? (
        <Alert tone="warning" title={`${stats.pendingOrders} order${stats.pendingOrders === 1 ? '' : 's'} need attention`}>
          These are placed but not yet delivered or cancelled.{' '}
          <Link href="/admin/orders" className="font-semibold underline">Open orders</Link>
        </Alert>
      ) : null}

      <section aria-labelledby="sales">
        <h2 id="sales" className="mb-3 text-base font-bold">Sales</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Sales this month" value={formatKsh(stats.salesThisMonthCents)} hint="Delivered orders only" />
          <Stat label="Sales all time" value={formatKsh(stats.salesAllTimeCents)} hint="Delivered orders only" />
          <Stat label="Orders today" value={String(stats.ordersToday)} />
          <Stat label="Total orders" value={String(stats.totalOrders)} href="/admin/orders" />
        </div>
      </section>

      <section aria-labelledby="orders-stats">
        <h2 id="orders-stats" className="mb-3 text-base font-bold">Orders</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Awaiting action" value={String(stats.pendingOrders)} href="/admin/orders" tone={stats.pendingOrders > 0 ? 'warn' : undefined} />
          <Stat label="Completed" value={String(stats.completedOrders)} />
          <Stat label="Cancelled" value={String(stats.cancelledOrders)} />
          <Stat label="Customers" value={String(stats.customerCount)} href="/admin/customers" />
        </div>
      </section>

      <section aria-labelledby="stock-stats">
        <h2 id="stock-stats" className="mb-3 text-base font-bold">Stock</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Products" value={String(stats.productCount)} href="/admin/products" />
          <Stat label="Visible in the shop" value={String(stats.activeProducts)} />
          <Stat label="Low stock" value={String(stats.lowStock)} href="/admin/inventory" tone={stats.lowStock > 0 ? 'warn' : undefined} />
          <Stat label="Out of stock" value={String(stats.outOfStock)} href="/admin/inventory" tone={stats.outOfStock > 0 ? 'bad' : undefined} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-hidden" aria-labelledby="recent-orders">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 id="recent-orders" className="text-sm font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-brand-700 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="p-4 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-canvas">
                    <span className="min-w-0">
                      <span className="block font-mono text-xs font-semibold">{order.orderNumber}</span>
                      <span className="block truncate text-xs text-muted">{order.customerName} · {order.customerPhone}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold">{formatKsh(order.totalCents)}</span>
                      <Badge tone={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'brand'}>
                        {STATUS_META[order.status as keyof typeof STATUS_META]?.label ?? order.status}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="card overflow-hidden" aria-labelledby="popular">
            <h2 id="popular" className="border-b border-line px-4 py-3 text-sm font-bold">Most popular products</h2>
            {popular.length === 0 ? (
              <p className="p-4 text-sm text-muted">No products yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {popular.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link href={`/admin/products/${product.id}`} className="min-w-0 truncate text-sm hover:text-brand-700">{product.name}</Link>
                    <span className="shrink-0 text-xs text-muted">{product.unitsSold} sold · {product.viewCount} views</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden" aria-labelledby="low-stock">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 id="low-stock" className="text-sm font-bold">Running low</h2>
              <Link href="/admin/inventory" className="text-xs font-semibold text-brand-700 hover:underline">Manage stock</Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="p-4 text-sm text-muted">Nothing is running low. </p>
            ) : (
              <ul className="divide-y divide-line">
                {lowStock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <Link href={`/admin/products/${product.id}`} className="min-w-0 truncate text-sm hover:text-brand-700">{product.name}</Link>
                    <span className={cn('shrink-0 text-xs font-semibold', product.stock === 0 ? 'text-danger' : 'text-accent-700')}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {stats.unreadMessages > 0 ? (
        <Alert tone="info">
          You have {stats.unreadMessages} unread message{stats.unreadMessages === 1 ? '' : 's'} from the
          contact form. (A screen for reading these is not built yet, see the documentation.)
        </Alert>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint, href, tone }: { label: string; value: string; hint?: string; href?: string; tone?: 'warn' | 'bad' }) {
  const body = (
    <>
      <p className={cn('text-xl font-bold sm:text-2xl', tone === 'bad' ? 'text-danger' : tone === 'warn' ? 'text-accent-700' : 'text-ink')}>
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-subtle">{hint}</p> : null}
    </>
  );
  return href ? <Link href={href} className="card p-3.5 hover:border-brand-300">{body}</Link> : <div className="card p-3.5">{body}</div>;
}
