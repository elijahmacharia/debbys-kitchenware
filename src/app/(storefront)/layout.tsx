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

/**
 * Never prerender the shop at build time.
 *
 * Route segment config on a layout applies to every segment beneath it.
 *
 * These pages already render on demand in production — the getCustomerSession()
 * call below reads cookies, which forces that. The problem was the *build*:
 * Next still executed pages like /terms, /about and /faq while generating, and
 * those call getPublicSettings(), which queries the database. So `next build`
 * could not finish without a reachable database, and on a hosted one the calls
 * were slow enough to exceed Next's 60-second limit. A different page failed
 * each run, which is what a timing problem looks like rather than a broken page.
 *
 * Declaring it here means the build never touches the database. That is worth
 * having on its own: a deploy should not depend on the database being awake,
 * responsive, or even reachable from the build machine.
 *
 * The cost is that every page view queries the database, including from the
 * United States to Frankfurt. If page speed becomes the priority, the fix is to
 * move the session read out of this layout and into the components that need
 * it, then cache the pages that have no per-visitor content. That is a real
 * piece of work, not a config change.
 */
export const dynamic = 'force-dynamic';

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
