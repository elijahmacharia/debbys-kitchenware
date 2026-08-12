import type { MetadataRoute } from 'next';
import { business } from '@/lib/config';

/**
 * Web app manifest.
 *
 * `display: standalone` and a `start_url` are what make the site installable.
 * Nothing here changes the website for a normal browser visit — installing is
 * entirely the customer's choice.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: business.name,
    short_name: business.shortName,
    description: 'Kitchenware, household essentials and everyday products. Shop online, collect or have it delivered.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f9faf9',
    theme_color: '#1f6b52',
    lang: 'en-KE',
    categories: ['shopping', 'business'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Shop all products', url: '/shop' },
      { name: 'My orders', url: '/account/orders' },
      { name: 'Cart', url: '/cart' },
    ],
  };
}
