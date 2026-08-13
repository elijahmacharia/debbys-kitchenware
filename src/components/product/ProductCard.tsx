'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { StockBadge } from '@/components/ui/Badge';
import { ImageIcon } from '@/components/icons';
import { discountPercent, effectivePriceCents, formatKsh, isOnSale } from '@/lib/money';
import type { ProductListItem } from '@/lib/queries/products';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';

/**
 * The product card.
 *
 * Deliberately not a card: no border, no shadow, no rounded box. The image sits
 * on a tinted panel and the text sits on the page beneath it, which is how
 * catalogues and printed price lists have always worked. Twenty-four bordered
 * boxes in a grid is the fastest way to make a shop look generated.
 *
 * One action only. The image and title already link through to the product, so
 * a "View" button was just noise, and enquiries have the floating WhatsApp
 * button.
 */
export function ProductCard({
  product, isSignedIn, isWishlisted, priority,
}: {
  product: ProductListItem;
  /** Accepted for compatibility; enquiries go through the floating button. */
  whatsappHref?: string | null;
  isSignedIn: boolean;
  isWishlisted?: boolean;
  priority?: boolean;
}) {
  const href = `/product/${product.slug}`;
  const soldOut = product.stock <= 0;
  const onSale = isOnSale(product);
  /*
   * A 404 makes the browser paint the alt text across the frame, over the
   * badges. Tracking the failure lets the placeholder take over quietly.
   */
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-[3px] bg-raise">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          {product.imageUrl && !imageFailed ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              onError={() => setImageFailed(true)}
              className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="grid h-full place-items-center text-subtle"><ImageIcon className="h-9 w-9" /></div>
          )}
        </Link>

        {/* One badge at most. Stacking three is clutter. */}
        {onSale ? (
          <span className="badge absolute left-2.5 top-2.5 bg-clay-600 text-white">
            -{discountPercent(product)}%
          </span>
        ) : product.isNewArrival ? (
          <span className="badge absolute left-2.5 top-2.5 bg-olive-800 text-white">New</span>
        ) : null}

        <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            isSignedIn={isSignedIn}
            initiallySaved={isWishlisted}
            returnTo={href}
          />
        </div>

        {soldOut ? (
          <div className="absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
            Out of stock
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[11px] uppercase tracking-wide text-subtle">{product.categoryName}</p>

        <h3 className="mt-1 text-[0.95rem] font-medium leading-snug">
          <Link href={href} className="line-clamp-2 hover:underline hover:decoration-clay-400 hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>

        {/* Price is the loudest thing in the block, which is what a shopper scans for. */}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[1.05rem] font-bold tracking-tight text-ink">
            {formatKsh(effectivePriceCents(product))}
          </span>
          {onSale ? <s className="text-xs text-subtle">{formatKsh(product.priceCents)}</s> : null}
        </div>

        {product.stock > 0 && product.stock <= product.lowStockAt ? (
          <p className="mt-1 text-[11px] font-medium text-clay-700">Only {product.stock} left</p>
        ) : null}

        <div className="mt-3 pt-0.5">
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
        </div>
      </div>
    </article>
  );
}
