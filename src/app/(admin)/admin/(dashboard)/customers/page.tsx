import type { Metadata } from 'next';
import Link from 'next/link';
import { listCustomers } from '@/lib/queries/admin';
import { formatKsh } from '@/lib/money';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = { title: 'Customers', robots: { index: false, follow: false } };

export default async function AdminCustomersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const customers = await listCustomers(q);

  return (
    <div>
      <h1>Customers</h1>
      <p className="mt-1 text-sm text-muted">
        People who created an account. Guests who ordered without one appear on the orders page instead.
      </p>

      <Alert tone="info" className="mt-4">
        This list shows only what is needed to serve an order — name, contact details and order totals.
        Passwords cannot be viewed by anyone, including you: they are stored as one-way hashes.
      </Alert>

      <form className="mt-4 flex gap-2" role="search">
        <label htmlFor="customer-search" className="sr-only">Search customers</label>
        <input id="customer-search" name="q" type="search" defaultValue={q ?? ''} placeholder="Name, phone or email" className="input max-w-sm" />
        <button type="submit" className="btn-secondary">Search</button>
        {q ? <Link href="/admin/customers" className="btn-ghost border border-line">Clear</Link> : null}
      </form>

      {customers.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          {q ? `No customers match “${q}”.` : 'No customer accounts yet.'}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[44rem] text-sm">
            <caption className="sr-only">Customer accounts with order counts</caption>
            <thead className="bg-canvas text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">Name</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Phone</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Email</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Orders</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Spent</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <th scope="row" className="px-3 py-2.5 text-left font-medium text-ink">{customer.name}</th>
                  <td className="px-3 py-2.5">
                    <a href={`tel:${customer.phone}`} className="link">{customer.phone}</a>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{customer.email ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/orders?q=${encodeURIComponent(customer.phone)}`} className="link">
                      {Number(customer.orderCount)}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 font-semibold">{formatKsh(Number(customer.spentCents))}</td>
                  <td className="px-3 py-2.5 text-xs text-muted">
                    {new Date(customer.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
