'use client';

import { useState } from 'react';
import { useCart, type CartLine } from '@/components/cart/CartProvider';
import { CartIcon, CheckIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

/**
 * Add to cart. Disabled and relabelled when stock is zero rather than hidden,
 * so the card layout stays identical and the customer understands why they
 * cannot buy.
 */
export function AddToCartButton({
  line, quantity = 1, size = 'md', fullWidth, className,
}: {
  line: Omit<CartLine, 'quantity'>;
  quantity?: number;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const soldOut = line.stock <= 0;

  const handleClick = () => {
    if (soldOut) return;
    add(line, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={soldOut}
      className={cn(
        justAdded ? 'btn-secondary border-brand-300 bg-brand-50 text-brand-800' : 'btn-primary',
        size === 'sm' && 'btn-sm',
        fullWidth && 'w-full',
        className,
      )}
      aria-label={soldOut ? `${line.name} is out of stock` : `Add ${line.name} to cart`}
    >
      {justAdded ? <CheckIcon className="h-4 w-4" /> : <CartIcon className="h-4 w-4" />}
      {soldOut ? 'Out of stock' : justAdded ? 'Added' : 'Add to cart'}
    </button>
  );
}
