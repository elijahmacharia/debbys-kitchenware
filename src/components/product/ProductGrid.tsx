import type { ProductListItem } from '@/lib/queries/products';
import { ProductCard } from './ProductCard';

/**
 * Two columns on the smallest phone, scaling to four on a desktop. Two rather
 * than one on mobile because a household-goods shopper is comparing similar
 * items, and seeing two at once makes that much quicker.
 */
export function ProductGrid({
  products, whatsappHref, isSignedIn, wishlistedIds, priorityCount = 4,
}: {
  products: ProductListItem[];
  whatsappHref: string | null;
  isSignedIn: boolean;
  wishlistedIds?: Set<string>;
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          whatsappHref={whatsappHref}
          isSignedIn={isSignedIn}
          isWishlisted={wishlistedIds?.has(product.id)}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
