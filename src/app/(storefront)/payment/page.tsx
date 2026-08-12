import type { Metadata } from 'next';
import Link from 'next/link';
import { enabledPaymentMethods } from '@/lib/config';
import { getPublicSettings } from '@/lib/settings';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Alert } from '@/components/ui/Alert';

export const metadata: Metadata = {
  title: 'How to pay',
  description: 'Payment options: M-Pesa, cash on delivery and payment at pickup, with step-by-step instructions.',
  alternates: { canonical: '/payment' },
};

export default async function PaymentPage() {
  const settings = await getPublicSettings();
  const methods = enabledPaymentMethods();

  return (
    <div className="container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'How to pay' }]} />
      <h1 className="mt-3">How to pay</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        No card details, nothing charged here. You choose how to pay at checkout.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {methods.map((method) => (
          <section key={method.key} className="card p-4">
            <h2 className="text-base font-bold">{method.label}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{method.instructions}</p>
            <p className="mt-2 text-xs text-subtle">
              {method.appliesTo === 'DELIVERY' ? 'Delivery orders only'
                : method.appliesTo === 'PICKUP' ? 'Shop pickup only'
                : 'Available for delivery and pickup'}
            </p>
          </section>
        ))}
      </div>

      {settings.paymentInstructions ? (
        <Alert tone="info" className="mt-5">{settings.paymentInstructions}</Alert>
      ) : null}

      <Alert tone="warning" className="mt-4" title="Stay safe">
        Only send money to the till, paybill or number shown on this page or confirmed by us directly on
        our official WhatsApp line. If anyone contacts you asking for payment to a different number,
        stop and <Link href="/contact" className="link">check with us first</Link>.
      </Alert>

      <div className="prose-page mt-8">
        <h2>When do I pay?</h2>
        <p>
          After we confirm your order is in stock and, for delivery, the fee for your area. Or on
          delivery or collection if you chose that.
        </p>

        <h2>Will I get a receipt?</h2>
        <p>Your M-Pesa message is your proof. Ask and we will confirm in writing on WhatsApp.</p>

        <h2>Automatic M-Pesa</h2>
        <p>STK push is not switched on. Payment is arranged manually, so we always confirm first.</p>
      </div>
    </div>
  );
}
