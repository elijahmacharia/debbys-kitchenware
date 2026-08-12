import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';

/**
 * Crawlers are welcome on the catalogue and blocked from anything private or
 * pointless to index: the admin area, personal account pages, the cart and
 * checkout, order confirmations, and the JSON API.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/account', '/account/', '/cart', '/checkout', '/order-confirmation/', '/api/', '/reset-password'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
