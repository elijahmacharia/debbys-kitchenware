import type { Metadata } from 'next';
import { business, isPlaceholder, mailtoHref, social, telHref } from '@/lib/config';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContactForm } from '@/components/ContactForm';
import { Alert } from '@/components/ui/Alert';
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Contact us',
  description: `Get in touch with ${business.name}, phone, WhatsApp, email, our location and opening hours.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  const whatsappHref = waLink(generalEnquiryMessage());
  const phoneHref = telHref();
  const emailHref = mailtoHref();

  const hasAnyContact = Boolean(phoneHref || whatsappHref || emailHref);

  return (
    <div className="container-site py-6">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Contact' }]} />
      <h1 className="mt-3">Contact us</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Questions about a product, an order or delivery? Send us a message.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section className="card p-4 sm:p-5" aria-labelledby="contact-form">
          <h2 id="contact-form" className="text-base font-bold">Send us a message</h2>
          <div className="mt-4"><ContactForm /></div>
        </section>

        <aside className="space-y-4">
          <section className="card p-4" aria-labelledby="contact-details">
            <h2 id="contact-details" className="text-base font-bold">Find {business.name}</h2>

            {!hasAnyContact ? (
              <Alert tone="warning" className="mt-3">
                Contact details are not set up yet. Use the form and we will still get your message.
              </Alert>
            ) : null}

            <ul className="mt-3 space-y-3 text-sm">
              {phoneHref ? (
                <li className="flex gap-2.5">
                  <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>
                    <span className="block text-xs text-muted">Phone</span>
                    <a href={phoneHref} className="link">{business.phone}</a>
                  </span>
                </li>
              ) : null}
              {whatsappHref ? (
                <li className="flex gap-2.5">
                  <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                  <span>
                    <span className="block text-xs text-muted">WhatsApp</span>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="link">Start a chat</a>
                  </span>
                </li>
              ) : null}
              {emailHref ? (
                <li className="flex gap-2.5">
                  <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>
                    <span className="block text-xs text-muted">Email</span>
                    <a href={emailHref} className="link break-all">{business.email}</a>
                  </span>
                </li>
              ) : null}
              {!isPlaceholder(business.address) ? (
                <li className="flex gap-2.5">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>
                    <span className="block text-xs text-muted">Shop</span>
                    <span>{business.address}</span>
                  </span>
                </li>
              ) : null}
              {!isPlaceholder(business.hours) ? (
                <li className="flex gap-2.5">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>
                    <span className="block text-xs text-muted">Opening hours</span>
                    <span>{business.hours}</span>
                  </span>
                </li>
              ) : null}
            </ul>

            {social.length > 0 ? (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs text-muted">Also find us on</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {social.map((item) => (
                    <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/*
            The map renders only if a real Google Maps link has been supplied.
            Inventing coordinates would send customers to the wrong place.
          */}
          <section className="card overflow-hidden" aria-labelledby="map">
            <h2 id="map" className="border-b border-line px-4 py-3 text-base font-bold">Getting here</h2>
            {business.mapsEmbedUrl ? (
              <iframe
                src={business.mapsEmbedUrl}
                title={`Map showing the location of ${business.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0"
              />
            ) : (
              <div className="p-4 text-sm text-muted">
                <p>The shop location has not been added to the site yet.</p>
                <p className="mt-1.5 text-xs">
                  Owner: paste your Google Maps share link into <code>NEXT_PUBLIC_GOOGLE_MAPS_URL</code>{' '}
                  and the embed link into <code>NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL</code>.
                </p>
              </div>
            )}
            {business.mapsUrl ? (
              <div className="border-t border-line p-3">
                <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm w-full">
                  Get directions
                </a>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
