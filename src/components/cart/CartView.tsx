'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { WhatsAppOrderButton } from '@/components/product/WhatsAppOrderButton';
import { CartIcon, ImageIcon, TrashIcon } from '@/components/icons';
import { formatKsh } from '@/lib/money';
import { orderMessage, waLink } from '@/lib/whatsapp';

/**
 * The cart page.
 *
 * Delivery is shown as "calculated at checkout" rather than guessed, because
 * the fee depends on an area the customer has not chosen yet. Quoting a number
 * here and a different one at checkout is the fastest way to lose an order.
 */
export function CartView({ deliveryAvailable }: { deliveryAvailable: boolean }) {
  const { lines, issues, ready, subtotalCents, setQuantity, remove, clear, dismissIssues } = useCart();

  if (!ready) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-card" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <>
        {issues.length > 0 ? <CartIssues issues={issues} onDismiss={dismissIssues} /> : null}
        <EmptyState
          icon={<CartIcon className="h-8 w-8" />}
          title="Your cart is empty"
          description="Your cart is saved on this device, so you can come back to it."
          action={
            <>
              <ButtonLink href="/shop">Start shopping</ButtonLink>
              <ButtonLink href="/categories" variant="secondary">Browse categories</ButtonLink>
            </>
          }
        />
      </>
    );
  }

  const whatsappHref = waLink(
    orderMessage({
      lines: lines.map((line) => ({ name: line.name, quantity: line.quantity, unitPriceCents: line.unitPriceCents })),
      subtotalCents,
      totalCents: subtotalCents,
    }),
  );

  return (
    <>
      {issues.length > 0 ? <CartIssues issues={issues} onDismiss={dismissIssues} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.productId} className="card flex gap-3 p-3">
                <Link href={`/product/${line.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-control border border-line bg-canvas sm:h-24 sm:w-24">
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt={line.name} fill sizes="96px" className="object-contain p-1" />
                  ) : (
                    <span className="grid h-full place-items-center text-subtle"><ImageIcon className="h-6 w-6" /></span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/product/${line.slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-clay-700">
                        {line.name}
                      </Link>
                      <p className="text-xs text-muted">
                        {formatKsh(line.unitPriceCents)} per {line.unit}
                        {line.listPriceCents > line.unitPriceCents ? <s className="ml-1.5 text-subtle">{formatKsh(line.listPriceCents)}</s> : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      className="-mr-1 -mt-1 rounded p-2 text-subtle hover:bg-canvas hover:text-danger"
                      aria-label={`Remove ${line.name} from cart`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                    <QuantityStepper
                      compact
                      value={line.quantity}
                      onChange={(next) => setQuantity(line.productId, next)}
                      max={line.stock}
                      label={`Quantity for ${line.name}`}
                    />
                    <p className="text-sm font-bold text-ink">{formatKsh(line.unitPriceCents * line.quantity)}</p>
                  </div>

                  {line.stock <= 5 ? <p className="text-xs font-medium text-clay-700">Only {line.stock} left in stock</p> : null}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/shop" variant="secondary" size="sm">Continue shopping</ButtonLink>
            <button
              type="button"
              onClick={() => { if (window.confirm('Remove everything from your cart?')) clear(); }}
              className="btn-ghost btn-sm border border-line text-danger"
            >
              Clear cart
            </button>
          </div>
        </div>

        <aside className="card sticky top-24 p-4" aria-label="Order summary">
          <h2 className="text-base font-bold">Order summary</h2>

          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatKsh(subtotalCents)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="text-right text-xs text-muted">{deliveryAvailable ? 'Calculated at checkout' : 'Ask us about your area'}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-semibold">Total so far</dt><dd className="font-bold">{formatKsh(subtotalCents)}</dd>
            </div>
          </dl>

          <p className="mt-1.5 text-xs text-muted">
            Pickup is free. Delivery is added at checkout before you confirm.
          </p>

          <div className="mt-4 space-y-2">
            <ButtonLink href="/checkout" fullWidth>Proceed to checkout</ButtonLink>
            <WhatsAppOrderButton href={whatsappHref} label="Ask about these items" fullWidth source="cart" />
          </div>

          <p className="mt-3 text-center text-xs text-muted">No account needed.</p>
        </aside>
      </div>
    </>
  );
}

function CartIssues({ issues, onDismiss }: { issues: { productId: string; message: string }[]; onDismiss: () => void }) {
  return (
    <Alert tone="warning" title="Your cart has changed" className="mb-4">
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {issues.map((issue) => <li key={issue.productId + issue.message}>{issue.message}</li>)}
      </ul>
      <button type="button" onClick={onDismiss} className="mt-2 text-xs font-semibold underline">Got it</button>
    </Alert>
  );
}
