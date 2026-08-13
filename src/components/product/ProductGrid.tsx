import type { ProductListItem } from '@/lib/queries/products';
import { ProductCard } from './ProductCard';

/**
 * Two columns on the smallest phone, four on a desktop. Two rather than one on
 * mobile because a household-goods shopper is comparing similar items.
 *
 * Generous vertical spacing does the separating, so the cards need no borders.
 */
export function ProductGrid({
  products, isSignedIn, wishlistedIds, priorityCount = 4,
}: {
  products: ProductListItem[];
  /** Kept for callers that still pass it; cards no longer use it. */
  whatsappHref?: string | null;
  isSignedIn: boolean;
  wishlistedIds?: Set<string>;
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          isSignedIn={isSignedIn}
          isWishlisted={wishlistedIds?.has(product.id)}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
