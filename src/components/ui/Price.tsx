import { cn } from '@/lib/cn';
import { discountPercent, effectivePriceCents, formatKsh, isOnSale } from '@/lib/money';

/**
 * Price display. When an item is on sale the original price is struck through
 * next to the new one, and the old value is wrapped in <s> so assistive
 * technology reads it as superseded rather than as a second price.
 */
export function Price({
  product, size = 'md', className,
}: {
  product: { priceCents: number; salePriceCents: number | null };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const now = effectivePriceCents(product);
  const sizes = { sm: 'text-sm', md: 'text-base sm:text-lg', lg: 'text-2xl sm:text-3xl' } as const;

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-bold text-ink', sizes[size])}>{formatKsh(now)}</span>
      {isOnSale(product) ? (
        <>
          <s className={cn('text-subtle', size === 'lg' ? 'text-base' : 'text-xs')}>{formatKsh(product.priceCents)}</s>
          <span className="badge bg-clay-600 text-white">-{discountPercent(product)}%</span>
        </>
      ) : null}
    </div>
  );
}
