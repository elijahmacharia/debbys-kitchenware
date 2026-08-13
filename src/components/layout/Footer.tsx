import Link from 'next/link';
import { business, isPlaceholder, mailtoHref, social, telHref } from '@/lib/config';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import {
  ClockIcon, FacebookIcon, InstagramIcon, MailIcon, MapPinIcon, PhoneIcon, TikTokIcon, WhatsAppIcon,
} from '@/components/icons';

const SOCIAL_ICON = { Instagram: InstagramIcon, Facebook: FacebookIcon, TikTok: TikTokIcon } as const;

/**
 * Contact details render only when the business has supplied them. A blank or
 * [PLACEHOLDER] value is skipped rather than printed, so the live site never
 * shows a phone number nobody answers.
 */
export function Footer() {
  const whatsappHref = waLink(generalEnquiryMessage());
  const phoneHref = telHref();
  const emailHref = mailtoHref();
  const year = new Date().getFullYear();

  const columnLink = 'block py-1.5 text-sm text-white/70 transition-colors hover:text-white';

  return (
    <footer className="mt-20 bg-ink text-white/85">
      <div className="container-site grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-semibold tracking-tight text-xl text-white">{business.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
            Kitchenware, household essentials and everyday products. Shop online, collect at our shop
            or have your order delivered.
          </p>
          {social.length > 0 ? (
            <div className="mt-4 flex gap-2">
              {social.map((item) => {
                const Icon = SOCIAL_ICON[item.name as keyof typeof SOCIAL_ICON];
                return (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${business.name} on ${item.name}`}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Shop</h2>
          <div className="mt-3">
            <Link href="/shop" className={columnLink}>All products</Link>
            <Link href="/categories" className={columnLink}>Categories</Link>
            <Link href="/shop?sale=1" className={columnLink}>Special offers</Link>
            <Link href="/shop?new=1" className={columnLink}>New arrivals</Link>
            <Link href="/about" className={columnLink}>About us</Link>
          </div>
        </nav>

        <nav aria-labelledby="footer-service">
          <h2 id="footer-service" className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Customer service</h2>
          <div className="mt-3">
            <Link href="/delivery" className={columnLink}>Delivery &amp; pickup</Link>
            <Link href="/payment" className={columnLink}>How to pay</Link>
            <Link href="/returns" className={columnLink}>Returns</Link>
            <Link href="/faq" className={columnLink}>FAQ</Link>
            <Link href="/contact" className={columnLink}>Contact us</Link>
          </div>
        </nav>

        <nav aria-labelledby="footer-account">
          <h2 id="footer-account" className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Account</h2>
          <div className="mt-3">
            <Link href="/login" className={columnLink}>Sign in</Link>
            <Link href="/register" className={columnLink}>Create account</Link>
            <Link href="/account/orders" className={columnLink}>My orders</Link>
            <Link href="/account/wishlist" className={columnLink}>Wishlist</Link>
            <Link href="/cart" className={columnLink}>My cart</Link>
          </div>
        </nav>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Get in touch</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-white/70">
            {phoneHref ? (
              <li className="flex gap-2">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={phoneHref} className="hover:text-white hover:underline">{business.phone}</a>
              </li>
            ) : null}
            {whatsappHref ? (
              <li className="flex gap-2">
                <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">Chat on WhatsApp</a>
              </li>
            ) : null}
            {emailHref ? (
              <li className="flex gap-2">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={emailHref} className="break-all hover:text-white hover:underline">{business.email}</a>
              </li>
            ) : null}
            {!isPlaceholder(business.address) ? (
              <li className="flex gap-2"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>{business.address}</span></li>
            ) : null}
            {!isPlaceholder(business.hours) ? (
              <li className="flex gap-2"><ClockIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>{business.hours}</span></li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {business.name}. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/privacy-policy" className="hover:text-white hover:underline">Privacy policy</Link>
            <Link href="/terms" className="hover:text-white hover:underline">Terms &amp; conditions</Link>
            <Link href="/returns" className="hover:text-white hover:underline">Returns policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
