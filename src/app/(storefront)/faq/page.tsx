import type { Metadata } from 'next';
import Link from 'next/link';
import { getActiveDeliveryZones } from '@/lib/queries/content';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FaqJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description: 'Answers about ordering, delivery, pickup, payment, WhatsApp orders, returns and accounts.',
  alternates: { canonical: '/faq' },
};

export default async function FaqPage() {
  const zones = await getActiveDeliveryZones();

  /*
   * Answers describe how this system actually behaves. Anything that is a
   * commercial policy the owner has not set yet (return windows, exact fees)
   * says so plainly rather than inventing a rule.
   */
  const faqs = [
    {
      question: 'Do I need an account to order?',
      answer:
        'No. Check out as a guest. An account only saves your orders, addresses and wishlist.',
    },
    {
      question: 'How do I place an order?',
      answer:
        'Add to cart, choose pickup or delivery, fill in your details and place the order. You get an order number and we contact you to confirm.',
    },
    {
      question: 'Can I order on WhatsApp instead?',
      answer:
        'Yes. Any WhatsApp button turns your cart into a ready-made message. Send it as it is.',
    },
    {
      question: 'How much is delivery?',
      answer: zones.length > 0
        ? `It depends on your area. We currently deliver to ${zones.length} area${zones.length === 1 ? '' : 's'}, and the fee for the area you select is added to your total at checkout before you confirm. See the delivery page for the full list.`
        : 'Delivery areas and fees have not been published on the site yet. Choose shop pickup at checkout, or contact us and we will arrange delivery and confirm the cost with you.',
    },
    {
      question: 'How long does delivery take?',
      answer:
        'Shown next to each area at checkout. We tell you if anything will take longer.',
    },
    {
      question: 'Can I collect my order from the shop?',
      answer:
        'Yes, and it is free. Choose "Collect at the shop" at checkout. Bring your order number.',
    },
    {
      question: 'How do I pay?',
      answer:
        'M-Pesa, or cash on delivery or pickup where offered. Nothing is charged on the website itself.',
    },
    {
      question: 'Is it safe to pay?',
      answer:
        'Only send money to the till, paybill or number shown on our payment page or confirmed by us on our official WhatsApp line. If anyone asks you to pay a different number, stop and check with us first.',
    },
    {
      question: 'What if something is out of stock?',
      answer:
        'Stock is live, so out-of-stock items cannot be added. If something sells out while it is in your cart, we tell you before you confirm.',
    },
    {
      question: 'How do I track my order?',
      answer:
        'Your confirmation page has a status timeline, and works without an account. With an account, everything is under My orders.',
    },
    {
      question: 'Can I change or cancel an order?',
      answer:
        'Contact us on the number you ordered with. If it has not been dispatched we can usually change or cancel it.',
    },
    {
      question: 'Can I return something?',
      answer:
        'Contact us and tell us what is wrong. See the returns page, or just ask us and we will deal with it fairly.',
    },
    {
      question: 'Do I have to install the app?',
      answer:
        'No. The website does everything the app does. Installing just adds an icon and opens faster.',
    },
  ];

  return (
    <div className="container-site py-6">
      <FaqJsonLd items={faqs} />
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'FAQ' }]} />
      <h1 className="mt-3">Frequently asked questions</h1>

      <div className="mt-6 max-w-3xl space-y-2">
        {faqs.map((faq) => (
          <details key={faq.question} className="card group p-0">
            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-ink marker:hidden hover:bg-canvas">
              <span className="flex items-start justify-between gap-3">
                {faq.question}
                <span className="mt-0.5 shrink-0 text-lg leading-none text-subtle transition group-open:rotate-45" aria-hidden="true">+</span>
              </span>
            </summary>
            <p className="border-t border-line px-4 py-3.5 text-sm leading-relaxed text-muted">{faq.answer}</p>
          </details>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">
        Still stuck? <Link href="/contact" className="link">Contact us</Link>.
      </p>
    </div>
  );
}
