import Link from 'next/link';
import { getCategoryTree } from '@/lib/queries/categories';
import { getCustomerSession } from '@/lib/auth';
import { getPublicSettings } from '@/lib/settings';
import { business, telHref } from '@/lib/config';
import { generalEnquiryMessage, waLink } from '@/lib/whatsapp';
import { AnnouncementBar } from './AnnouncementBar';
import { AccountMenu } from './AccountMenu';
import { CartButton } from './CartButton';
import { CategoryMenu } from './CategoryMenu';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { SearchBox } from './SearchBox';
import { PhoneIcon, WhatsAppIcon } from '@/components/icons';

/**
 * Site header. A server component, so the customer's name, the live category
 * list and the announcement text are all in the initial HTML — no flash of
 * "Sign in" before the name appears.
 */
export async function Header() {
  const [tree, session, settings] = await Promise.all([
    getCategoryTree(),
    getCustomerSession(),
    getPublicSettings(),
  ]);

  const categories = tree.map((c) => ({
    name: c.name,
    slug: c.slug,
    children: c.children.map((child) => ({ name: child.name, slug: child.slug })),
  }));

  const whatsappHref = waLink(generalEnquiryMessage());
  const phoneHref = telHref();
  const navLink = 'inline-flex h-11 items-center px-3 text-sm text-ink transition-colors hover:text-clay-700';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <AnnouncementBar message={settings.announcement} />

      {/* Utility strip, desktop only, nothing essential lives here. */}
      <div className="hidden border-b border-line bg-canvas lg:block">
        <div className="container-site flex h-9 items-center justify-between text-xs text-muted">
          <p>Free pickup at the shop · Local delivery</p>
          <div className="flex items-center gap-4">
            {phoneHref ? (
              <a href={phoneHref} className="inline-flex items-center gap-1.5 hover:text-clay-700">
                <PhoneIcon className="h-3.5 w-3.5" /> {business.phone}
              </a>
            ) : null}
            <Link href="/delivery" className="hover:text-clay-700">Delivery &amp; pickup</Link>
            <Link href="/contact" className="hover:text-clay-700">Contact</Link>
          </div>
        </div>
      </div>

      <div className="container-site">
        <div className="flex h-16 items-center gap-2">
          <MobileMenu
            categories={categories}
            isSignedIn={Boolean(session)}
            customerName={session?.name ?? null}
            whatsappHref={whatsappHref}
          />

          <Logo className="mr-1 shrink-0" />

          <SearchBox className="mx-auto hidden max-w-xl flex-1 lg:block" />

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <AccountMenu name={session?.name ?? null} />
            <CartButton />
          </div>
        </div>

        {/* Mobile search sits on its own row so it is full width and easy to hit. */}
        <div className="pb-3 lg:hidden">
          <SearchBox />
        </div>
      </div>

      <nav aria-label="Main" className="hidden border-t border-line lg:block">
        <div className="container-site flex items-center gap-1">
          <Link href="/shop" className={navLink}>Shop</Link>
          <CategoryMenu categories={categories} />
          <Link href="/shop?sale=1" className={navLink}>Offers</Link>
          <Link href="/shop?new=1" className={navLink}>New arrivals</Link>
          <Link href="/about" className={navLink}>About</Link>
          <Link href="/delivery" className={navLink}>Delivery</Link>
          <Link href="/contact" className={navLink}>Contact</Link>
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex h-11 items-center gap-2 px-3 text-sm text-ink hover:text-whatsapp"
            >
              <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
              WhatsApp
            </a>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
