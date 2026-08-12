import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import { AccountNav } from '@/components/account/AccountNav';

/**
 * Everything under /account requires a signed-in customer.
 *
 * The check lives in the layout so it runs for every child route — including
 * any added later — rather than being re-implemented (and eventually
 * forgotten) page by page. It is a server-side check, so the pages below never
 * render for a signed-out visitor and there is no protected markup to peek at.
 *
 * This is the convenience layer only. Each API route re-authorises
 * independently, because a layout cannot protect data.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/login?reason=protected&next=/account');

  return (
    <div className="container-site py-6">
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr] lg:items-start">
        <AccountNav customerName={customer.name} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
