import Script from 'next/script';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFab } from '@/components/layout/WhatsAppFab';
import { CartProvider } from '@/components/cart/CartProvider';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ServiceWorkerManager } from '@/components/pwa/ServiceWorkerManager';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';
import { getCustomerSession } from '@/lib/auth';
import { analytics } from '@/lib/config';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';

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
