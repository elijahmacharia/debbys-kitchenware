import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE: Record<Tone, string> = {
  brand: 'bg-brand-600 text-white',
  accent: 'bg-accent-500 text-white',
  success: 'bg-success/10 text-success',
  warning: 'bg-accent-50 text-accent-700',
  danger: 'bg-danger/10 text-danger',
  neutral: 'border border-line bg-canvas text-muted',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('badge', TONE[tone], className)}>{children}</span>;
}

/**
 * Stock state as words plus colour, never colour alone — a colour-blind
 * customer must still be able to tell what is in stock.
 */
export function StockBadge({ stock, lowStockAt = 5 }: { stock: number; lowStockAt?: number }) {
  if (stock <= 0) return <Badge tone="danger">Out of stock</Badge>;
  if (stock <= lowStockAt) return <Badge tone="warning">Only {stock} left</Badge>;
  return <Badge tone="success">In stock</Badge>;
}
