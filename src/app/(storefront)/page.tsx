import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getFeaturedProducts, getNewArrivals, getPopularProducts, getProductsInCategory, getSaleProducts,
  type ProductListItem,
} from '@/lib/queries/products';
import { getTopCategories } from '@/lib/queries/categories';
import { getActiveDeliveryZones, getPublishedTestimonials } from '@/lib/queries/content';
import { getCustomerSession } from '@/lib/auth';
import { getWishlistProductIds } from '@/lib/queries/wishlist';
import { business } from '@/lib/config';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CategoryCard } from '@/components/product/CategoryCard';
import { ButtonLink } from '@/components/ui/Button';
import { WebsiteSearchJsonLd } from '@/components/seo/JsonLd';
import { ArrowRightIcon, StoreIcon, TruckIcon, WhatsAppIcon } from '@/components/icons';
import { SearchBox } from '@/components/layout/SearchBox';
import { CategoryChips } from '@/components/shop/CategoryChips';
import { formatKsh } from '@/lib/money';

export const metadata: Metadata = {
  title: `${business.name} — Kitchenware & Household Essentials in Kenya`,
  description:
    'Kitchen essentials, storage, cleaning products and everyday household items, all in one place. Collect at the shop or have it delivered. Order online or on WhatsApp.',
  alternates: { canonical: '/' },
};

/** Departments without their own photograph fall back to a neutral illustration. */
const CATEGORY_IMAGE = ['kitchenware', 'household', 'plastic-products', 'storage', 'cleaning'];
const categoryImage = (slug: string) =>
  `/categories/${CATEGORY_IMAGE.includes(slug) ? slug : 'other'}.svg`;

/**
 * A rail only earns its place if the catalogue can genuinely fill it. Showing
 * two products under a heading that promises a collection looks worse than not
 * having the section at all.
 */
const MIN_RAIL = 3;

export default async function HomePage() {
  const [categories, session, zones, testimonials] = await Promise.all([
    getTopCategories(6),
    getCustomerSession(),
    getActiveDeliveryZones(),
    getPublishedTestimonials(),
  ]);

  /*
   * Sections are built in sequence, each excluding what the previous ones
   * already used. Before this, one product flagged featured + new + on sale
   * appeared three times down the page and made the shop look empty.
   */
  const used: string[] = [];
  const take = (items: ProductListItem[]) => {
    used.push(...items.map((i) => i.id));
    return items;
  };

  // The hero claims its product first, so the rail underneath cannot repeat it.
  const heroProduct = (await getPopularProducts(1, used))[0] ?? null;
  if (heroProduct) used.push(heroProduct.id);

  const popular = take(await getPopularProducts(4, used));
  const deals = take(await getSaleProducts(4, used));
  const fresh = take(await getNewArrivals(4, used));
  const kitchen = take(await getProductsInCategory('kitchenware', 4, used));
  const featuredFallback = popular.length === 0 ? take(await getFeaturedProducts(4, used)) : [];

  const wishlisted = await getWishlistProductIds(session?.sub ?? null);
  const whatsappHref = waLink(generalEnquiryMessage());
  const isSignedIn = Boolean(session);

  const grid = (items: ProductListItem[]) => (
    <ProductGrid products={items} isSignedIn={isSignedIn} wishlistedIds={wishlisted} priorityCount={0} />
  );

  return (
    <>
      <WebsiteSearchJsonLd />

      {/* ============================================================ HERO ==
          A short two-line greeting, the search, then the pill rail. The page
          starts with the thing people came to do rather than with a slogan. */}
      <section className="container-site pt-6 sm:pt-10">
        <p className="text-sm text-muted">Kitchen &amp; home, Nairobi</p>
        <h1 className="mt-1 max-w-[14ch]">
          Everything your kitchen needs
        </h1>

        <div className="mt-6 lg:hidden">
          <SearchBox />
        </div>

        <div className="mt-5">
          <CategoryChips categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
        </div>

        {heroProduct ? (
          <Link href={`/product/${heroProduct.slug}`} className="group mt-6 block overflow-hidden rounded-3xl bg-raise">
            <div className="grid gap-0 sm:grid-cols-2 sm:items-center">
              <div className="order-2 p-6 sm:order-1 sm:p-10">
                <p className="text-xs text-muted">{heroProduct.categoryName}</p>
                <p className="mt-1.5 text-xl font-semibold leading-tight sm:text-2xl">{heroProduct.name}</p>
                <p className="mt-2 text-lg font-bold text-clay-600">
                  {formatKsh(heroProduct.salePriceCents ?? heroProduct.priceCents)}
                </p>
                <span className="btn-primary btn-sm mt-5 inline-flex">
                  Shop now
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </div>
              <div className="relative order-1 aspect-[4/3] sm:order-2 sm:aspect-square">
                {heroProduct.imageUrl ? (
                  <Image
                    src={heroProduct.imageUrl}
                    alt={heroProduct.imageAlt ?? heroProduct.name}
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, 45vw"
                    className="object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : null}
              </div>
            </div>
          </Link>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/shop" className="flex-1 sm:flex-none">Shop all products</ButtonLink>
          {whatsappHref ? (
            <ButtonLink href={whatsappHref} external variant="secondary" className="flex-1 sm:flex-none">
              <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
              WhatsApp
            </ButtonLink>
          ) : null}
        </div>

        <dl className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-raise p-4">
            <StoreIcon className="h-5 w-5 text-ink" />
            <dt className="mt-2 text-sm font-semibold">Free pickup</dt>
            <dd className="text-xs text-muted">Collect at the shop</dd>
          </div>
          <div className="rounded-2xl bg-raise p-4">
            <TruckIcon className="h-5 w-5 text-ink" />
            <dt className="mt-2 text-sm font-semibold">We deliver</dt>
            <dd className="text-xs text-muted">
              {zones.length > 0 ? `${zones.length} areas` : 'Ask about your area'}
            </dd>
          </div>
        </dl>
      </section>

      {/* ====================================================== CATEGORIES == */}
      {categories.length > 0 ? (
        <section className="container-site py-14 sm:py-20" aria-labelledby="departments">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Departments</p>
              <h2 id="departments" className="mt-1">Shop by category</h2>
            </div>
            <Link href="/categories" className="link text-sm">
              All categories
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:grid-rows-2 sm:gap-4">
            {categories.slice(0, 5).map((category, index) => (
              <CategoryCard
                key={category.slug}
                name={category.name}
                slug={category.slug}
                productCount={category.productCount}
                image={categoryImage(category.slug)}
                tall={index === 0}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ========================================================= POPULAR == */}
      {(popular.length >= MIN_RAIL || featuredFallback.length >= MIN_RAIL) ? (
        <section className="container-site pb-14 sm:pb-20" aria-labelledby="popular">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line-strong pt-8">
            <div>
              <p className="eyebrow">Selling well</p>
              <h2 id="popular" className="mt-1">Popular right now</h2>
            </div>
            <Link href="/shop?sort=popular" className="link text-sm">
              See all
            </Link>
          </div>
          <div className="mt-7">{grid(popular.length ? popular : featuredFallback)}</div>
        </section>
      ) : null}

      {/* =========================================================== DEALS ==
          A dark band breaks the rhythm of pale sections. */}
      {deals.length >= MIN_RAIL ? (
        <section className="bg-raise py-12 sm:py-16" aria-labelledby="deals">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Reduced</p>
                <h2 id="deals" className="mt-1">Worth a look</h2>
                <p className="mt-2 max-w-md text-sm text-muted">
                  The price you see is the reduced price. No codes, nothing to enter.
                </p>
              </div>
              <Link href="/shop?sale=1" className="link text-sm">
                All offers
              </Link>
            </div>
            <div className="mt-7">{grid(deals)}</div>
          </div>
        </section>
      ) : null}

      {/* ==================================================== NEW ARRIVALS == */}
      {fresh.length >= MIN_RAIL ? (
        <section className="container-site py-14 sm:py-20" aria-labelledby="new">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Just in</p>
              <h2 id="new" className="mt-1">New arrivals</h2>
            </div>
            <Link href="/shop?new=1" className="link text-sm">
              See all
            </Link>
          </div>
          <div className="mt-7">{grid(fresh)}</div>
        </section>
      ) : null}

      {/* ================================================ EDITORIAL / HOW == */}
      <section className="container-site py-12 sm:py-16" aria-labelledby="how">
        <div className="grid gap-8 rounded-3xl bg-raise p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="how" className="mt-2 max-w-[16ch]">Order the way that suits you.</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Fill your basket here, or send the whole list on WhatsApp. Either way we confirm what is in
              stock before you pay anything.
            </p>
            {whatsappHref ? (
              <ButtonLink href={whatsappHref} external variant="secondary" className="mt-6">
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
                Send us your list
              </ButtonLink>
            ) : null}
          </div>

          {/* Numbered steps separated by rules, not stacked in cards. */}
          <ol className="divide-y divide-line">
            {[
              ['01', 'Choose what you need', 'Browse by department or search. Stock is live, so what you see is what we have.'],
              ['02', 'Checkout without an account', 'Name and phone number is enough. Sign up only if you want your details kept.'],
              ['03', 'We confirm, then you pay', 'M-Pesa, cash on delivery, or arrange it on WhatsApp. Nothing is charged on this site.'],
              ['04', 'Collect it, or we deliver', 'Pickup is free. Delivery costs are shown before you confirm the order.'],
            ].map(([n, title, text]) => (
              <li key={n} className="flex gap-5 py-5">
                <span className="text-sm font-bold text-clay-600">{n}</span>
                <div>
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================================================ KITCHEN ESSENTIALS = */}
      {kitchen.length >= MIN_RAIL ? (
        <section className="container-site py-14 sm:py-20" aria-labelledby="kitchen">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Curated</p>
              <h2 id="kitchen" className="mt-1">Kitchen essentials</h2>
            </div>
            <Link href="/category/kitchenware" className="link text-sm">
              All kitchenware
            </Link>
          </div>
          <div className="mt-7">{grid(kitchen)}</div>
        </section>
      ) : null}

      {/* Testimonials appear only when the owner has published real ones. */}
      {testimonials.length > 0 ? (
        <section className="container-site pb-16" aria-labelledby="said">
          <p className="eyebrow">From customers</p>
          <h2 id="said" className="mt-2">What people say</h2>
          <div className="mt-7 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.id} className="rounded-3xl bg-raise p-6">
                <blockquote className="text-lg font-medium leading-snug text-ink">“{item.body}”</blockquote>
                <figcaption className="mt-3 text-xs uppercase tracking-wide text-muted">
                  {item.authorName}{item.location ? `, ${item.location}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* ============================================================= CTA == */}
      <section className="container-site pb-16 sm:pb-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-raise p-6 sm:flex-row sm:items-end sm:p-10">
          <div>
            <h2 className="max-w-[18ch]">Looking for something you cannot see?</h2>
            <p className="mt-3 max-w-md text-sm text-muted">
              We stock more than fits on a website. Tell us what you need and we will check the shop.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {whatsappHref ? (
              <ButtonLink href={whatsappHref} external variant="whatsapp">
                <WhatsAppIcon className="h-4 w-4" />
                Ask on WhatsApp
              </ButtonLink>
            ) : null}
            <ButtonLink href="/contact" variant="secondary">Contact us</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
