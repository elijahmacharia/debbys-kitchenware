'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge, StockBadge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { ImageIcon } from '@/components/icons';
import { effectivePriceCents } from '@/lib/money';
import type { ProductListItem } from '@/lib/queries/products';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';
import { WhatsAppOrderButton } from './WhatsAppOrderButton';

/**
 * The product card used in every grid on the site.
 *
 * Details that matter commercially:
 *  - The image and title link to the product; the buttons underneath are
 *    separate targets, so tapping "Add to cart" never navigates by accident.
 *  - The image box has a fixed aspect ratio, reserving the space before the
 *    picture downloads, which stops the grid jumping (cumulative layout shift).
 *  - Only the first row of cards loads eagerly; the rest are lazy.
 */
export function ProductCard({
  product, whatsappHref, isSignedIn, isWishlisted, priority,
}: {
  product: ProductListItem;
  whatsappHref: string | null;
  isSignedIn: boolean;
  isWishlisted?: boolean;
  priority?: boolean;
}) {
  const href = `/product/${product.slug}`;
  const soldOut = product.stock <= 0;

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:border-brand-200">
      <div className="relative aspect-square bg-canvas">
        <Link href={href} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full place-items-center text-subtle"><ImageIcon className="h-10 w-10" /></div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.isNewArrival ? <Badge tone="brand">New</Badge> : null}
          {product.isFeatured && !product.isNewArrival ? <Badge tone="neutral">Featured</Badge> : null}
        </div>

        <div className="absolute right-2 top-2">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            isSignedIn={isSignedIn}
            initiallySaved={isWishlisted}
            returnTo={href}
          />
        </div>

        {soldOut ? (
          <div className="absolute inset-x-0 bottom-0 bg-ink/75 py-1.5 text-center text-xs font-semibold text-white">
            Out of stock
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/category/${product.categorySlug}`} className="text-[11px] font-medium uppercase tracking-wide text-subtle hover:text-brand-700">
          {product.categoryName}
        </Link>

        <h3 className="text-sm font-semibold leading-snug text-ink">
          <Link href={href} className="line-clamp-2 hover:text-brand-700">{product.name}</Link>
        </h3>

        <Price product={product} />

        <div className="mt-auto space-y-2 pt-1">
          <StockBadge stock={product.stock} lowStockAt={product.lowStockAt} />

          <AddToCartButton
            fullWidth
            size="sm"
            line={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              imageUrl: product.imageUrl,
              unitPriceCents: effectivePriceCents(product),
              listPriceCents: product.priceCents,
              stock: product.stock,
              unit: product.unit,
            }}
          />

          <div className="grid grid-cols-2 gap-2">
            <Link href={href} className="btn-secondary btn-sm">View</Link>
            <WhatsAppOrderButton href={whatsappHref} label="WhatsApp" size="sm" source={`product-card:${product.sku}`} />
          </div>
        </div>
      </div>
    </article>
  );
}
