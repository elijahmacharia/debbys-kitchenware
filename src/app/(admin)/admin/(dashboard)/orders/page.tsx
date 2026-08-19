import type { Metadata } from 'next';
import Link from 'next/link';
import { listAdminOrders } from '@/lib/queries/admin';
import { formatKsh } from '@/lib/money';
import { FULFILMENT_LABEL, ORDER_STATUSES, PAYMENT_STATUS_LABEL, STATUS_META } from '@/lib/orders';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';
import { MarkPaidButton } from '@/components/admin/MarkPaidButton';

export const metadata: Metadata = { title: 'Orders', robots: { index: false, follow: false } };

export default async function AdminOrdersPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string; payment?: string; page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const result = await listAdminOrders({
    status: params.status, q: params.q, payment: params.payment, page, perPage: 25,
  });

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { status: params.status, q: params.q, payment: params.payment, page: params.page, ...overrides };
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

      <nav className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by status">
        {statusTabs.map((status) => (
          <Link
            key={status}
            href={buildHref({ status: status === 'ALL' ? undefined : status, page: undefined })}
            aria-current={activeStatus === status ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium',
              activeStatus === status ? 'border-clay-600 bg-ink text-white' : 'border-line bg-surface hover:bg-raise',
            )}
          >
            {status === 'ALL' ? 'All' : STATUS_META[status as keyof typeof STATUS_META]?.label ?? status}
          </Link>
        ))}
      </nav>

      {/* Separate from the status rail: an order can be delivered and still
          unpaid, so the two questions need answering independently. */}
      <nav className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by payment">
        {[['ALL', 'Any payment'], ['UNPAID', 'Not paid yet'], ['PAID', 'Paid']].map(([value, label]) => (
          <Link
            key={value}
            href={buildHref({ payment: value === 'ALL' ? undefined : value, page: undefined })}
            aria-current={(params.payment ?? 'ALL') === value ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium',
              (params.payment ?? 'ALL') === value ? 'border-ink bg-ink text-white' : 'border-line bg-surface hover:bg-raise',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {result.rows.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-surface p-10 text-center text-sm text-muted shadow-soft">
          No orders match this view.
        </p>
      ) : (
        <>
          <div className="admin-panel mt-6 overflow-x-auto">
            <table className="admin-table min-w-[48rem]">
              <caption className="sr-only">Orders with customer, total and status</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Fulfilment</th>
                  <th scope="col">Total</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((order) => (
                  <tr key={order.id} className="hover:bg-canvas">
                    <th scope="row">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-bold text-ink hover:text-ink">
                        {order.orderNumber}
                      </Link>
                      <span className="block text-[11px] font-normal text-subtle">
                        {new Date(order.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </th>
                    <td>
                      <span className="block">{order.customerName}</span>
                      <span className="block text-[11px] text-subtle">{order.customerPhone}</span>
                    </td>
                    <td className="text-muted">
                      {FULFILMENT_LABEL[order.fulfilment]}
                      {order.deliveryZoneName ? <span className="block text-[11px] text-subtle">{order.deliveryZoneName}</span> : null}
                    </td>
                    <td className="font-semibold">{formatKsh(order.totalCents)}</td>
                    <td>
                      <span className={order.paymentStatus === 'PAID' ? 'text-xs font-semibold text-success' : 'text-xs font-semibold text-clay-700'}>
                        {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <Badge tone={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'brand'}>
                        {STATUS_META[order.status as keyof typeof STATUS_META]?.label ?? order.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      {order.paymentStatus === 'PAID' ? null : <MarkPaidButton orderId={order.id} />}
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
