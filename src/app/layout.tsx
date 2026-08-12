import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { analytics, business, siteUrl } from '@/lib/config';

/**
 * Root layout.
 *
 * Deliberately thin: it owns <html>, <body> and the few things every route
 * needs. The storefront chrome (header, footer, cart, WhatsApp button, install
 * prompt) lives in the (storefront) group, and the admin dashboard has its own
 * chrome in (admin) — so the shop header never appears over admin screens and
 * admin pages never load cart code.
 */

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${business.name}, Kitchenware & Household Essentials in Kenya`,
    template: `%s | ${business.name}`,
  },
  description:
    'Shop kitchenware, kitchen utensils, household goods, plastic products, storage and cleaning items at affordable prices. Order online or on WhatsApp, with shop pickup and local delivery.',
  applicationName: business.name,
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: { telephone: true, address: false, email: false },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: business.name,
    url: siteUrl,
    title: `${business.name}, Kitchenware & Household Essentials`,
    description:
      'Quality kitchenware, household essentials and everyday products at affordable prices. Pickup or local delivery, and ordering on WhatsApp.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: business.shortName, statusBarStyle: 'default' },
  ...(analytics.gscVerification ? { verification: { google: analytics.gscVerification } } : {}),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom stays enabled. Disabling it is an accessibility failure for anyone
  // who needs to enlarge text.
  maximumScale: 5,
  themeColor: '#1f6b52',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE">
      <body className="flex min-h-screen flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
