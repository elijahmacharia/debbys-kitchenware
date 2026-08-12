import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getFeaturedProducts, getNewArrivals, getSaleProducts } from '@/lib/queries/products';
import { getTopCategories } from '@/lib/queries/categories';
import { getActiveDeliveryZones, getPublishedTestimonials } from '@/lib/queries/content';
import { getCustomerSession } from '@/lib/auth';
import { getWishlistProductIds } from '@/lib/queries/wishlist';
import { business } from '@/lib/config';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductCard } from '@/components/product/ProductCard';
import { Section, SectionHeader } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { WebsiteSearchJsonLd } from '@/components/seo/JsonLd';
import { CartIcon, GridIcon, PackageIcon, StarIcon, StoreIcon, TagIcon, TruckIcon, WhatsAppIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: `${business.name}, Kitchenware & Household Essentials in Kenya`,
  description:
    'Everything you need for your kitchen and home. Shop quality kitchenware, utensils, buckets, basins, storage and cleaning products at affordable prices. Pickup or delivery, and ordering on WhatsApp.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [featured, newArrivals, onSale, categories, session, zones, testimonials] = await Promise.all([
    getFeaturedProducts(4),
    getNewArrivals(4),
    getSaleProducts(4),
    getTopCategories(6),
    getCustomerSession(),
    getActiveDeliveryZones(),
    getPublishedTestimonials(),
  ]);

  const wishlisted = await getWishlistProductIds(session?.sub ?? null);
  const whatsappHref = waLink(generalEnquiryMessage());
  const isSignedIn = Boolean(session);

  return (
    <>
      <WebsiteSearchJsonLd />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-line bg-gradient-to-b from-brand-50 to-canvas">
        <div className="container-site grid gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
              <StoreIcon className="h-3.5 w-3.5" />
              Shop pickup &amp; local delivery
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Everything you need for your kitchen and home
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Quality kitchenware and household essentials at affordable prices. Order online, or
              send us your list on WhatsApp.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <ButtonLink href="/shop" className="sm:px-7">
                <CartIcon className="h-4 w-4" />
                Shop now
              </ButtonLink>
              {whatsappHref ? (
                <ButtonLink href={whatsappHref} external variant="whatsapp" className="sm:px-7">
                  <WhatsAppIcon className="h-4 w-4" />
                  Ask on WhatsApp
                </ButtonLink>
              ) : (
                <ButtonLink href="/contact" variant="secondary">Contact us</ButtonLink>
              )}
            </div>
            <p className="mt-4 text-xs text-muted">
              No account needed to order · Pay on delivery or pickup where available
            </p>
          </div>

          {/*
            The hero used to repeat the category tiles that appear in full
            directly below it. Showing a few real products instead gives the
            customer something to actually click, and does not duplicate the
            section underneath.
          */}
          {featured.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {featured.slice(0, 2).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappHref={whatsappHref}
                  isSignedIn={isSignedIn}
                  isWishlisted={wishlisted.has(product.id)}
                  priority
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------------- Trust signals */}
      <div className="border-b border-line bg-surface">
        <div className="container-site grid grid-cols-2 gap-4 py-5 sm:grid-cols-4">
          {[
            { Icon: PackageIcon, title: 'Wide range', text: 'Kitchen, home, storage, cleaning' },
            { Icon: TagIcon, title: 'Affordable', text: 'Everyday value' },
            { Icon: TruckIcon, title: 'Pickup or delivery', text: zones.length > 0 ? `${zones.length} delivery areas` : 'Ask about delivery' },
            { Icon: WhatsAppIcon, title: 'WhatsApp ordering', text: 'Send your list' },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex gap-2.5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="text-xs leading-snug text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- Categories */}
      <Section labelledBy="home-categories">
        <SectionHeader id="home-categories" title="Shop by category" href="/categories" linkLabel="All categories" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="card flex flex-col items-center gap-2 p-4 text-center transition hover:border-brand-300">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700"><GridIcon className="h-5 w-5" /></span>
              <span className="text-sm font-semibold leading-snug text-ink">{category.name}</span>
              <span className="text-xs text-muted">{category.productCount} items</span>
            </Link>
          ))}
        </div>
      </Section>

      {featured.length > 0 ? (
        <Section labelledBy="home-featured" className="pt-0">
          <SectionHeader id="home-featured" title="Featured products" href="/shop" linkLabel="Shop all" />
          <ProductGrid products={featured} whatsappHref={whatsappHref} isSignedIn={isSignedIn} wishlistedIds={wishlisted} priorityCount={0} />
        </Section>
      ) : null}

      {onSale.length > 0 ? (
        <div className="bg-accent-50/60 py-2">
          <Section labelledBy="home-offers">
            <SectionHeader
              id="home-offers"
              title="Special offers"
              description="Prices shown are the reduced prices."
              href="/shop?sale=1"
              linkLabel="All offers"
            />
            <ProductGrid products={onSale} whatsappHref={whatsappHref} isSignedIn={isSignedIn} wishlistedIds={wishlisted} priorityCount={0} />
          </Section>
        </div>
      ) : null}

      {newArrivals.length > 0 ? (
        <Section labelledBy="home-new">
          <SectionHeader id="home-new" title="New arrivals" href="/shop?new=1" linkLabel="See all new" />
          <ProductGrid products={newArrivals} whatsappHref={whatsappHref} isSignedIn={isSignedIn} wishlistedIds={wishlisted} priorityCount={0} />
        </Section>
      ) : null}

      <Section labelledBy="home-why" className="pt-0">
        <SectionHeader id="home-why" title="Why shop with us" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { image: 'one-place', title: 'Everything in one place', text: 'Kitchen, household, storage and cleaning, no walking between shops.' },
            { image: 'honest-prices', title: 'Honest prices', text: 'The price on the product page is what you pay, plus delivery if you choose it.' },
            { image: 'order-your-way', title: 'Order your way', text: 'Check out online, or send your list on WhatsApp.' },
            { image: 'collect-or-delivered', title: 'Collect or delivered', text: 'Pickup is free. Delivery fees are shown before you confirm.' },
            { image: 'real-person', title: 'A real person replies', text: 'Ask about a size, a colour or stock and we will check.' },
            { image: 'no-account', title: 'No account needed', text: 'Check out as a guest. Sign up only if you want your details saved.' },
          ].map((item) => (
            <div key={item.title} className="card overflow-hidden">
              {/*
                Fixed aspect ratio so the row of cards cannot jump around as
                the images load. Lazy, because this section is below the fold.
              */}
              <div className="relative aspect-[800/380] bg-brand-50">
                <Image
                  src={`/banners/${item.image}.svg`}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonials appear only once the owner publishes real ones. */}
      {testimonials.length > 0 ? (
        <Section labelledBy="home-reviews" className="pt-0">
          <SectionHeader id="home-reviews" title="What our customers say" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.id} className="card p-4">
                <div className="flex gap-0.5 text-accent-500" aria-label={`${item.rating} out of 5`}>
                  {Array.from({ length: item.rating }, (_, i) => <StarIcon key={i} className="h-4 w-4" fill="currentColor" />)}
                </div>
                <blockquote className="mt-2 text-sm leading-relaxed text-ink">“{item.body}”</blockquote>
                <figcaption className="mt-2 text-xs text-muted">
                  {item.authorName}{item.location ? `, ${item.location}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      ) : null}

      <Section className="pt-0">
        <div className="card flex flex-col items-start gap-4 bg-brand-700 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-bold">Cannot find what you need?</h2>
            <p className="mt-1 text-sm text-brand-50/90">
              Message us. If we do not have it, we will try to source it.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {whatsappHref ? (
              <ButtonLink href={whatsappHref} external variant="whatsapp">
                <WhatsAppIcon className="h-4 w-4" />
                Message us
              </ButtonLink>
            ) : null}
            <ButtonLink href="/contact" variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              Contact page
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
