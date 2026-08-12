import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicSettings } from '@/lib/settings';
import { getCategoryTree } from '@/lib/queries/categories';
import { business, isPlaceholder } from '@/lib/config';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'About us',
  description:
    "About Debby's Kitchenware — what we sell, how to order, and what to expect from delivery, pickup and customer service.",
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const [settings, tree] = await Promise.all([getPublicSettings(), getCategoryTree()]);

  return (
    <div className="container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'About' }]} />
      <h1 className="mt-3">About {business.name}</h1>

      {/*
        Everything below describes how the shop works. No founding date, no
        staff count, no awards — nothing the business has not told us.
      */}
      <div className="prose-page mt-5">
        <p>
          {business.name} sells kitchenware, kitchen utensils, household goods, plastic products,
          storage and cleaning items — the everyday things a home actually runs on. If you are setting
          up a new place, replacing something that finally gave up, or just restocking, the aim is that
          you can find it here in one go rather than walking between shops.
        </p>

        <h2>What we stock</h2>
        <p>The catalogue is grouped into these departments:</p>
        <ul>
          {tree.map((category) => (
            <li key={category.id}>
              <Link href={`/category/${category.slug}`}>{category.name}</Link>
              {category.children.length > 0 ? ` — ${category.children.map((c) => c.name).join(', ')}` : null}
            </li>
          ))}
        </ul>
        <p>
          Stock changes, so what you see on the site is what we currently have. If something you need is
          not listed, ask us — we may have it in the shop or be able to source it.
        </p>

        <h2>How to order</h2>
        <p>There are two ways, and neither requires an account:</p>
        <ul>
          <li>
            <strong>On the website.</strong> Add what you need to your cart and check out. You will get an
            order number, and we will contact you to confirm.
          </li>
          <li>
            <strong>On WhatsApp.</strong> Use any of the WhatsApp buttons and your cart is turned into a
            message you can send us as it is. Good if you would rather just talk to a person.
          </li>
        </ul>

        <h2>Delivery and pickup</h2>
        <p>
          You can collect your order at the shop at no extra cost, or choose delivery. Delivery fees
          depend on your area and are shown at checkout before you confirm. See{' '}
          <Link href="/delivery">delivery and pickup</Link> for the details.
        </p>

        <h2>Paying</h2>
        <p>
          Nothing is charged on this website. You pay by M-Pesa, or in cash on delivery or at pickup where
          those options are available. <Link href="/payment">How to pay</Link> explains each method.
        </p>

        <h2>Customer service</h2>
        <p>
          If something is wrong with your order, tell us. We would much rather hear about it and put it
          right than have you not come back. You can reach us on{' '}
          <Link href="/contact">the contact page</Link>, by phone, or on WhatsApp.
        </p>

        {settings.aboutExtra ? (
          <>
            <h2>More about us</h2>
            <p className="whitespace-pre-line">{settings.aboutExtra}</p>
          </>
        ) : null}

        {isPlaceholder(business.address) ? (
          <p className="rounded-card border border-dashed border-line bg-canvas p-3 text-xs">
            <strong className="text-ink">Note for the shop owner:</strong> the shop address, phone number
            and opening hours have not been added yet. Fill them into your <code>.env</code> file and they
            will appear here, in the footer and on the contact page automatically.
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <ButtonLink href="/shop">Browse the shop</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">Contact us</ButtonLink>
      </div>
    </div>
  );
}
