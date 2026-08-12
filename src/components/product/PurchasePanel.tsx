'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QuantityStepper } from './QuantityStepper';
import { AddToCartButton } from './AddToCartButton';
import { WhatsAppOrderButton } from './WhatsAppOrderButton';
import { WishlistButton } from './WishlistButton';
import type { CartLine } from '@/components/cart/CartProvider';
import { formatKsh } from '@/lib/money';

/**
 * The buy box: quantity, add to cart, buy on WhatsApp, wishlist.
 *
 * Quantity and the running line total sit together so the customer can see
 * what "3 of these" actually costs before committing.
 */
export function PurchasePanel({
  line, whatsappHref, isSignedIn, isWishlisted, productSlug,
}: {
  line: Omit<CartLine, 'quantity'>;
  whatsappHref: string | null;
  isSignedIn: boolean;
  isWishlisted: boolean;
  productSlug: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const soldOut = line.stock <= 0;

  return (
    <div className="space-y-4">
      {!soldOut ? (
        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} max={line.stock} />
          {quantity > 1 ? (
            <p className="text-sm text-muted">
              Total: <span className="font-semibold text-ink">{formatKsh(line.unitPriceCents * quantity)}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <AddToCartButton line={line} quantity={quantity} fullWidth />
        <WhatsAppOrderButton href={whatsappHref} label="Ask on WhatsApp" fullWidth source={`product-page:${line.sku}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <WishlistButton
          productId={line.productId}
          productName={line.name}
          isSignedIn={isSignedIn}
          initiallySaved={isWishlisted}
          variant="full"
          returnTo={`/product/${productSlug}`}
        />
        {!soldOut ? <Link href="/cart" className="btn-ghost border border-line">Go to cart</Link> : null}
      </div>
    </div>
  );
}
