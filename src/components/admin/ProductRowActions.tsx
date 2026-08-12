'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { EyeIcon, TrashIcon } from '@/components/icons';
import { deleteProductAction, toggleProductFlagAction } from '@/app/(admin)/admin/actions';

/**
 * Per-row actions for the product table.
 *
 * This is a client component on purpose. A server component cannot hand an
 * inline `() => action(id)` closure to the browser — React has no way to
 * serialise it — so the component imports the server actions itself and calls
 * them with the ids it was given as plain props.
 */
export function ProductRowActions({
  productId, name, slug, isActive, isFeatured,
}: { productId: string; name: string; slug: string; isActive: boolean; isFeatured: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  const run = async (key: string, work: () => Promise<{ ok: boolean; message?: string }>, confirmMessage?: string) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(key);
    try {
      const result = await work();
      if (result.message) push(result.message, result.ok ? 'success' : 'error');
      else if (!result.ok) push('That did not work. Please try again.', 'error');
      if (result.ok) startTransition(() => router.refresh());
    } catch {
      push('Something went wrong. Please try again.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-1">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => run('active', () => toggleProductFlagAction(productId, 'isActive', !isActive))}
        className="btn-secondary btn-sm"
        title={isActive ? 'Hide from the shop' : 'Show in the shop'}
      >
        {isActive ? 'Hide' : 'Show'}
      </button>

      <button
        type="button"
        disabled={busy !== null}
        onClick={() => run('featured', () => toggleProductFlagAction(productId, 'isFeatured', !isFeatured))}
        className="btn-secondary btn-sm"
        title="Toggle featured on the homepage"
      >
        {isFeatured ? 'Unfeature' : 'Feature'}
      </button>

      <Link href={`/product/${slug}`} target="_blank" className="btn-ghost btn-sm border border-line" title="View in the shop">
        <EyeIcon className="h-4 w-4" />
        <span className="sr-only">View {name} in the shop</span>
      </Link>

      <Link href={`/admin/products/${productId}`} className="btn-secondary btn-sm">Edit</Link>

      <button
        type="button"
        disabled={busy !== null}
        onClick={() => run(
          'delete',
          () => deleteProductAction(productId),
          `Delete "${name}"? If it has been ordered before it will be hidden instead, so your sales history stays intact.`,
        )}
        className="btn-ghost btn-sm border border-line text-danger"
        title="Delete"
      >
        <TrashIcon className="h-4 w-4" />
        <span className="sr-only">Delete {name}</span>
      </button>
    </div>
  );
}
