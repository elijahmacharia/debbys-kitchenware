import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentCustomer } from '@/lib/auth';
import { MarketingToggle } from '@/components/account/MarketingToggle';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = { title: 'Settings', robots: { index: false, follow: false } };

export default async function SettingsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1>Settings</h1>
        <p className="mt-1 text-sm text-muted">What we send you, and what we hold.</p>
      </div>

      <MarketingToggle initial={customer.marketingOptIn} />

      <section className="card p-4 sm:p-5">
        <h2 className="text-base font-bold">Your data</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          We hold your name, phone number, optional email address, delivery addresses and order history.
          That is all we need to take and deliver your orders. We do not sell it to anyone. See our{' '}
          <Link href="/privacy-policy" className="link">privacy policy</Link> for the full detail.
        </p>
        <Alert tone="info" className="mt-3">
          To request a copy of your data, or to have your account deleted, please{' '}
          <Link href="/contact" className="link">contact us</Link> and we will handle it. Self-service
          deletion is not built yet — see the project documentation.
        </Alert>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="text-base font-bold">Notifications</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Order updates come by WhatsApp or phone. Push and SMS are not switched on, so nothing will ask
          for permission.
        </p>
      </section>
    </div>
  );
}
