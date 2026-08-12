import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicSettings } from '@/lib/settings';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Returns & refunds',
  description: 'What to do if something arrives damaged, faulty or is not what you ordered.',
  alternates: { canonical: '/returns' },
};

export default async function ReturnsPage() {
  const settings = await getPublicSettings();

  return (
    <LegalPage
      title="Returns & refunds"
      description="What to do if something is wrong with your order."
      breadcrumb="Returns"
      custom={settings.returnsPolicy}
    >
      <h2>If something is wrong, tell us</h2>
      <p>
        If an item arrives damaged, is faulty, or is not what you ordered, <Link href="/contact">contact
        us</Link> as soon as you notice. Have your order number ready, and a photo if the item is damaged
       , it usually settles the matter immediately.
      </p>

      <h2>What we will do</h2>
      <p>Depending on the situation and what you would prefer, we will replace the item, exchange it for
        something else, or refund it. We would always rather put a problem right than lose a customer
        over it.</p>

      <h2>The details the business still needs to confirm</h2>
      <ul>
        <li>How many days you have to report a problem, [NUMBER] days from delivery or collection.</li>
        <li>Whether unopened items can be returned simply because you changed your mind, and within how long.</li>
        <li>Which items cannot be returned once opened for hygiene reasons, [for example cleaning items, sponges].</li>
        <li>Whether the item must be in its original packaging.</li>
        <li>Who pays return transport in each case.</li>
        <li>How long a refund takes and how it is sent back, [for example M-Pesa to the paying number, within NUMBER days].</li>
      </ul>

      <h2>Your legal rights</h2>
      <p>Nothing here removes the rights you have under Kenyan consumer law, including the Consumer
        Protection Act, 2012, when goods are faulty or not as described.</p>
    </LegalPage>
  );
}
