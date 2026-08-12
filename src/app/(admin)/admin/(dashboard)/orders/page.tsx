import type { Metadata } from 'next';
import Link from 'next/link';
import { listAdminOrders } from '@/lib/queries/admin';
import { formatKsh } from '@/lib/money';
import { FULFILMENT_LABEL, ORDER_STATUSES, PAYMENT_STATUS_LABEL, STATUS_META } from '@/lib/orders';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Orders', robots: { index: false, follow: false } };

export default async function AdminOrdersPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const result = await listAdminOrders({ status: params.status, q: params.q, page, perPage: 25 });

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { status: params.status, q: params.q, page: params.page, ...overrides };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const query = next.toString();
    return query ? `/admin/orders?${query}` : '/admin/orders';
  };

  const statusTabs = ['ALL', ...ORDER_STATUSES];
  const activeStatus = params.status ?? 'ALL';

  return (
    <div>
      <h1>Orders</h1>
      <p className="mt-1 text-sm text-muted">{result.total} order{result.total === 1 ? '' : 's'}{params.q ? ` matching “${params.q}”` : ''}</p>

      <form className="mt-4 flex gap-2" role="search">
        <label htmlFor="order-search" className="sr-only">Search orders</label>
        <input id="order-search" name="q" type="search" defaultValue={params.q ?? ''} placeholder="Order number, name or phone" className="input max-w-sm" />
        {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
        <button type="submit" className="btn-secondary">Search</button>
        {params.q ? <Link href={buildHref({ q: undefined, page: undefined })} className="btn-ghost border border-line">Clear</Link> : null}
      </form>

      <nav className="mt-4 flex flex-wrap gap-1.5" aria-label="Filter by status">
        {statusTabs.map((status) => (
          <Link
            key={status}
            href={buildHref({ status: status === 'ALL' ? undefined : status, page: undefined })}
            aria-current={activeStatus === status ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium',
              activeStatus === status ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface hover:bg-brand-50',
            )}
          >
            {status === 'ALL' ? 'All' : STATUS_META[status as keyof typeof STATUS_META]?.label ?? status}
          </Link>
        ))}
      </nav>

      {result.rows.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No orders match this view.
        </p>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[48rem] text-sm">
              <caption className="sr-only">Orders with customer, total and status</caption>
              <thead className="bg-canvas text-left">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Order</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Customer</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Fulfilment</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Total</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Payment</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {result.rows.map((order) => (
                  <tr key={order.id} className="hover:bg-canvas">
                    <th scope="row" className="px-3 py-2.5 text-left">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-bold text-ink hover:text-brand-700">
                        {order.orderNumber}
                      </Link>
                      <span className="block text-[11px] font-normal text-subtle">
                        {new Date(order.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </th>
                    <td className="px-3 py-2.5">
                      <span className="block">{order.customerName}</span>
                      <span className="block text-[11px] text-subtle">{order.customerPhone}</span>
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {FULFILMENT_LABEL[order.fulfilment]}
                      {order.deliveryZoneName ? <span className="block text-[11px] text-subtle">{order.deliveryZoneName}</span> : null}
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{formatKsh(order.totalCents)}</td>
                    <td className="px-3 py-2.5">
                      <span className={order.paymentStatus === 'PAID' ? 'text-xs font-semibold text-success' : 'text-xs font-semibold text-accent-700'}>
                        {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'brand'}>
                        {STATUS_META[order.status as keyof typeof STATUS_META]?.label ?? order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={result.page} totalPages={result.totalPages} buildHref={(p) => buildHref({ page: p > 1 ? String(p) : undefined })} />
        </>
      )}
    </div>
  );
}
