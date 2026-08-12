import { business, isPlaceholder, siteUrl, social } from '@/lib/config';
import { effectivePriceCents } from '@/lib/money';

/**
 * Structured data.
 *
 * Only facts the business has actually supplied are emitted. A placeholder
 * address or phone number is omitted rather than published — wrong data in
 * schema.org markup is worse than none, because Google may surface it.
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function OrganizationJsonLd() {
  const sameAs = social.map((s) => s.url);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${siteUrl}/#store`,
    name: business.name,
    url: siteUrl,
    description: 'Kitchenware, kitchen utensils, household goods, plastic products, storage and cleaning items in Kenya.',
    ...(sameAs.length ? { sameAs } : {}),
    ...(isPlaceholder(business.phone) ? {} : { telephone: business.phone }),
    ...(isPlaceholder(business.email) ? {} : { email: business.email }),
    ...(isPlaceholder(business.address)
      ? {}
      : {
          address: {
            '@type': 'PostalAddress',
            streetAddress: business.address,
            ...(isPlaceholder(business.city) ? {} : { addressLocality: business.city }),
            ...(isPlaceholder(business.county) ? {} : { addressRegion: business.county }),
            addressCountry: 'KE',
          },
        }),
    ...(isPlaceholder(business.hours) ? {} : { openingHours: business.hours }),
    ...(business.mapsUrl ? { hasMap: business.mapsUrl } : {}),
    currenciesAccepted: 'KES',
    areaServed: { '@type': 'Country', name: 'Kenya' },
  };
  return <JsonLd data={data} />;
}

export function WebsiteSearchJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: siteUrl,
        name: business.name,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/shop?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function ProductJsonLd({
  product, images, categoryName,
}: {
  product: { name: string; slug: string; sku: string; description: string; priceCents: number; salePriceCents: number | null; stock: number };
  images: string[];
  categoryName: string;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        sku: product.sku,
        description: product.description.slice(0, 500),
        category: categoryName,
        image: images.map((url) => `${siteUrl}${url}`),
        brand: { '@type': 'Brand', name: business.name },
        offers: {
          '@type': 'Offer',
          url: `${siteUrl}/product/${product.slug}`,
          priceCurrency: 'KES',
          price: (effectivePriceCents(product) / 100).toFixed(2),
          // Honest availability, straight from the stock column.
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: business.name },
        },
        // No aggregateRating: the shop has no verified reviews yet, and
        // inventing them would be dishonest and a Google policy breach.
      }}
    />
  );
}

export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }}
    />
  );
}
