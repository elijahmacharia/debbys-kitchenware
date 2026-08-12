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
          {business.name} sells kitchenware, utensils, household goods, plastic products, storage and
          cleaning items — the everyday things a home runs on. Setting up a new place, replacing
          something that gave up, or just restocking: the aim is you find it all here in one go.
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
          What you see is what we have. If something is not listed, ask — we may have it in the shop.
        </p>

        <h2>How to order</h2>
        <p>Two ways, neither needs an account:</p>
        <ul>
          <li><strong>On the website.</strong> Add to cart, check out, get an order number.</li>
          <li><strong>On WhatsApp.</strong> Any WhatsApp button turns your cart into a message to send us.</li>
        </ul>

        <h2>Delivery and pickup</h2>
        <p>
          Collect free at the shop, or choose delivery — fees depend on your area and are shown at
          checkout. See <Link href="/delivery">delivery and pickup</Link>.
        </p>

        <h2>Paying</h2>
        <p>
          Nothing is charged on this website. M-Pesa, or cash on delivery or pickup where available.
          See <Link href="/payment">how to pay</Link>.
        </p>

        <h2>Customer service</h2>
        <p>
          If something is wrong, tell us. We would rather put it right than lose you.{' '}
          <Link href="/contact">Contact us</Link>, by phone or WhatsApp.
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
