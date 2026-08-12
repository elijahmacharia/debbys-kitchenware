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
        'No. You can add items to your cart and check out as a guest. An account is optional and only saves your order history, delivery addresses and wishlist for next time.',
    },
    {
      question: 'How do I place an order?',
      answer:
        'Add what you need to your cart, go to checkout, choose pickup or delivery, fill in your details and place the order. You will get an order number, and we will contact you to confirm.',
    },
    {
      question: 'Can I order on WhatsApp instead?',
      answer:
        'Yes. Any WhatsApp button turns your cart into a ready-made message listing the items, quantities and total. Send it as it is and we will reply.',
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
        'The estimated time is shown next to each area at checkout and on the delivery page. We will tell you if anything is going to take longer than expected.',
    },
    {
      question: 'Can I collect my order from the shop?',
      answer:
        'Yes, and pickup is free. Choose "Collect at the shop" at checkout. We will let you know when your order is packed and ready — bring your order number.',
    },
    {
      question: 'How do I pay?',
      answer:
        'By M-Pesa, or in cash on delivery or at pickup where those options are offered. Nothing is charged on the website itself. The How to pay page explains each method.',
    },
    {
      question: 'Is it safe to pay?',
      answer:
        'Only send money to the till, paybill or number shown on our payment page or confirmed by us on our official WhatsApp line. If anyone asks you to pay a different number, stop and check with us first.',
    },
    {
      question: 'What if something is out of stock?',
      answer:
        'The site shows live stock, and an item that is out of stock cannot be added to your cart. If something sells out between you adding it and checking out, we will tell you before you confirm rather than quietly removing it.',
    },
    {
      question: 'How do I track my order?',
      answer:
        'Your confirmation page shows a status timeline, and the link works even without an account. If you have an account, every order is listed under My orders with its current status.',
    },
    {
      question: 'Can I change or cancel an order?',
      answer:
        'Contact us as soon as possible on the number you used to order. If we have not dispatched it yet we can usually change or cancel it.',
    },
    {
      question: 'Can I return something?',
      answer:
        'Contact us and explain what is wrong. The full returns policy is on the returns page — if it is still being finalised, please ask us directly and we will deal with it fairly.',
    },
    {
      question: 'Do I have to install the app?',
      answer:
        'No. The website does everything the app does. Installing is purely optional — it just puts an icon on your home screen and makes the site open faster.',
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
        Still stuck? <Link href="/contact" className="link">Contact us</Link> and a person will get back to you.
      </p>
    </div>
  );
}
