import Script from 'next/script';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFab } from '@/components/layout/WhatsAppFab';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartProvider } from '@/components/cart/CartProvider';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ServiceWorkerManager } from '@/components/pwa/ServiceWorkerManager';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';
import { getCustomerSession } from '@/lib/auth';
import { analytics } from '@/lib/config';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';

/*
 * NOTE ON CACHING, because it is not obvious from reading this file.
 *
 * Every page under this layout renders on demand, never from a build-time
 * cache. That is not configured anywhere — it falls out of the
 * getCustomerSession() call below, which reads cookies, and reading cookies
 * makes the whole subtree dynamic.
 *
 * The upside is that product changes appear immediately. The cost is that every
 * visit to the homepage runs its product queries against the database, which on
 * a hosted database means real network latency on every page view.
 *
 * If page speed becomes the priority, the fix is to move the session read out
 * of this layout and into the components that actually need it, then add
 * `export const revalidate` here. Adding revalidate on its own does nothing
 * while the cookie read stays — which is worth knowing before trying it.
 */

/** Public shop chrome. Everything a customer sees sits inside this. */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();
  const whatsappHref = waLink(generalEnquiryMessage());

  return (
    <>
      {/* First tab stop on every page, for keyboard and screen reader users. */}
      <a href="#main" className="sr-only-focusable">Skip to main content</a>

      <CartProvider isSignedIn={Boolean(session)}>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFab href={whatsappHref} />
        <BottomNav />
        <InstallPrompt />
        <ServiceWorkerManager />
      </CartProvider>

      <OrganizationJsonLd />

      {analytics.gaMeasurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${analytics.gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());gtag('config','${analytics.gaMeasurementId}');`}
          </Script>
        </>
      ) : null}
    </>
  );
}
