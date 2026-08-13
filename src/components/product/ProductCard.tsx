'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { WishlistButton } from './WishlistButton';
import { CheckIcon, ImageIcon, PlusIcon } from '@/components/icons';
import { discountPercent, effectivePriceCents, formatKsh, isOnSale } from '@/lib/money';
import type { ProductListItem } from '@/lib/queries/products';
import { cn } from '@/lib/cn';

/**
 * Product tile.
 *
 * A soft rounded image panel, a heart in the top corner, and a single circular
 * add button that straddles the bottom edge of the image. Text sits on the page
 * beneath, so nothing is boxed twice.
 *
 * One action. The image and the name link through to the product; enquiries
 * live on the floating WhatsApp button.
 */
export function ProductCard({
  product, isSignedIn, isWishlisted, priority,
}: {
  product: ProductListItem;
  /** Accepted for compatibility; tiles no longer render a WhatsApp button. */
  whatsappHref?: string | null;
  isSignedIn: boolean;
  isWishlisted?: boolean;
  priority?: boolean;
}) {
  const href = `/product/${product.slug}`;
  const soldOut = product.stock <= 0;
  const onSale = isOnSale(product);
  const { add } = useCart();
  const [imageFailed, setImageFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const addToCart = () => {
    if (soldOut) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      imageUrl: product.imageUrl,
      unitPriceCents: effectivePriceCents(product),
      listPriceCents: product.priceCents,
      stock: product.stock,
      unit: product.unit,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <article className="group flex flex-col">
      <div className="relative">
        <Link href={href} className="block overflow-hidden rounded-3xl bg-raise" tabIndex={-1} aria-hidden="true">
          <div className="relative aspect-square">
            {product.imageUrl && !imageFailed ? (
              <Image
                src={product.imageUrl}
                alt={product.imageAlt ?? product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                loading={priority ? undefined : 'lazy'}
                onError={() => setImageFailed(true)}
                className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full place-items-center text-subtle"><ImageIcon className="h-9 w-9" /></div>
            )}
          </div>
        </Link>

        {/* One badge at most: a discount outranks a New flag. */}
        {onSale ? (
          <span className="badge absolute left-3 top-3 bg-clay-600 text-white">-{discountPercent(product)}%</span>
        ) : product.isNewArrival ? (
          <span className="badge absolute left-3 top-3 bg-ink text-white">New</span>
        ) : null}

        <div className="absolute right-2.5 top-2.5">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            isSignedIn={isSignedIn}
            initiallySaved={isWishlisted}
            returnTo={href}
          />
        </div>

        {soldOut ? (
          <div className="absolute inset-x-0 bottom-0 rounded-b-3xl bg-ink/75 py-2 text-center text-[11px] font-semibold text-white">
            Out of stock
          </div>
        ) : (
          /* Straddles the image edge, as in the reference. */
          <button
            type="button"
            onClick={addToCart}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              'absolute -bottom-4 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full',
              'shadow-soft ring-4 ring-canvas transition active:scale-90',
              justAdded ? 'bg-success text-white' : 'bg-ink text-white hover:bg-ink/90',
            )}
          >
            {justAdded ? <CheckIcon className="h-4.5 w-4.5" /> : <PlusIcon className="h-5 w-5" />}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center pt-7 text-center">
        <h3 className="text-[0.92rem] font-medium leading-snug">
          <Link href={href} className="line-clamp-2 hover:underline hover:underline-offset-4">{product.name}</Link>
        </h3>

        <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2">
          <span className="text-[0.98rem] font-bold text-clay-600">{formatKsh(effectivePriceCents(product))}</span>
          {onSale ? <s className="text-xs text-subtle">{formatKsh(product.priceCents)}</s> : null}
        </div>

        {product.stock > 0 && product.stock <= product.lowStockAt ? (
          <p className="mt-1 text-[11px] text-muted">Only {product.stock} left</p>
        ) : null}
      </div>
    </article>
  );
}
