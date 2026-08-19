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
        This list shows only what is needed to serve an order, name, contact details and order totals.
        Passwords cannot be viewed by anyone, including you: they are stored as one-way hashes.
      </Alert>

      <form className="mt-4 flex gap-2" role="search">
        <label htmlFor="customer-search" className="sr-only">Search customers</label>
        <input id="customer-search" name="q" type="search" defaultValue={q ?? ''} placeholder="Name, phone or email" className="input max-w-sm" />
        <button type="submit" className="btn-secondary">Search</button>
        {q ? <Link href="/admin/customers" className="btn-ghost border border-line">Clear</Link> : null}
      </form>

      {customers.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-surface p-10 text-center text-sm text-muted shadow-soft">
          {q ? `No customers match “${q}”.` : 'No customer accounts yet.'}
        </p>
      ) : (
        <div className="admin-panel mt-6 overflow-x-auto">
          <table className="admin-table min-w-[44rem]">
            <caption className="sr-only">Customer accounts with order counts</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Phone</th>
                <th scope="col">Email</th>
                <th scope="col">Orders</th>
                <th scope="col">Spent</th>
                <th scope="col">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <th scope="row">{customer.name ?? customer.email.split('@')[0]}</th>
                  <td>
                    {/* Accounts created with Google, or with email alone, have no
                        phone until the customer places an order. */}
                    {customer.phone
                      ? <a href={`tel:${customer.phone}`} className="link">{customer.phone}</a>
                      : <span className="text-subtle">Not given</span>}
                  </td>
                  <td className="text-muted">{customer.email}</td>
                  <td>
                    <Link href={`/admin/orders?q=${encodeURIComponent(customer.phone ?? customer.email)}`} className="link">
                      {Number(customer.orderCount)}
                    </Link>
                  </td>
                  <td className="font-semibold">{formatKsh(Number(customer.spentCents))}</td>
                  <td className="text-xs text-muted">
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
