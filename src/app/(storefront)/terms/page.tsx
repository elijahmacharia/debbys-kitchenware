import type { Metadata } from 'next';
import { getPublicSettings } from '@/lib/settings';
import { business } from '@/lib/config';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms & conditions',
  description: `The terms that apply when you order from ${business.name}.`,
  alternates: { canonical: '/terms' },
};

export default async function TermsPage() {
  const settings = await getPublicSettings();

  return (
    <LegalPage
      title="Terms & conditions"
      description="The terms that apply when you order from us."
      breadcrumb="Terms"
      custom={settings.termsPolicy}
    >
      <h2>Who we are</h2>
      <p>{business.name}, a retailer of kitchenware and household goods in Kenya. [The business must add
        its registered name, business registration or KRA PIN, and registered address if it wishes to
        state them here.]</p>

      <h2>Orders</h2>
      <p>Placing an order on this website is an offer to buy, not a completed sale. A contract is formed
        only when we confirm your order with you. We may decline or cancel an order if an item turns out
        to be unavailable, if there has been a pricing error, or if we cannot deliver to your area.</p>

      <h2>Prices</h2>
      <p>Prices are in Kenya Shillings and are the prices shown on the product page at the time you
        order. Delivery is charged separately and is shown at checkout before you confirm. We may change
        prices at any time, but a change never affects an order we have already confirmed.</p>

      <h2>Payment</h2>
      <p>Payment is made by the method you select at checkout. We do not take payment on this website
        itself. We are not responsible for money sent to any number other than those we have published or
        confirmed with you directly.</p>

      <h2>Delivery</h2>
      <p>Delivery times shown are estimates, not guarantees. If you are not reachable on the number you
        gave us, or the address cannot be found from the details you provided, we may need to reschedule
        and [the business should state whether a second delivery attempt is charged].</p>

      <h2>Product information</h2>
      <p>We describe products as accurately as we can. Colours and exact dimensions may vary slightly
        between batches. Where an image is an illustration rather than a photograph of the actual item,
        it is labelled as such.</p>

      <h2>Your account</h2>
      <p>You are responsible for keeping your password private. Tell us immediately if you believe
        someone else has access to your account. We may suspend an account that is being used
        fraudulently.</p>

      <h2>Liability</h2>
      <p>[This section must be written or reviewed by a qualified lawyer before the site goes live. It
        should set out the limits of the business&apos;s liability in a way that is valid under Kenyan
        law, including the Consumer Protection Act, 2012.]</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Kenya. [Confirm with your lawyer.]</p>
    </LegalPage>
  );
}
